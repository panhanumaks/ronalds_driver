import fs from "fs";
import path from "path";
import axios from "axios";
import cron from "node-cron";
import {
  handleCommand,
  handleCallbackQuery,
} from "../services/commandService.js";
import { getAllChatIds } from "../services/userService.js";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const uploadDir = "./uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const downloadPhoto = async (fileId) => {
  try {
    const filePathRes = await axios.get(
      `${TELEGRAM_API}/getFile?file_id=${fileId}`
    );
    const filePath = filePathRes.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;

    const photoName = path.basename(filePath);
    const photoPath = path.join(uploadDir, photoName);

    const photoRes = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(photoPath);
      photoRes.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return photoName;
  } catch (error) {
    console.error("Error downloading photo:", error);
    throw error;
  }
};

const deleteOldPhotos = () => {
  const now = Date.now();
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Error reading upload directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error("Error getting file stats:", err);
          return;
        }

        if (stats.mtimeMs < threeDaysAgo) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            } else {
              console.log(`Deleted old photo: ${file}`);
            }
          });
        }
      });
    });
  });
};

export const handleWebhook = async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    if (callback_query && callback_query.data) {
      const chat_id = callback_query.from.id;

      const user = await findUserByChatId(chat_id);
      if (user.length > 0 && user[0].is_blocked) {
        sendMessage(
          chat_id,
          "Maaf, akun anda telah diblokir, Hubungi Admin untuk detail lebih lanjut."
        );
        res.sendStatus(200);
      }
      await handleCallbackQuery(chat_id, callback_query.data);

      // stop loading
      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/answerCallbackQuery`,
        {
          callback_query_id: callback_query.id,
        }
      );
    } else if (message) {
      const chat_id = message.chat.id;

      if (message.photo && message.photo.length > 0) {
        const fileId = message.photo[message.photo.length - 1].file_id;

        const photoName = await downloadPhoto(fileId);
        const imageUrl = `https://${req.get("host")}/uploads/${photoName}`;

        await handleCommand(chat_id, message.text || "", imageUrl);
      } else if (message.text) {
        const text = message.text;
        await handleCommand(chat_id, text);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.sendStatus(500);
  }
};

export const setWebhook = async (req, res) => {
  try {
    const webhookUrl = `https://${req.get("host")}/webhook/${
      process.env.BOT_TOKEN
    }`;
    await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: webhookUrl,
    });

    res.send("Webhook has been set");
  } catch (error) {
    console.error("Error setting webhook:", error);
    res.sendStatus(500);
  }
};

cron.schedule("0 0 * * *", deleteOldPhotos);

cron.schedule(
  "0 6 * * *",
  async () => {
    try {
      const chatIds = await getAllChatIds();

      for (const chat_id of chatIds) {
        const message = "/start";

        await handleCommand(chat_id, message);
      }
    } catch (error) {
      console.error("Error in sending messages:", error);
    }
  },
  {
    timezone: "Asia/Jakarta", // Ensure it runs in WIB timezone
  }
);
