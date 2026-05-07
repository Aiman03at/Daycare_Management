import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let toiletsSchemaReady: Promise<void> | null = null;

const ensureToiletsSchema = async () => {
  if (!toiletsSchemaReady) {
    toiletsSchemaReady = (async () => {
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS toilets (
            id SERIAL PRIMARY KEY,
            child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
            child_name TEXT NOT NULL,
            group_key TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            note TEXT NOT NULL,
            created_by INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `
      );
    })().catch((error) => {
      toiletsSchemaReady = null;
      throw error;
    });
  }

  await toiletsSchemaReady;
};

// Get all toilets
router.get("/", async (req, res) => {
  try {
    await ensureToiletsSchema();

    const groupQuery = req.query.group;
    let query = "SELECT * FROM toilets ORDER BY created_at DESC";
    const params: any[] = [];

    if (groupQuery) {
      query = "SELECT * FROM toilets WHERE group_key = $1 ORDER BY created_at DESC";
      params.push(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching toilets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get toilets for today
router.get("/today", async (req, res) => {
  try {
    await ensureToiletsSchema();

    const groupQuery = req.query.group;
    const today = new Date().toISOString().split("T")[0];
    
    let query = `
      SELECT * FROM toilets 
      WHERE DATE(created_at) = $1
      ORDER BY child_name ASC, created_at DESC
    `;
    const params: any[] = [today];

    if (groupQuery) {
      query = `
        SELECT * FROM toilets 
        WHERE group_key = $1 AND DATE(created_at) = $2
        ORDER BY child_name ASC, created_at DESC
      `;
      params.unshift(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching today's toilets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get toilets for a specific child
router.get("/child/:childId", async (req, res) => {
  try {
    await ensureToiletsSchema();

    const { childId } = req.params;
    const result = await pool.query(
      "SELECT * FROM toilets WHERE child_id = $1 ORDER BY created_at DESC",
      [childId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching child toilets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new toilet entry
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureToiletsSchema();

    const { childId, childName, groupKey, type, status, note } = req.body;

    if (!childId || !childName || !groupKey || !type || !status) {
      return res.status(400).json({
        error: "Missing required fields: childId, childName, groupKey, type, status",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO toilets (child_id, child_name, group_key, type, status, note, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `,
      [childId, childName, groupKey, type, status, note || "", req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating toilet entry:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk create toilet entries (for multiple children with same toilet info)
router.post("/bulk", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureToiletsSchema();

    const { childIds, childNames, groupKey, type, status, note } = req.body;

    if (
      !childIds ||
      !Array.isArray(childIds) ||
      !childNames ||
      !Array.isArray(childNames) ||
      !groupKey ||
      !type ||
      !status
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: childIds (array), childNames (array), groupKey, type, status",
      });
    }

    if (childIds.length !== childNames.length) {
      return res.status(400).json({
        error: "childIds and childNames arrays must have the same length",
      });
    }

    const createdToilets = [];

    for (let i = 0; i < childIds.length; i++) {
      const result = await pool.query(
        `
          INSERT INTO toilets (child_id, child_name, group_key, type, status, note, created_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `,
        [childIds[i], childNames[i], groupKey, type, status, note || "", req.user?.id || null]
      );

      createdToilets.push(result.rows[0]);
    }

    res.status(201).json(createdToilets);
  } catch (error: any) {
    console.error("Error creating bulk toilets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a toilet entry
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureToiletsSchema();

    const { id } = req.params;

    const result = await pool.query("DELETE FROM toilets WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Toilet entry not found" });
    }

    res.json({ message: "Toilet entry deleted successfully", toilet: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting toilet entry:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

export { ensureToiletsSchema };
