import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { pool } from "../src/config/database.js";
import { generateToken } from "../src/service/jwt-service.js";
import type { JWTPayload } from "../src/schemas/auth-schema.js";

const TOTAL_USERS = 5000;
const USER_BATCH_SIZE = 500;
const NOTE_BATCH_SIZE = 1000;
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

// 60% casual (8-15 notes), 30% active (16-25 notes), 10% power (30-50 notes)
function getNoteCountForUser(): number {
  const roll = Math.random();
  if (roll < 0.6) return getRandomInt(8, 15);
  if (roll < 0.9) return getRandomInt(16, 25);
  return getRandomInt(30, 50);
}

async function seedTier2() {
  console.log("==================================================");
  console.log("🚀 Starting Tier 2 Seeding (5,000 Users)");
  console.log("==================================================");

  const startTime = Date.now();
  const client = await pool.connect();

  try {
    // 1. Clean existing data
    console.log("🧹 Wiping existing users and notes...");
    await client.query("BEGIN");
    await client.query("DELETE FROM notes;");
    await client.query("DELETE FROM users;");
    await client.query("COMMIT");
    console.log("✅ Database wiped clean.\n");

    // 2. Pre-hash password once
    console.log(`🔐 Pre-hashing default password ("${DEFAULT_PASSWORD}")...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);
    console.log("✅ Password hashed.\n");

    // 3. Batch insert 5,000 users in chunks of USER_BATCH_SIZE
    console.log(
      `👤 Inserting ${TOTAL_USERS} users in chunks of ${USER_BATCH_SIZE}...`,
    );
    const createdUsers: { id: number; email: string; username: string }[] = [];

    for (let offset = 0; offset < TOTAL_USERS; offset += USER_BATCH_SIZE) {
      const batchCount = Math.min(USER_BATCH_SIZE, TOTAL_USERS - offset);
      const userValues: any[] = [];
      const userPlaceholders: string[] = [];

      for (let i = 1; i <= batchCount; i++) {
        const userNum = offset + i;
        const username = `user${userNum}`;
        const email = `user${userNum}@example.com`;
        const pOffset = (i - 1) * 3;
        userPlaceholders.push(
          `($${pOffset + 1}, $${pOffset + 2}, $${pOffset + 3})`,
        );
        userValues.push(username, email, passwordHash);
      }

      const insertUsersQuery = `
        INSERT INTO users (username, email, password)
        VALUES ${userPlaceholders.join(", ")}
        RETURNING id, email, username;
      `;

      const result = await client.query(insertUsersQuery, userValues);
      createdUsers.push(...result.rows);
      process.stdout.write(
        `   Inserted ${createdUsers.length}/${TOTAL_USERS} users...\r`,
      );
    }
    console.log(`\n✅ ${createdUsers.length} users successfully created.\n`);

    // 4. Batch insert notes for all users in chunks of NOTE_BATCH_SIZE
    console.log("📝 Generating and batch-inserting notes for all users...");
    let pendingNoteValues: any[] = [];
    let pendingPlaceholders: string[] = [];
    let paramIndex = 1;
    let totalNotesCount = 0;

    for (let uIdx = 0; uIdx < createdUsers.length; uIdx++) {
      const user = createdUsers[uIdx];
      const count = getNoteCountForUser();

      for (let j = 0; j < count; j++) {
        const title = `${getRandomItem(SAMPLE_TITLES)} (#${j + 1})`;
        const body = getRandomItem(SAMPLE_BODIES);
        const tag = getRandomItem(SAMPLE_TAGS);

        pendingPlaceholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`,
        );
        pendingNoteValues.push(title, body, tag, user.id);
        paramIndex += 4;
        totalNotesCount++;

        // Flush batch when chunk size reached
        if (pendingPlaceholders.length >= NOTE_BATCH_SIZE) {
          const insertNotesQuery = `
            INSERT INTO notes (title, body, tag, user_id)
            VALUES ${pendingPlaceholders.join(", ")};
          `;
          await client.query(insertNotesQuery, pendingNoteValues);
          pendingPlaceholders = [];
          pendingNoteValues = [];
          paramIndex = 1;

          process.stdout.write(
            `   Inserted ${totalNotesCount} notes across ${uIdx + 1}/${createdUsers.length} users...\r`,
          );
        }
      }
    }

    // Flush any remaining notes
    if (pendingPlaceholders.length > 0) {
      const insertNotesQuery = `
        INSERT INTO notes (title, body, tag, user_id)
        VALUES ${pendingPlaceholders.join(", ")};
      `;
      await client.query(insertNotesQuery, pendingNoteValues);
    }
    console.log(`\n✅ ${totalNotesCount} notes inserted successfully.\n`);

    // 5. Ensure performance index on notes(user_id)
    console.log("⚡ Ensuring B-tree index on notes(user_id)...");
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);",
    );
    console.log("✅ Index verified on notes(user_id).\n");

    // 6. Generate JWT tokens for k6
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
    console.log(`✅ Saved ${k6UserData.length} authenticated profiles to:`);
    console.log(`   ${outputPath}\n`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("==================================================");
    console.log("🎉 Tier 2 Seeding Complete!");
    console.log("==================================================");
    console.log(`• Total Users: ${createdUsers.length}`);
    console.log(`• Total Notes: ${totalNotesCount}`);
    console.log(
      `• Avg Notes/User: ${(totalNotesCount / createdUsers.length).toFixed(1)}`,
    );
    console.log(`• Time Taken: ${elapsed}s`);
    console.log(`• Index: idx_notes_user_id Active`);
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTier2().catch((err) => {
  console.error(err);
  process.exit(1);
});
