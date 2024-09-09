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
  const checkInTime = moment().format("HH:mm:ss");

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
    `Check-in berhasil pada waktu: ${checkInTime}. Gambar sudah di-upload.`
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
  const checkOutTime = moment().format("HH:mm:ss");

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
    `Check-out berhasil pada waktu: ${checkOutTime}. Gambar sudah di-upload.`
  );
  await handleCommandUpdate(chat_id, "");
}
