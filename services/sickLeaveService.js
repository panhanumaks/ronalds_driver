import { db } from "../config/db.js";
import { sendMessage } from "./telegramService.js";
import { handleCommandUpdate } from "./commandService.js";
import { COMMAND_UTILS } from "./commandService.js";
import { validateEmail } from "../utils/validationUtils.js";
import moment from "moment";
import { sendEmailToAtasan } from "./nodemailerService.js";

export async function handleSickLeaveAdditional(chat_id, reason) {
  const currentDate = moment().format("YYYY-MM-DD");

  const checkExistingQuery = `
    SELECT * FROM recaps WHERE chat_id = ? AND date = ?
  `;
  const [existingRows] = await db.connection.query(checkExistingQuery, [
    chat_id,
    currentDate,
  ]);

  if (existingRows.length > 0) {
    sendMessage(chat_id, "Silakan masukkan email atasan Anda.");
    return await handleCommandUpdate(chat_id, COMMAND_UTILS.SICK_LEAVE_ADV);
  }

  const query = `
    INSERT INTO recaps (chat_id, date, is_absence, absence_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;
  await db.connection.query(query, [chat_id, currentDate, 1, reason]);

  sendMessage(chat_id, "Silakan masukkan email atasan Anda.");
  await handleCommandUpdate(chat_id, COMMAND_UTILS.SICK_LEAVE_ADV);
}

export async function handleSickLeaveAdditionalAdv(chat_id, email) {
  if (!validateEmail(email)) {
    return sendMessage(chat_id, "Email tidak valid. Silakan coba lagi.");
  }

  const query = `
    UPDATE recaps SET absence_email = ?, updated_at = NOW()
    WHERE chat_id = ? AND date = ?
  `;

  const currentDate = moment().format("YYYY-MM-DD");

  await db.connection.query(query, [email, chat_id, currentDate]);

  const queryGet = `
    SELECT r.*, u.full_name, u.company_name 
    FROM recaps r
    LEFT JOIN users u ON r.chat_id = u.chat_id
    WHERE r.chat_id = ? AND r.date = ?
  `;

  const [rows] = await db.connection.query(queryGet, [chat_id, currentDate]);
  const data = rows[0];
  console.log(data)
  await sendEmailToAtasan(email, data.full_name, data.absence_reason);
  sendMessage(chat_id, "Pesan ke atasan sudah terkirim, Terima Kasih!");
  await handleCommandUpdate(chat_id, "");
}
