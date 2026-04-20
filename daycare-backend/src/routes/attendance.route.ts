import { Router } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const ABSENT_REASONS = [
  "sick",
  "vacation",
  "home day",
  "appointment",
  "other",
] as const;

let attendanceSchemaReady: Promise<void> | null = null;

const ensureAttendanceSchema = async () => {
  if (!attendanceSchemaReady) {
    attendanceSchemaReady = (async () => {
      await pool.query(
        `
          ALTER TABLE attendance
          ADD COLUMN IF NOT EXISTS absent_reason TEXT
        `
      );
    })().catch((error) => {
      attendanceSchemaReady = null;
      throw error;
    });
  }

  await attendanceSchemaReady;
};

const getToday = () => new Date().toISOString().split("T")[0];

router.get("/roster", authMiddleware, async (_req, res) => {
  try {
    await ensureAttendanceSchema();
    const today = getToday();

    const result = await pool.query(
      `SELECT
        c.id AS child_id,
        c.name,
        c.age,
        c.parent_name,
        c.parent_phone,
        a.id,
        a.date,
        a.check_in,
        a.check_out,
        a.absent_reason
      FROM children c
      LEFT JOIN attendance a
        ON a.child_id = c.id
       AND a.date = $1
      ORDER BY c.age ASC, c.name ASC`,
      [today]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/checkin", authMiddleware, async (req, res) => {
  try {
    await ensureAttendanceSchema();
    const { child_id } = req.body;
    const today = getToday();

    const existing = await pool.query(
      "SELECT * FROM attendance WHERE child_id=$1 AND date=$2",
      [child_id, today]
    );

    if (existing.rows.length > 0) {
      const record = existing.rows[0];

      if (record.check_in && !record.check_out) {
        return res.status(400).json({ message: "Already checked in" });
      }

      const updated = await pool.query(
        `UPDATE attendance
         SET check_in = NOW(),
             check_out = NULL,
             absent_reason = NULL
         WHERE child_id=$1 AND date=$2
         RETURNING *`,
        [child_id, today]
      );

      return res.json(updated.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO attendance (child_id, date, check_in, absent_reason)
       VALUES ($1,$2,NOW(),NULL)
       RETURNING *`,
      [child_id, today]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/absent", authMiddleware, async (req, res) => {
  try {
    await ensureAttendanceSchema();
    const { child_id, absent_reason } = req.body;
    const today = getToday();

    if (!ABSENT_REASONS.includes(absent_reason)) {
      return res.status(400).json({ message: "Invalid absent reason" });
    }

    const existing = await pool.query(
      "SELECT * FROM attendance WHERE child_id=$1 AND date=$2",
      [child_id, today]
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE attendance
         SET check_in = NULL,
             check_out = NULL,
             absent_reason = $3
         WHERE child_id=$1 AND date=$2
         RETURNING *`,
        [child_id, today, absent_reason]
      );

      return res.json(updated.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO attendance (child_id, date, check_in, check_out, absent_reason)
       VALUES ($1,$2,NULL,NULL,$3)
       RETURNING *`,
      [child_id, today, absent_reason]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    await ensureAttendanceSchema();
    const { child_id } = req.body;
    const today = getToday();

    const result = await pool.query(
      `UPDATE attendance
       SET check_out = NOW()
       WHERE child_id=$1 AND date=$2 AND check_in IS NOT NULL
       RETURNING *`,
      [child_id, today]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/today", authMiddleware, async (_req, res) => {
  try {
    await ensureAttendanceSchema();
    const today = getToday();

    const result = await pool.query(
      `SELECT a.*, c.name, c.age
       FROM attendance a
       JOIN children c ON a.child_id = c.id
       WHERE date=$1
       ORDER BY c.age ASC, c.name ASC`,
      [today]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
