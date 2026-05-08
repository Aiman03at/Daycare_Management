import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let incidentsSchemaReady: Promise<void> | null = null;

const ensureIncidentsSchema = async () => {
  if (!incidentsSchemaReady) {
    incidentsSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS incidents (
          id SERIAL PRIMARY KEY,
          child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          child_name TEXT NOT NULL,
          group_key TEXT NOT NULL,
          category TEXT NOT NULL,
          severity TEXT NOT NULL,
          note TEXT NOT NULL,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((error) => {
      incidentsSchemaReady = null;
      throw error;
    });
  }

  await incidentsSchemaReady;
};

router.get("/", async (req, res) => {
  try {
    await ensureIncidentsSchema();

    const groupQuery = req.query.group;
    let query = "SELECT * FROM incidents ORDER BY created_at DESC";
    const params: any[] = [];

    if (groupQuery) {
      query = "SELECT * FROM incidents WHERE group_key = $1 ORDER BY created_at DESC";
      params.push(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/child/:childId", async (req, res) => {
  try {
    await ensureIncidentsSchema();

    const { childId } = req.params;
    const result = await pool.query(
      "SELECT * FROM incidents WHERE child_id = $1 ORDER BY created_at DESC",
      [childId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching child incidents:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureIncidentsSchema();

    const { childId, childName, groupKey, category, severity, note } = req.body;

    if (!childId || !childName || !groupKey || !category || !severity || !note) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
        INSERT INTO incidents (child_id, child_name, group_key, category, severity, note, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `,
      [childId, childName, groupKey, category, severity, note || "", req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating incident:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureIncidentsSchema();

    const { id } = req.params;
    const result = await pool.query("DELETE FROM incidents WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json({ message: "Incident deleted", incident: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting incident:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
export { ensureIncidentsSchema };
