import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { pool } from "../src/config/database.js";
import { generateToken } from "../src/service/jwt-service.js";
import type { JWTPayload } from "../schemas/auth-schema.js";

const TOTAL_USERS = 100;
const MIN_NOTES_PER_USER = 10;
const MAX_NOTES_PER_USER = 20;
const DEFAULT_PASSWORD = "Password123!";

const SAMPLE_TITLES = [
  "Review pull request #42",
  "Prepare slides for sprint review",
  "Buy groceries for dinner",
  "Dentist appointment on Friday",
  "Update API documentation",
  "Refactor database connection pool",
  "Fix mobile navigation CSS bug",
  "Team sync notes & action items",
  "Brainstorming Q1 project roadmap",
  "Renew cloud domain and SSL certificates",
  "Gym workout: Leg day routine",
  "Follow up with client on invoice",
  "Research k6 load testing strategies",
  "Clean up obsolete Docker images",
  "Weekly budget and expense tracking",
];

const SAMPLE_BODIES = [
  "Double check test coverage and ensure all edge cases are handled.",
  "Items needed: almond milk, oats, apples, greek yogurt, and fresh coffee beans.",
  "Key discussion points from morning standup: migrate to connection pooler and monitor latencies.",
  "Check logs for memory usage spikes and database connection pool exhaustion.",
  "Ensure all team members have access to the new monitoring dashboards.",
  "Review pull request comments and push fix commits before end of day.",
  "Track metrics: response time p95 under 100ms and zero 5xx server errors.",
];

const SAMPLE_TAGS = ["work", "personal", "urgent", "shopping", "ideas"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedTier1() {
  console.log("🚀 Starting Tier 1 Seeding Process...");
  console.log(`Target: ${TOTAL_USERS} users, ~${TOTAL_USERS * 15} notes total\n`);

  const client = await pool.connect();

  try {
    // 1. Clean up existing test data
    console.log("🧹 Cleaning up existing test data...");
    await client.query("BEGIN");
    await client.query("DELETE FROM notes;");
    await client.query("DELETE FROM users;");
    await client.query("COMMIT");
    console.log("✅ Existing data wiped cleanly.\n");

    // 2. Pre-hash password once
    console.log(`🔐 Hashing default password ("${DEFAULT_PASSWORD}")...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);
    console.log("✅ Password hashed.\n");

    // 3. Batch insert users
    console.log(`👤 Inserting ${TOTAL_USERS} users...`);
    const userValues: any[] = [];
    const userPlaceholders: string[] = [];

    for (let i = 1; i <= TOTAL_USERS; i++) {
      const username = `user${i}`;
      const email = `user${i}@example.com`;
      const offset = (i - 1) * 3;
      userPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      userValues.push(username, email, passwordHash);
    }

    const insertUsersQuery = `
      INSERT INTO users (username, email, password)
      VALUES ${userPlaceholders.join(", ")}
      RETURNING id, email, username;
    `;

    const userResult = await client.query(insertUsersQuery, userValues);
    const createdUsers = userResult.rows;
    console.log(`✅ ${createdUsers.length} users successfully created.\n`);

    // 4. Batch insert notes for each user
    console.log("📝 Generating notes for users...");
    const noteValues: any[] = [];
    const notePlaceholders: string[] = [];
    let paramIndex = 1;
    let totalNotesCount = 0;

    for (const user of createdUsers) {
      const notesCount = getRandomInt(MIN_NOTES_PER_USER, MAX_NOTES_PER_USER);
      totalNotesCount += notesCount;

      for (let j = 0; j < notesCount; j++) {
        const title = `${getRandomItem(SAMPLE_TITLES)} (#${j + 1})`;
        const body = getRandomItem(SAMPLE_BODIES);
        const tag = getRandomItem(SAMPLE_TAGS);

        notePlaceholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
        );
        noteValues.push(title, body, tag, user.id);
        paramIndex += 4;
      }
    }

    console.log(`💾 Inserting ${totalNotesCount} notes into PostgreSQL...`);
    const insertNotesQuery = `
      INSERT INTO notes (title, body, tag, user_id)
      VALUES ${notePlaceholders.join(", ")};
    `;

    await client.query(insertNotesQuery, noteValues);
    console.log(`✅ ${totalNotesCount} notes inserted successfully.\n`);

    // 5. Generate JWT tokens and export to JSON for k6
    console.log("🔑 Generating JWT tokens for k6 Virtual Users...");
    const k6UserData = createdUsers.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      password: DEFAULT_PASSWORD,
      token: generateToken<JWTPayload>({ id: u.id }),
    }));

    const outputDir = path.resolve(process.cwd(), "load-tests");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "users.json");
    fs.writeFileSync(outputPath, JSON.stringify(k6UserData, null, 2));
    console.log(`✅ Saved ${k6UserData.length} authenticated user profiles to:`);
    console.log(`   ${outputPath}\n`);

    console.log("🎉 Tier 1 Seeding Complete!");
    console.log("=================================");
    console.log(`• Total Users: ${createdUsers.length}`);
    console.log(`• Total Notes: ${totalNotesCount}`);
    console.log(`• Default Password: ${DEFAULT_PASSWORD}`);
    console.log("• Index on notes.user_id: None (Baseline)");
    console.log("=================================");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTier1().catch((err) => {
  console.error(err);
  process.exit(1);
});
