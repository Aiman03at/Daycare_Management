import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

const uploadsDirectory = path.join(__dirname, "..", "..", "uploads", "activities");

let activitiesSchemaReady: Promise<void> | null = null;

const ensureActivitiesSchema = async () => {
  if (!activitiesSchemaReady) {
    activitiesSchemaReady = (async () => {
      await fs.mkdir(uploadsDirectory, { recursive: true });

      // Create the merged activities table with JSON arrays
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS activities (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            note TEXT NOT NULL,
            group_key TEXT NOT NULL,
            educator TEXT NOT NULL,
            created_by INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            photos JSONB DEFAULT '[]'::jsonb,
            tagged_children JSONB DEFAULT '[]'::jsonb
          )
        `
      );

      // Add missing columns if they don't exist
      await pool.query(
        `
          ALTER TABLE activities
          ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb
        `
      );

      await pool.query(
        `
          ALTER TABLE activities
          ADD COLUMN IF NOT EXISTS tagged_children JSONB DEFAULT '[]'::jsonb
        `
      );

      // Check if old tables exist and migrate data if needed
      const oldTablesCheck = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_photos')`
      );

      if (oldTablesCheck.rows[0].exists) {
        console.log("Migrating data from old activity tables...");
        
        try {
          // Migrate photos data
          await pool.query(`
            UPDATE activities a
            SET photos = COALESCE((
              SELECT jsonb_agg(ap.image_path ORDER BY ap.id)
              FROM activity_photos ap
              WHERE ap.activity_id = a.id
            ), '[]'::jsonb)
            WHERE photos = '[]'::jsonb
          `);

          // Migrate children data
          await pool.query(`
            UPDATE activities a
            SET tagged_children = COALESCE((
              SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
              FROM activity_children ac
              JOIN children c ON c.id = ac.child_id
              WHERE ac.activity_id = a.id
            ), '[]'::jsonb)
            WHERE tagged_children = '[]'::jsonb
          `);

          // Drop old tables
          await pool.query(`DROP TABLE IF EXISTS activity_children CASCADE`);
          await pool.query(`DROP TABLE IF EXISTS activity_photos CASCADE`);

          console.log("Migration completed successfully!");
        } catch (migrationError) {
          console.error("Migration error:", migrationError);
          // Continue anyway as data might already be migrated
        }
      }
    })().catch((error) => {
      activitiesSchemaReady = null;
      throw error;
    });
  }

  await activitiesSchemaReady;
};

const isStaffRole = (role: unknown) => {
  const normalizedRole = String(role || "").toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "educator";
};

const normalizeStoredUploadPath = (value: string) => {
  const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

  if (value.startsWith("/uploads/activities/")) {
    return value;
  }

  if (value.startsWith(`${backendBaseUrl}/uploads/activities/`)) {
    return value.replace(backendBaseUrl, "");
  }

  return null;
};

