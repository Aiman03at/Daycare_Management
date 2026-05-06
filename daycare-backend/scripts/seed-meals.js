const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SEED_MEALS = [
  {
    mealType: "breakfast",
    note: "Oatmeal with banana slices. Very enthusiastic!",
    status: "all",
    group: "toddlers",
  },
  {
    mealType: "breakfast",
    note: "Toast and apple juice. Left some toast.",
    status: "most",
    group: "toddlers",
  },
  {
    mealType: "breakfast",
    note: "Scrambled eggs and whole wheat bread.",
    status: "all",
    group: "toddlers",
  },
  {
    mealType: "breakfast",
    note: "Pancakes with honey. Great appetite!",
    status: "all",
    group: "preschoolers",
  },
  {
    mealType: "breakfast",
    note: "Cereal with milk. Not hungry.",
    status: "some",
    group: "preschoolers",
  },
  {
    mealType: "breakfast",
    note: "Fruit salad with yogurt parfait. Very healthy choice!",
    status: "all",
    group: "kinder",
  },
  {
    mealType: "lunch",
    note: "Chicken and rice. Cleaned the plate!",
    status: "all",
    group: "toddlers",
  },
  {
    mealType: "lunch",
    note: "Pasta with vegetables. Refused carrots.",
    status: "most",
    group: "toddlers",
  },
  {
    mealType: "lunch",
    note: "Fish sticks with sweet potato fries.",
    status: "all",
    group: "toddlers",
  },
  {
    mealType: "lunch",
    note: "Sandwich and cucumber slices.",
    status: "all",
    group: "preschoolers",
  },
  {
    mealType: "lunch",
    note: "Not feeling well. Refused all food.",
    status: "refused",
    group: "preschoolers",
  },
  {
    mealType: "lunch",
    note: "Enjoyed the main course but skipped vegetables.",
    status: "most",
    group: "kinder",
  },
  {
    mealType: "snack",
    note: "Cheese and crackers. Loved it!",
    status: "all",
    group: "toddlers",
  },
  {
    mealType: "snack",
    note: "Fruit yogurt and granola.",
    status: "all",
    group: "toddlers",
  },
  {
    mealType: "snack",
    note: "Apple slices and nuts. Wanted more.",
    status: "most",
    group: "toddlers",
  },
  {
    mealType: "snack",
    note: "Peanut butter and banana on toast.",
    status: "all",
    group: "preschoolers",
  },
  {
    mealType: "snack",
    note: "Had a few crackers with juice.",
    status: "some",
    group: "preschoolers",
  },
  {
    mealType: "snack",
    note: "Trail mix with dried fruit.",
    status: "all",
    group: "kinder",
  },
];

function groupForAge(age) {
  if (age <= 2.5) {
    return "toddlers";
  }

  if (age < 4) {
    return "preschoolers";
  }

  return "kinder";
}

function shuffle(values) {
  const copy = [...values];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function pickRandom(values, count) {
  return shuffle(values).slice(0, count);
}

async function ensureSchema(client) {
  await client.query(`
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
  `);
}

async function seed() {
  const client = await pool.connect();

  try {
    await ensureSchema(client);

    const childrenResult = await client.query("SELECT id, name, age FROM children ORDER BY id ASC");
    const children = childrenResult.rows;

    if (children.length === 0) {
      throw new Error("No children found. Add children before seeding meals.");
    }

    await client.query("BEGIN");
    await client.query(
      "DELETE FROM meals WHERE note = ANY($1::text[])",
      [SEED_MEALS.map((meal) => meal.note)]
    );

    let totalMeals = 0;

    for (let index = 0; index < SEED_MEALS.length; index += 1) {
      const seedMeal = SEED_MEALS[index];

      const sameGroupChildren = children.filter(
        (child) => groupForAge(Number(child.age)) === seedMeal.group
      );
      const sourceChildren = sameGroupChildren.length > 0 ? sameGroupChildren : children;
      const targetCount = Math.min(
        sourceChildren.length,
        Math.max(1, 1 + Math.floor(Math.random() * 3))
      );
      const selectedChildren = pickRandom(sourceChildren, targetCount);

      for (const child of selectedChildren) {
        await client.query(
          `
            INSERT INTO meals (child_id, child_name, group_key, meal_type, status, note, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `,
          [child.id, child.name, seedMeal.group, seedMeal.mealType, seedMeal.status, seedMeal.note]
        );
        totalMeals += 1;
      }
    }

    await client.query("COMMIT");

    console.log(`✅ Successfully seeded meals database`);
    console.log(`   Created ${totalMeals} meal records`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding meals:", error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
