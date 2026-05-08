import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let healthSchemaReady: Promise<void> | null = null;

const ensureHealthSchema = async () => {
  if (!healthSchemaReady) {
    healthSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS health (
          id SERIAL PRIMARY KEY,
          child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          child_name TEXT NOT NULL,
          group_key TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL,
          note TEXT NOT NULL,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((error) => {
      healthSchemaReady = null;
      throw error;
    });
  }

  await healthSchemaReady;
};

router.get("/", async (req, res) => {
  try {
    await ensureHealthSchema();

    const groupQuery = req.query.group;
    let query = "SELECT * FROM health ORDER BY created_at DESC";
    const params: any[] = [];

    if (groupQuery) {
      query = "SELECT * FROM health WHERE group_key = $1 ORDER BY created_at DESC";
      params.push(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching health logs:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/child/:childId", async (req, res) => {
  try {
    await ensureHealthSchema();

    const { childId } = req.params;
    const result = await pool.query(
      "SELECT * FROM health WHERE child_id = $1 ORDER BY created_at DESC",
      [childId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching child health logs:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureHealthSchema();

    const { childId, childName, groupKey, category, status, note } = req.body;

    if (!childId || !childName || !groupKey || !category || !status || !note) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
        INSERT INTO health (child_id, child_name, group_key, category, status, note, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `,
      [childId, childName, groupKey, category, status, note || "", req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating health log:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureHealthSchema();

    const { id } = req.params;
    const result = await pool.query("DELETE FROM health WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Health log not found" });
    }

    res.json({ message: "Health log deleted", health: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting health log:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
export { ensureHealthSchema };
