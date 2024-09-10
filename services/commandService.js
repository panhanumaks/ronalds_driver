import { findUserByChatId, insertUser } from "./userService.js";
import { isCompanyVerified } from "../utils/verifyCompany.js";
import { toolButtons, openTools } from "../utils/buttons.js";
import { sendMessage, sendMessageWithButtons } from "./telegramService.js";
import {
  handleCheckIn,
  handleCheckOut,
  handleRecapInformation,
  handleSickLeave,
} from "./recapService.js";
import { db } from "../config/db.js";
import {
  handleSickLeaveAdditional,
  handleSickLeaveAdditionalAdv,
} from "./sickLeaveService.js";
import {
  handleCheckInAdditional,
  handleCheckOutAdditional,
} from "./checkInOutService.js";

export const COMMAND_UTILS = {
  SICK_LEAVE: "SICK_LEAVE",
  SICK_LEAVE_ADV: "SICK_LEAVE_ADV",
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
};

export async function handleCommand(chat_id, text, imageUrl = null) {
  const user = await findUserByChatId(chat_id);
  const command = await getCommand(chat_id);

  if (user.length == 0) {
    if (text.includes("/start")) {
      sendMessage(
        chat_id,
        "Selamat Datang. Sebelum menggunakan tools ini, harap melakukan verifikasi dengan mengisi data sebagai berikut:\nNama Lengkap Anda, Nama PT Anda bekerja\n(Contoh: James Bond, PT. Mencari Cinta)"
      );
    } else {
      const [fullName, companyName] = text
        .split(",")
        .map((item) => item.trim());

      if (isCompanyVerified(companyName)) {
        await insertUser(chat_id, fullName, companyName);
        sendMessageWithButtons(
          chat_id,
          "Verifikasi berhasil!\nIni adalah tools untuk membantu pekerjaan Anda.",
          toolButtons
        );
      } else {
        sendMessageWithButtons(chat_id, "Verifikasi Gagal.", [
          [{ text: "Coba Lagi", callback_data: "try_again" }],
        ]);
      }
    }
  } else if (user[0].is_blocked) {
    sendMessage(
      chat_id,
      "Maaf, akun anda telah diblokir, Hubungi Admin untuk detail lebih lanjut."
    );
  } else if (text.includes("/start")) {
    sendMessageWithButtons(
      chat_id,
      "Ini adalah tools untuk membantu pekerjaan Anda.",
      toolButtons
    );
    handleCommandUpdate(chat_id, "");
  } else if (command) {
    switch (command) {
      case COMMAND_UTILS.SICK_LEAVE:
        await handleSickLeaveAdditional(chat_id, text);
        break;

      case COMMAND_UTILS.SICK_LEAVE_ADV:
        await handleSickLeaveAdditionalAdv(chat_id, text);
        break;

      case COMMAND_UTILS.CHECK_IN:
        await handleCheckInAdditional(chat_id, imageUrl);
        break;

      case COMMAND_UTILS.CHECK_OUT:
        await handleCheckOutAdditional(chat_id, imageUrl);
        break;

      default:
        sendMessageWithButtons(chat_id, "Perintah tidak dikenal.", [
          [{ text: "Coba Lagi", callback_data: "try_again" }],
        ]);
    }
  } else {
    sendMessageWithButtons(chat_id, "Perintah tidak dikenal.", [
      [{ text: "Coba Lagi", callback_data: "try_again" }],
    ]);
    handleCommandUpdate(chat_id, "");
  }
}

export async function handleCallbackQuery(chat_id, callback_data) {
  switch (callback_data) {
    case "check_in":
      await handleCheckIn(chat_id);
      break;
    case "check_out":
      await handleCheckOut(chat_id);
      break;
    case "recap_information":
      await handleRecapInformation(chat_id);
      break;
    case "absence_permission":
      await handleSickLeave(chat_id);
      break;
    case "try_again":
      await handleCommand(chat_id, "/start");
      break;
    default:
      sendMessage(chat_id, "Perintah tidak dikenal.");
  }
}

async function getCommand(chat_id) {
  try {
    const query = `SELECT command FROM commands WHERE chat_id = ?`;
    const [rows] = await db.connection.query(query, [chat_id]);

    if (rows.length > 0) {
      return rows[0].command;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error retrieving the command:", error);
    throw error;
  }
}

export async function handleCommandUpdate(chat_id, command) {
  try {
    const checkQuery = `SELECT * FROM commands WHERE chat_id = ?`;
    const [rows] = await db.connection.query(checkQuery, [chat_id]);

    if (rows.length > 0) {
      const updateQuery = `UPDATE commands SET command = ?, updated_at = NOW() WHERE chat_id = ?`;
      await db.connection.query(updateQuery, [command, chat_id]);
    } else {
      const insertQuery = `INSERT INTO commands (chat_id, command) VALUES (?, ?)`;
      await db.connection.query(insertQuery, [chat_id, command]);
    }
  } catch (error) {
    console.error("Error handling command update:", error);
  }
}
