import { db } from "../config/db.js";
import { sendMessage } from "./telegramService.js";
import { handleCommandUpdate } from "./commandService.js";
import { COMMAND_UTILS } from "./commandService.js";
import moment from "moment";
import { validatePhoneNumber } from "../utils/validationUtils.js";

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
    return sendMessage(
      chat_id,
      "Anda sudah check-in atau check-out, tidak bisa mengajukan izin sakit."
    );
  }

  const query = `
    INSERT INTO recaps (chat_id, date, is_absence, absence_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;
  await db.connection.query(query, [chat_id, currentDate, 1, reason]);

  sendMessage(chat_id, "Silakan masukkan nomor telepon atasan Anda.");
  await handleCommandUpdate(chat_id, COMMAND_UTILS.SICK_LEAVE_ADV);
}

export async function handleSickLeaveAdditionalAdv(chat_id, phoneNumber) {
  if (!validatePhoneNumber(phoneNumber)) {
    return sendMessage(
      chat_id,
      "Nomor telepon tidak valid. Silakan coba lagi."
    );
  }

  const query = `
    UPDATE recaps SET absence_phone_call = ?, updated_at = NOW()
    WHERE chat_id = ? AND date = ?
  `;

  const currentDate = moment().format("YYYY-MM-DD");

  await db.connection.query(query, [phoneNumber, chat_id, currentDate]);

  sendMessage(chat_id, "Pesan ke atasan sudah terkirim, Terima Kasih!");
  await handleCommandUpdate(chat_id, "");
}
