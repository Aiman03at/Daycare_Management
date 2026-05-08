import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let sleepSchemaReady: Promise<void> | null = null;

const ensureSleepSchema = async () => {
  if (!sleepSchemaReady) {
    sleepSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sleep (
          id SERIAL PRIMARY KEY,
          child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          child_name TEXT NOT NULL,
          group_key TEXT NOT NULL,
          duration TEXT NOT NULL,
          quality TEXT NOT NULL,
          note TEXT NOT NULL,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((error) => {
      sleepSchemaReady = null;
      throw error;
    });
  }

  await sleepSchemaReady;
};

router.get("/", async (req, res) => {
  try {
    await ensureSleepSchema();

    const groupQuery = req.query.group;
    let query = "SELECT * FROM sleep ORDER BY created_at DESC";
    const params: any[] = [];

    if (groupQuery) {
      query = "SELECT * FROM sleep WHERE group_key = $1 ORDER BY created_at DESC";
      params.push(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching sleep logs:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/child/:childId", async (req, res) => {
  try {
    await ensureSleepSchema();

    const { childId } = req.params;
    const result = await pool.query(
      "SELECT * FROM sleep WHERE child_id = $1 ORDER BY created_at DESC",
      [childId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching child sleep logs:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureSleepSchema();

    const { childId, childName, groupKey, duration, quality, note } = req.body;

    if (!childId || !childName || !groupKey || !duration || !quality) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
        INSERT INTO sleep (child_id, child_name, group_key, duration, quality, note, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `,
      [childId, childName, groupKey, duration, quality, note || "", req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating sleep log:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureSleepSchema();

    const { id } = req.params;
    const result = await pool.query("DELETE FROM sleep WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sleep log not found" });
    }

    res.json({ message: "Sleep log deleted", sleep: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting sleep log:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
export { ensureSleepSchema };
