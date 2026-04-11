const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function insertAdmin(email, password, role = "admin", status = "active") {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const result = await pool.query(
      "INSERT INTO admins (email, password, role, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, hashedPassword, role, status]
    );

    console.log("\nAdmin created successfully!\n");
    console.log("Email:", result.rows[0].email);
    console.log("Role:", result.rows[0].role);
    console.log("Status:", result.rows[0].status);
    console.log("Created at:", result.rows[0].created_at);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting admin:", error.message);
    await pool.end();
    process.exit(1);
  }
}

// Usage: node insert_admin.js email password [role] [status]
const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || "admin";
const status = process.argv[5] || "active";

if (!email || !password) {
  console.log("Usage: node insert_admin.js <email> <password> [role] [status]");
  console.log("\nExample:");
  console.log("  node insert_admin.js admin@example.com password123");
  console.log("  node insert_admin.js admin@example.com password123 super_admin active");
  process.exit(1);
}

insertAdmin(email, password, role, status);
