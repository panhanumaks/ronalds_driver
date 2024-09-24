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

export const getAllUsers = async () => {
  const [rows] = await db.connection.execute("SELECT * FROM users");
  return rows;
};

// Get a user by ID
export const getUserById = async (id) => {
  const [rows] = await db.connection.execute(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

// Update a user
export const updateUser = async (id, data) => {
  const { full_name, company_name, is_blocked } = data;
  const [result] = await db.connection.execute(
    "UPDATE users SET full_name = ?, company_name = ?, is_blocked = ? WHERE id = ?",
    [full_name, company_name, is_blocked, id]
  );
  return result.affectedRows > 0 ? await getUserById(id) : null;
};

// Block a user
export const blockUser = async (id) => {
  const [result] = await db.connection.execute(
    "UPDATE users SET is_blocked = 1 WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0 ? await getUserById(id) : null;
};

// Unblock a user
export const unblockUser = async (id) => {
  const [result] = await db.connection.execute(
    "UPDATE users SET is_blocked = 0 WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0 ? await getUserById(id) : null;
};

export const getRecapsWithCheckInTime = async () => {
  const query = `
          SELECT * FROM recaps 
          WHERE check_in_time IS NOT NULL 
          AND check_in_image IS NULL
          AND TIMESTAMPDIFF(MINUTE, check_in_time, NOW()) > 10;
      `;
  const [rows] = await db.connection.query(query);
  return rows;
};

export const getRecapsWithCheckOutTime = async () => {
  const query = `
          SELECT * FROM recaps 
          WHERE check_out_time IS NOT NULL 
          AND check_out_image IS NULL
          AND TIMESTAMPDIFF(MINUTE, check_out_time, NOW()) > 10;
      `;
  const [rows] = await db.connection.query(query);
  return rows;
};
