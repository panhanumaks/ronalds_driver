import { db } from "../config/db.js";

export async function findUserByChatId(chat_id) {
  const query = "SELECT * FROM users WHERE chat_id = ?";
  const [result] = await db.connection.query(query, [chat_id]);
  return result;
}

export async function insertUser(chat_id, fullName, companyName) {
  const query = `INSERT INTO users (chat_id, full_name, company_name, is_verified, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, NOW(), NOW())`;
  await db.connection.query(query, [chat_id, fullName, companyName, 1]);
}

export const getAllChatIds = async () => {
  const query = "SELECT chat_id FROM users";
  try {
    const [rows] = await db.connection.query(query);
    return rows.map((row) => row.chat_id);
  } catch (error) {
    console.error("Error fetching chat IDs from database:", error);
    return [];
  }
};
