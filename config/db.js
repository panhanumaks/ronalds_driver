import mysql from "mysql2/promise";

export const db = {};

export async function dbConnection() {
  try {
    db.connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed", error);
  }
}
