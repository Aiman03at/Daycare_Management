const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkToilets() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'toilets' ORDER BY ordinal_position"
    );

    if (res.rows.length === 0) {
      console.log("❌ Toilets table does not exist yet");
    } else {
      console.log("✅ Toilets table columns:");
      res.rows.forEach((row) => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

checkToilets();
