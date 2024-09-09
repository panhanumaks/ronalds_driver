import { db } from "../config/db.js";
import moment from "moment";
import { sendMessage, sendMessageWithButtons } from "./telegramService.js";
import {
  isWeekend,
  calculateOvertime,
} from "../utils/overtimeUtils.js";
import { COMMAND_UTILS, handleCommandUpdate } from "./commandService.js";
import { openTools } from "../utils/buttons.js";

export async function handleCheckIn(chat_id) {
  const currentDate = moment().format("YYYY-MM-DD");

  const checkExistingQuery = `SELECT * FROM recaps WHERE chat_id = ? AND date = ?`;
  const [existingRows] = await db.connection.query(checkExistingQuery, [
    chat_id,
    currentDate,
  ]);

  if (existingRows.length > 0) {
    return sendMessage(
      chat_id,
      "Anda sudah melakukan check-in untuk hari ini."
    );
  }

  const checkInTime = moment().format("HH:mm:ss");
  let overtimeStart = isWeekend() ? checkInTime : null;

  const query = `
    INSERT INTO recaps (chat_id, date, check_in_time, created_at, updated_at, is_overtime, overtime_start)
    VALUES (?, ?, ?, NOW(), NOW(), ?, ?)
  `;
  await db.connection.query(query, [
    chat_id,
    currentDate,
    checkInTime,
    isWeekend(),
    overtimeStart,
  ]);

  sendMessage(
    chat_id,
    `Check-in berhasil pada waktu: ${checkInTime}. Jangan lupa ambil foto untuk dokumentasi.`
  );
  await handleCommandUpdate(chat_id, COMMAND_UTILS.CHECK_IN);
}

export async function handleCheckOut(chat_id) {
  const currentDate = moment().format("YYYY-MM-DD");

  const checkExistingQuery = `
      SELECT * FROM recaps WHERE chat_id = ? AND date = ? AND check_in_time IS NOT NULL
    `;
  const [existingRows] = await db.connection.query(checkExistingQuery, [
    chat_id,
    currentDate,
  ]);

  if (existingRows.length === 0) {
    return sendMessage(
      chat_id,
      "Anda belum melakukan check-in, tidak bisa check-out."
    );
  }

  const checkOutTime = moment().format("HH:mm:ss");
  const checkInTime = existingRows[0].check_in_time;

  let overtimeHours = calculateOvertime(checkInTime, checkOutTime);

  const query = `
      UPDATE recaps SET check_out_time = ?, overtime_hours = ?, updated_at = NOW() WHERE chat_id = ? AND date = ?
    `;
  await db.connection.query(query, [
    checkOutTime,
    overtimeHours,
    chat_id,
    currentDate,
  ]);

  sendMessage(
    chat_id,
    `Check-out berhasil pada waktu: ${checkOutTime}. Anda lembur sebanyak ${overtimeHours} jam. Jangan lupa ambil foto untuk dokumentasi.`
  );
  await handleCommandUpdate(chat_id, COMMAND_UTILS.CHECK_OUT);
}

export async function handleRecapInformation(chat_id) {
  const query = `
    SELECT date, check_in_time, check_out_time, absence_reason, absence_phone_call, overtime_hours FROM recaps WHERE chat_id = ? ORDER BY date DESC LIMIT 2
  `;
  const [rows] = await db.connection.query(query, [chat_id]);

  if (rows.length > 0) {
    let recapMessage = "Rekap Informasi Kerja Anda:\n\n";
    rows.forEach((row) => {
      if (row.absence_reason) {
        recapMessage += `Tanggal: ${moment(row.date).format(
          "DD MMMM YYYY"
        )}\nAlasan Izin: ${row.absence_reason || "N/A"}\nNo. Telp Atasan: ${
          row.absence_phone_call || "N/A"
        }`;
      } else {
        recapMessage += `Tanggal: ${moment(row.date).format(
          "DD MMMM YYYY"
        )}\nCheck-in: ${row.check_in_time || "N/A"}\nCheck-out: ${
          row.check_out_time || "N/A"
        }\nLembur: ${row.overtime_hours || "0"} jam\n\n`;
      }
    });
    sendMessage(chat_id, recapMessage);
  } else {
    sendMessage(chat_id, "Belum ada informasi rekap kerja.");
  }
}

export async function handleSickLeave(chat_id) {
  const currentDate = moment().format("YYYY-MM-DD");

  const checkExistingQuery = `
    SELECT * FROM recaps WHERE chat_id = ? AND date = ? AND (check_in_time IS NOT NULL OR check_out_time IS NOT NULL)
  `;
  const [existingRows] = await db.connection.query(checkExistingQuery, [
    chat_id,
    currentDate,
  ]);

  if (existingRows.length > 0) {
    return sendMessageWithButtons(
      chat_id,
      "Anda sudah check-in atau check-out, tidak bisa mengajukan izin sakit.",
      openTools
    );
  }

  sendMessage(chat_id, "Silakan kirim alasan Anda tidak masuk kerja.");
  await handleCommandUpdate(chat_id, COMMAND_UTILS.SICK_LEAVE);
}
