import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let announcementsSchemaReady: Promise<void> | null = null;

const ensureAnnouncementsSchema = async () => {
  if (!announcementsSchemaReady) {
    announcementsSchemaReady = pool
      .query(
        `
          CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            detail TEXT NOT NULL,
            announcement_date DATE NOT NULL,
            created_by INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `
      )
      .then(() => undefined)
      .catch((error) => {
        announcementsSchemaReady = null;
        throw error;
      });
  }

  await announcementsSchemaReady;
};

const isStaffRole = (role: unknown) => {
  const normalizedRole = String(role || "").toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "educator";
};

router.get("/", authMiddleware, async (_req, res) => {
  try {
    await ensureAnnouncementsSchema();

    const result = await pool.query(
      `
        SELECT id, title, detail, announcement_date, created_by, created_at
        FROM announcements
        ORDER BY announcement_date DESC, created_at DESC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load announcements" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureAnnouncementsSchema();

    if (!isStaffRole(req.user?.role)) {
      return res.status(403).json({ message: "Only admins and educators can post announcements" });
    }

    const { title, detail } = req.body;
    const announcement_date = req.body.announcement_date ?? req.body.announcementDate;

    if (!title || !detail || !announcement_date) {
      return res.status(400).json({ message: "Title, detail, and announcement date are required" });
    }

    const result = await pool.query(
      `
        INSERT INTO announcements (title, detail, announcement_date, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, detail, announcement_date, created_by, created_at
      `,
      [title, detail, announcement_date, req.user?.id ?? null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

export default router;
