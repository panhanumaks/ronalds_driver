import { db } from "../config/db.js";
import moment from "moment";
import { sendMessage } from "./telegramService.js";
import { handleCommandUpdate } from "./commandService.js";

export async function handleCheckInAdditional(chat_id, imageUrl) {
  if (!imageUrl) {
    return sendMessage(
      chat_id,
      "Harap upload file gambar sebagai bukti check-in."
    );
  }

  const currentDate = moment().format("YYYY-MM-DD");
  const checkInTime = moment().format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE recaps SET check_in_time = ?, check_in_image = ?, updated_at = NOW()
    WHERE chat_id = ? AND date = ?
  `;
  await db.connection.query(query, [
    checkInTime,
    imageUrl,
    chat_id,
    currentDate,
  ]);

  sendMessage(
    chat_id,
    `Check-In berhasil pada waktu: ${checkInTime}. Silahkan Bekerja.`
  );
  await handleCommandUpdate(chat_id, "");
}

export async function handleCheckOutAdditional(chat_id, imageUrl) {
  if (!imageUrl) {
    return sendMessage(
      chat_id,
      "Harap upload file gambar sebagai bukti check-out."
    );
  }

  const currentDate = moment().format("YYYY-MM-DD");
  const checkOutTime = moment().format("YYYY-MM-DD HH:mm:ss");

  const checkExistingQuery = `
    SELECT * FROM recaps WHERE chat_id = ? AND date = ? AND check_in_time IS NOT NULL
  `;

  const [existingRows] = await db.connection.query(checkExistingQuery, [
    chat_id,
    currentDate,
  ]);

  if (existingRows.length === 0) {
    currentDate = moment(currentDate).subtract(1, "days").format("YYYY-MM-DD");
  }

  const query = `
    UPDATE recaps SET check_out_time = ?, check_out_image = ?, updated_at = NOW()
    WHERE chat_id = ? AND date = ?
  `;
  await db.connection.query(query, [
    checkOutTime,
    imageUrl,
    chat_id,
    currentDate,
  ]);

  sendMessage(
    chat_id,
    `Check-Out berhasil pada waktu: ${checkOutTime}. Terima Kasih!.`
  );
  await handleCommandUpdate(chat_id, "");
}
