const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearMeals() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    
    const result = await client.query("DELETE FROM meals");
    
    await client.query("COMMIT");

    console.log(`✅ Successfully cleared all meals`);
    console.log(`   Deleted ${result.rowCount} meal records`);
    console.log(`   Table is now empty and ready for today's data`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error clearing meals:", error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

clearMeals();
