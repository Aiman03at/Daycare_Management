import { Router } from "express";
import pool from "../db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

let mealsSchemaReady: Promise<void> | null = null;

const ensureMealsSchema = async () => {
  if (!mealsSchemaReady) {
    mealsSchemaReady = (async () => {
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS meals (
            id SERIAL PRIMARY KEY,
            child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
            child_name TEXT NOT NULL,
            group_key TEXT NOT NULL,
            meal_type TEXT NOT NULL,
            status TEXT NOT NULL,
            note TEXT NOT NULL,
            image_path TEXT,
            created_by INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `
      );
    })().catch((error) => {
      mealsSchemaReady = null;
      throw error;
    });
  }

  await mealsSchemaReady;
};

// Get all meals
router.get("/", async (req, res) => {
  try {
    await ensureMealsSchema();

    const groupQuery = req.query.group;
    let query = "SELECT * FROM meals ORDER BY created_at DESC";
    const params: any[] = [];

    if (groupQuery) {
      query = "SELECT * FROM meals WHERE group_key = $1 ORDER BY created_at DESC";
      params.push(groupQuery);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching meals:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get meals for a specific child
router.get("/child/:childId", async (req, res) => {
  try {
    await ensureMealsSchema();

    const { childId } = req.params;
    const result = await pool.query(
      "SELECT * FROM meals WHERE child_id = $1 ORDER BY created_at DESC",
      [childId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching child meals:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new meal entry
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMealsSchema();

    const { childId, childName, groupKey, mealType, status, note, imagePath } = req.body;

    if (!childId || !childName || !groupKey || !mealType || !status || !note) {
      return res.status(400).json({
        error: "Missing required fields: childId, childName, groupKey, mealType, status, note",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO meals (child_id, child_name, group_key, meal_type, status, note, image_path, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `,
      [childId, childName, groupKey, mealType, status, note, imagePath || null, req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating meal:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk create meals (for multiple children with same meal info)
router.post("/bulk", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMealsSchema();

    const { childIds, childNames, groupKey, mealType, status, note, imagePath } = req.body;

    if (
      !childIds ||
      !Array.isArray(childIds) ||
      !childNames ||
      !Array.isArray(childNames) ||
      !groupKey ||
      !mealType ||
      !status ||
      !note
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: childIds (array), childNames (array), groupKey, mealType, status, note",
      });
    }

    if (childIds.length !== childNames.length) {
      return res.status(400).json({
        error: "childIds and childNames arrays must have the same length",
      });
    }

    const createdMeals = [];

    for (let i = 0; i < childIds.length; i++) {
      const result = await pool.query(
        `
          INSERT INTO meals (child_id, child_name, group_key, meal_type, status, note, image_path, created_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *
        `,
        [childIds[i], childNames[i], groupKey, mealType, status, note, imagePath || null, req.user?.id || null]
      );

      createdMeals.push(result.rows[0]);
    }

    res.status(201).json(createdMeals);
  } catch (error: any) {
    console.error("Error creating bulk meals:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a meal
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ensureMealsSchema();

    const { id } = req.params;

    const result = await pool.query("DELETE FROM meals WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }

    res.json({ message: "Meal deleted successfully", meal: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting meal:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
