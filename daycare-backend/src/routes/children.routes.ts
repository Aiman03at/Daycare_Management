import { Router } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/role";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
const router = Router();  

const uploadsDirectory = path.join(__dirname, "..", "..", "uploads", "children");

let childSchemaReady: Promise<void> | null = null;

const ensureChildrenSchema = async () => {
  if (!childSchemaReady) {
    childSchemaReady = (async () => {
      await fs.mkdir(uploadsDirectory, { recursive: true });
      await pool.query(
        `
          ALTER TABLE children
          ADD COLUMN IF NOT EXISTS birth_date DATE
        `
      );
      await pool.query(
        `
          ALTER TABLE children
          ADD COLUMN IF NOT EXISTS gender TEXT
        `
      );
      await pool.query(
        `
          ALTER TABLE children
          ADD COLUMN IF NOT EXISTS profile_pic TEXT
        `
      );
    })().catch((error) => {
      childSchemaReady = null;
      throw error;
    });
  }

  await childSchemaReady;
};

const normalizeStoredUploadPath = (value: string) => {
  const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

  if (value.startsWith("data:image/jpeg;base64,")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return value;
  }

  if (value.startsWith(`${backendBaseUrl}/uploads/`)) {
    return value.replace(backendBaseUrl, "");
  }

  return null;
};

const saveJpegUpload = async (dataUri: string) => {
  const encoded = dataUri.replace("data:image/jpeg;base64,", "");
  const filename = `${Date.now()}-${crypto.randomUUID()}.jpg`;
  const absoluteFilePath = path.join(uploadsDirectory, filename);

  await fs.writeFile(absoluteFilePath, Buffer.from(encoded, "base64"));

  return `/uploads/children/${filename}`;
};

const removeStoredUpload = async (value: string | null | undefined) => {
  if (!value) {
    return;
  }

  const normalized = normalizeStoredUploadPath(value);

  if (!normalized || !normalized.startsWith("/uploads/children/")) {
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

const resolveProfilePictureValue = async (value: unknown, currentValue?: string | null) => {
  if (value == null || value === "") {
    if (currentValue) {
      await removeStoredUpload(currentValue);
    }

    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value.startsWith("data:image/jpeg;base64,")) {
    const savedPath = await saveJpegUpload(value);

    if (currentValue && currentValue !== savedPath) {
      await removeStoredUpload(currentValue);
    }

    return savedPath;
  }

  const normalizedExistingPath = normalizeStoredUploadPath(value);

  if (normalizedExistingPath) {
    return normalizedExistingPath;
  }

  throw new Error("Profile picture must be a JPEG upload");
};

// create child
router.post("/",authMiddleware, async (req, res) => {
  const { name, age } = req.body;
  const parent_name = req.body.parent_name ?? req.body.parentName;
  const parent_phone = req.body.parent_phone ?? req.body.parentPhone;
  const birth_date = req.body.birth_date ?? req.body.birthDate ?? null;
  const gender = req.body.gender ?? null;
  const profile_pic = req.body.profile_pic ?? req.body.profilePic ?? null;

  try {
    await ensureChildrenSchema();
    const resolvedProfilePicture = await resolveProfilePictureValue(profile_pic);

    const result = await pool.query(
      `INSERT INTO children(name, age, parent_name, parent_phone, birth_date, gender, profile_pic)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, age, parent_name, parent_phone, birth_date, gender, resolvedProfilePicture]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message === "Profile picture must be a JPEG upload") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "DB error" });
  }
});



// GET all children
router.get("/", authMiddleware, async (req, res) => {
  try {
    await ensureChildrenSchema();
    const result = await pool.query("SELECT * FROM children ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});


//GET SINGLE CHILD BY ID

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    await ensureChildrenSchema();
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM children WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Child not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});


//Uodate Child
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    await ensureChildrenSchema();
    const { id } = req.params;
    const { name, age } = req.body;
    const parent_name = req.body.parent_name ?? req.body.parentName;
    const parent_phone = req.body.parent_phone ?? req.body.parentPhone;
    const birth_date = req.body.birth_date ?? req.body.birthDate ?? null;
    const gender = req.body.gender ?? null;
    const profile_pic = req.body.profile_pic ?? req.body.profilePic ?? null;
    const currentChild = await pool.query(
      "SELECT profile_pic FROM children WHERE id=$1",
      [id]
    );

    if (currentChild.rows.length === 0) {
      return res.status(404).json({ message: "Child not found" });
    }

    const resolvedProfilePicture = await resolveProfilePictureValue(
      profile_pic,
      currentChild.rows[0].profile_pic
    );

    const result = await pool.query(
      `UPDATE children
       SET name=$1, age=$2, parent_name=$3, parent_phone=$4, birth_date=$5, gender=$6, profile_pic=$7
       WHERE id=$8
       RETURNING *`,
      [name, age, parent_name, parent_phone, birth_date, gender, resolvedProfilePicture, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message === "Profile picture must be a JPEG upload") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "DB error" });
  }
});


//DELETE CHILD
router.delete("/:id", authMiddleware,requireAdmin, async (req, res) => {
  try {
    await ensureChildrenSchema();
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM children WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Child not found" });

    await removeStoredUpload(result.rows[0].profile_pic);

    res.json({ message: "Child deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
