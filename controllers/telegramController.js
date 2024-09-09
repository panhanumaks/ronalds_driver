import fs from "fs";
import path from "path";
import axios from "axios";
import cron from "node-cron";
import {
  handleCommand,
  handleCallbackQuery,
} from "../services/commandService.js";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const uploadDir = "./uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const downloadPhoto = async (fileId) => {
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
};

const deleteOldPhotos = () => {
  const now = Date.now();
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Error reading upload directory", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error("Error getting file stats", err);
          return;
        }

        if (stats.mtimeMs < threeDaysAgo) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file", err);
            } else {
              console.log(`Deleted old photo: ${file}`);
            }
          });
        }
      });
    });
  });
};

cron.schedule("0 0 * * *", deleteOldPhotos);

export const handleWebhook = async (req, res) => {
  const { message, callback_query } = req.body;

  if (callback_query && callback_query.data) {
    const chat_id = callback_query.from.id;
    await handleCallbackQuery(chat_id, callback_query.data);
  } else if (message) {
    const chat_id = message.chat.id;

    if (message.photo && message.photo.length > 0) {
      const fileId = message.photo[message.photo.length - 1].file_id;

      const photoName = await downloadPhoto(fileId);
      const imageUrl = `${process.env.YOUR_BASE_URL}/uploads/${photoName}`;

      await handleCommand(chat_id, message.text || "", imageUrl);
    } else if (message.text) {
      const text = message.text;
      await handleCommand(chat_id, text);
    }
  }

  res.sendStatus(200);
};

export const setWebhook = async (req, res) => {
  const webhookUrl = `https://${req.get("host")}/webhook/${
    process.env.BOT_TOKEN
  }`;
  await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  res.send("Webhook has been set");
};
