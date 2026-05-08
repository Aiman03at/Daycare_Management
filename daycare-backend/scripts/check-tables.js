const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tables = ["incidents", "health", "sleep", "supplies"];

async function check() {
  try {
    for (const table of tables) {
      const res = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
        [table]
      );

      if (res.rows.length === 0) {
        console.log(`❌ ${table} table does not exist yet`);
      } else {
        console.log(`✅ ${table} table columns:`);
        res.rows.forEach((row) => {
          console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
      }
      console.log("");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

check();