const removeStoredUpload = async (value: string | null | undefined) => {
  if (!value) {
    return;
  }

  const normalized = normalizeStoredUploadPath(value);

  if (!normalized) {
    return;
  }

  const filename = path.basename(normalized);
  const absoluteFilePath = path.join(uploadsDirectory, filename);

  try {
    await fs.unlink(absoluteFilePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

const saveUploadedPhoto = async (dataUri: string) => {
  const match = dataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);

  if (!match) {
    throw new Error("Photos must be JPG, PNG, or WEBP uploads");
  }

  const mimeSubtype = match[1].toLowerCase();
  const extension = mimeSubtype === "jpeg" ? "jpg" : mimeSubtype;
  const encodedImage = match[2];
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const absoluteFilePath = path.join(uploadsDirectory, filename);

  await fs.writeFile(absoluteFilePath, Buffer.from(encodedImage, "base64"));

  return `/uploads/activities/${filename}`;
};

const resolvePhotoPath = async (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Photos must be valid image uploads");
  }

  if (value.startsWith("data:image/")) {
    return saveUploadedPhoto(value);
  }

  const normalizedPath = normalizeStoredUploadPath(value);

  if (normalizedPath) {
    return normalizedPath;
  }

  throw new Error("Photos must be valid image uploads");
};

const ACTIVITY_SELECT_QUERY = `
  SELECT
    id,
    title,
    note,
    group_key AS "group",
    educator,
    created_by,
    created_at,
    photos,
    tagged_children
  FROM activities
`;

router.get("/", authMiddleware, async (_req, res) => {
  try {
    await ensureActivitiesSchema();

    const result = await pool.query(
      `${ACTIVITY_SELECT_QUERY}
       ORDER BY created_at DESC, id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Activities GET error:", error);
    res.status(500).json({ error: "Failed to load activities", details: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  await ensureActivitiesSchema();

  if (!isStaffRole(req.user?.role)) {
    return res.status(403).json({ message: "Only admins and educators can create activities" });
  }

  const title = String(req.body.title ?? "").trim();
  const note = String(req.body.note ?? "").trim();
  const group = String(req.body.group ?? "").trim();
  const educator = String(req.body.educator ?? "").trim();
  const photoInputs = Array.isArray(req.body.photos) ? req.body.photos : [];
  const childIdInputs = Array.isArray(req.body.child_ids)
    ? req.body.child_ids
    : Array.isArray(req.body.childIds)
      ? req.body.childIds
      : [];

  if (!title || !note || !group || !educator) {
    return res.status(400).json({ message: "Title, note, group, and educator are required" });
  }

  const childIds = Array.from(
    new Set(
      childIdInputs
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isInteger(value) && value > 0)
    )
  );

  if (childIds.length === 0) {
    return res.status(400).json({ message: "Please tag at least one child" });
  }

  try {
    const childCheck = await pool.query("SELECT id FROM children WHERE id = ANY($1::int[])", [childIds]);

    if (childCheck.rows.length !== childIds.length) {
      return res.status(400).json({ message: "One or more tagged children do not exist" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to validate tagged children" });
  }

  const client = await pool.connect();
  const savedPhotoPaths: string[] = [];

  try {
    await client.query("BEGIN");

    // Process and save photos
    const processedPhotos: string[] = [];
    for (const value of photoInputs) {
      const resolvedPhotoPath = await resolvePhotoPath(value);
      savedPhotoPaths.push(resolvedPhotoPath);
      processedPhotos.push(resolvedPhotoPath);
    }

    // Get child data for tagged_children
    const childrenResult = await client.query(
      `SELECT id, name FROM children WHERE id = ANY($1::int[]) ORDER BY name`,
      [childIds]
    );
    const taggedChildren = childrenResult.rows.map(row => ({
      id: row.id,
      name: row.name
    }));

    // Insert activity with photos and children as JSON arrays
    const createActivityResult = await client.query(
      `
        INSERT INTO activities (title, note, group_key, educator, created_by, photos, tagged_children)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [title, note, group, educator, req.user?.id ?? null, JSON.stringify(processedPhotos), JSON.stringify(taggedChildren)]
    );

    const activityId = createActivityResult.rows[0].id;

    const createdActivityResult = await client.query(
      `${ACTIVITY_SELECT_QUERY}
       WHERE id = $1`,
      [activityId]
    );

    await client.query("COMMIT");

    res.status(201).json(createdActivityResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    await Promise.all(
      savedPhotoPaths.map(async (value) => {
        try {
          await removeStoredUpload(value);
        } catch (removeError) {
          console.error(removeError);
        }
      })
    );

    console.error(error);

    if (
      error instanceof Error &&
      (error.message === "Photos must be JPG, PNG, or WEBP uploads" ||
        error.message === "Photos must be valid image uploads")
    ) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ error: "Failed to create activity" });
  } finally {
    client.release();
  }
});

export default router;