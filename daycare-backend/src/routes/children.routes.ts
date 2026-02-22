import { Router } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/role";
const router = Router();  

// create child
router.post("/",authMiddleware, async (req, res) => {
  const { name, age, parent_name, parent_phone } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO children(name, age, parent_name, parent_phone)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [name, age, parent_name, parent_phone]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});



// GET all children
router.get("/", authMiddleware, async (req, res) => {
  try {
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
    const { id } = req.params;
    const { name, age, parent_name, parent_phone } = req.body;

    const result = await pool.query(
      `UPDATE children
       SET name=$1, age=$2, parent_name=$3, parent_phone=$4
       WHERE id=$5
       RETURNING *`,
      [name, age, parent_name, parent_phone, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Child not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});


//DELETE CHILD
router.delete("/:id", authMiddleware,requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM children WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Child not found" });

    res.json({ message: "Child deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;