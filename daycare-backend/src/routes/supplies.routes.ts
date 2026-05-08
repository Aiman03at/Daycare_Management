import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let suppliesSchemaReady: Promise<void> | null = null;

const ensureSuppliesSchema = async () => {
  if (!suppliesSchemaReady) {
    suppliesSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS supplies (
          id SERIAL PRIMARY KEY,
          child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          child_name TEXT NOT NULL,
          group_key TEXT NOT NULL,
          item TEXT NOT NULL,
          status TEXT NOT NULL,
          note TEXT NOT NULL,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((error) => {
      suppliesSchemaReady = null;
      throw error;
    });
  }

  await suppliesSchemaReady;
};

router.get("/", async (req, res) => {
  try {
    await ensureSuppliesSchema();

    const groupQuery = req.query.group;
    let query = "SELECT * FROM supplies ORDER BY created_at DESC";
    const params: any[] = [];

    if (groupQuery) {
      query = "SELECT * FROM supplies WHERE group_key = $1 ORDER BY created_at DESC";
      params.push(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching supplies:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/child/:childId", async (req, res) => {
  try {
    await ensureSuppliesSchema();

    const { childId } = req.params;
    const result = await pool.query(
      "SELECT * FROM supplies WHERE child_id = $1 ORDER BY created_at DESC",
      [childId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching child supplies:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureSuppliesSchema();

    const { childId, childName, groupKey, item, status, note } = req.body;

    if (!childId || !childName || !groupKey || !item || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
        INSERT INTO supplies (child_id, child_name, group_key, item, status, note, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `,
      [childId, childName, groupKey, item, status, note || "", req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating supply:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureSuppliesSchema();

    const { id } = req.params;
    const result = await pool.query("DELETE FROM supplies WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supply record not found" });
    }

    res.json({ message: "Supply record deleted", supply: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting supply record:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
export { ensureSuppliesSchema };
