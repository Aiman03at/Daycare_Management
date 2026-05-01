const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const activityAssetsDirectory = path.join(
  __dirname,
  "..",
  "..",
  "daycare-frontend",
  "public",
  "kids-assets",
  "activities"
);
const activityAssetsPublicPath = "/kids-assets/activities";

const SEED_ACTIVITIES = [
  {
    title: "Color Mixing Lab",
    note: "Children explored primary colors and predicted what would happen when they blended paints.",
    group: "preschoolers",
    educator: "Ms. Amina",
  },
  {
    title: "Story Circle and Puppets",
    note: "The class acted out story scenes and practiced turn-taking and expressive language.",
    group: "toddlers",
    educator: "Mr. Noah",
  },
  {
    title: "Nature Hunt Walk",
    note: "Kids collected leaves and compared shapes, sizes, and textures from the playground.",
    group: "kinder",
    educator: "Ms. Rhea",
  },
  {
    title: "Building Bridges",
    note: "Small teams designed paper bridges and tested how many blocks each bridge could hold.",
    group: "kinder",
    educator: "Mr. Owen",
  },
  {
    title: "Music and Movement",
    note: "Children followed rhythm cards and used scarves to move fast, slow, and freeze.",
    group: "toddlers",
    educator: "Ms. Sofia",
  },
  {
    title: "Garden Journal Time",
    note: "Learners observed planter growth and drew before-and-after sketches in journals.",
    group: "preschoolers",
    educator: "Ms. Priya",
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

async function getActivityAssetPaths() {
  const files = await fs.readdir(activityAssetsDirectory);

  const imageFiles = files.filter((file) => /\.(png|jpe?g|webp|svg)$/i.test(file));

  if (imageFiles.length === 0) {
    throw new Error("No activity images found in daycare-frontend/public/kids-assets/activities");
  }

  return imageFiles.map((file) => `${activityAssetsPublicPath}/${file}`);
}

async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      group_key TEXT NOT NULL,
      educator TEXT NOT NULL,
      created_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS activity_photos (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS activity_children (
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      PRIMARY KEY (activity_id, child_id)
    )
  `);
}

async function seed() {
  const client = await pool.connect();

  try {
    await ensureSchema(client);
    const availableAssetPaths = await getActivityAssetPaths();

    const childrenResult = await client.query("SELECT id, name, age FROM children ORDER BY id ASC");
    const children = childrenResult.rows;

    if (children.length === 0) {
      throw new Error("No children found. Add children before seeding activities.");
    }

    await client.query("BEGIN");
    await client.query(
      "DELETE FROM activities WHERE title LIKE '[Seed] %' OR title = ANY($1::text[])",
      [SEED_ACTIVITIES.map((activity) => activity.title)]
    );

    let totalPhotos = 0;
    let totalTaggedRows = 0;

    for (let index = 0; index < SEED_ACTIVITIES.length; index += 1) {
      const seedActivity = SEED_ACTIVITIES[index];

      const createResult = await client.query(
        `
          INSERT INTO activities (title, note, group_key, educator)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [seedActivity.title, seedActivity.note, seedActivity.group, seedActivity.educator]
      );

      const activityId = createResult.rows[0].id;
      const photoCount = 2 + Math.floor(Math.random() * 2);
      const selectedPhotos = pickRandom(
        availableAssetPaths,
        Math.min(photoCount, availableAssetPaths.length)
      );

      for (const imagePath of selectedPhotos) {

        await client.query(
          "INSERT INTO activity_photos (activity_id, image_path) VALUES ($1, $2)",
          [activityId, imagePath]
        );

        totalPhotos += 1;
      }

      const sameGroupChildren = children.filter(
        (child) => groupForAge(Number(child.age)) === seedActivity.group
      );
      const sourceChildren = sameGroupChildren.length > 0 ? sameGroupChildren : children;
      const targetTagCount = Math.min(
        sourceChildren.length,
        Math.max(1, 1 + Math.floor(Math.random() * 4))
      );
      const taggedChildren = pickRandom(sourceChildren, targetTagCount);

      for (const child of taggedChildren) {
        await client.query(
          "INSERT INTO activity_children (activity_id, child_id) VALUES ($1, $2)",
          [activityId, child.id]
        );
        totalTaggedRows += 1;
      }
    }

    await client.query("COMMIT");

    console.log(`Seeded ${SEED_ACTIVITIES.length} activities with ${totalPhotos} photos and ${totalTaggedRows} child tags.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => {
    console.log("Activities seed completed.");
  })
  .catch((error) => {
    console.error("Activities seed failed:", error.message || error);
    process.exitCode = 1;
  });
