const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifySeeds() {
  try {
    const breakfast = await pool.query("SELECT COUNT(*) FROM meals WHERE meal_type = 'breakfast'");
    const lunch = await pool.query("SELECT COUNT(*) FROM meals WHERE meal_type = 'lunch'");
    const snack = await pool.query("SELECT COUNT(*) FROM meals WHERE meal_type = 'snack'");
    const total = await pool.query("SELECT COUNT(*) FROM meals");
    
    const groupBreakdown = await pool.query(
      "SELECT group_key, COUNT(*) as count FROM meals GROUP BY group_key ORDER BY group_key"
    );

    console.log("\n📊 Meals Database Summary");
    console.log("================================");
    console.log("\nMeals by type:");
    console.log(`  ☀️  Breakfast: ${breakfast.rows[0].count}`);
    console.log(`  🍽️  Lunch:     ${lunch.rows[0].count}`);
    console.log(`  🥪 Snack:     ${snack.rows[0].count}`);
    console.log(`  📈 Total:     ${total.rows[0].count}`);
    
    console.log("\nMeals by age group:");
    groupBreakdown.rows.forEach(row => {
      console.log(`  ${row.group_key}: ${row.count}`);
    });

    const sampleMeal = await pool.query("SELECT child_name, meal_type, status, note FROM meals LIMIT 1");
    if (sampleMeal.rows.length > 0) {
      const meal = sampleMeal.rows[0];
      console.log("\nSample meal record:");
      console.log(`  Child: ${meal.child_name}`);
      console.log(`  Type: ${meal.meal_type}`);
      console.log(`  Status: ${meal.status}`);
      console.log(`  Note: ${meal.note}`);
    }

    console.log("\n✅ Database seeding verified!\n");
  } catch (err) {
    console.error("❌ Error verifying seeds:", err.message);
  } finally {
    pool.end();
  }
}

verifySeeds();
