import express from "express";
import bodyParser from "body-parser";
import companyList from "./company-list.json";

const app = express();
const PORT = process.env.PORT;
const BOT_TOKEN = process.env.PORT;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Mock Database to store driver data
let drivers = {};
let financeRekapan = {};

app.use(bodyParser.json());

// Helper functions to send messages and notifications
const sendMessage = async (chat_id, text) => {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text }),
  });
};

// Function to verify if the company exists in the list
const isCompanyVerified = (companyName) => {
  return companyList.some(
    (company) => company.name.toLowerCase() === companyName.toLowerCase()
  );
};

// Handle /start command to welcome driver and initiate verification
const startCommand = async (chat_id, message) => {
  const welcomeText = `Selamat Datang. Sebelum menggunakan tools ini, harap melakukan verifikasi dengan mengisi data sebagai berikut: \nNama Lengkap Anda, Nama PT Anda bekerja ( Contoh : James Bond, PT. Mencari Cinta )`;
  await sendMessage(chat_id, welcomeText);
};

// Handle check-in, check-out, rekap, and izin logic
const handleCommand = async (chat_id, text) => {
  const driver = drivers[chat_id];
  const currentTime = new Date();
  const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = currentTime.getHours();

  // Verify if the driver has not been verified and is sending the verification details
  if (!driver && text.includes(",")) {
    const [name, company] = text.split(",").map((str) => str.trim());

    if (isCompanyVerified(company)) {
      drivers[chat_id] = {
        name,
        company,
        workdays: 0,
        overtimeHours: 0,
        absentDays: 0,
      };
      await sendMessage(
        chat_id,
        `Terima kasih, ${name} dari ${company}. Anda telah terverifikasi.`
      );
    } else {
      await sendMessage(
        chat_id,
        `Maaf, perusahaan ${company} tidak terdaftar dalam sistem kami.`
      );
    }

    return;
  }

  if (!driver) {
    return await sendMessage(
      chat_id,
      "Anda belum diverifikasi. Mohon kirim nama lengkap dan nama PT Anda."
    );
  }

  switch (text) {
    case "1": // Check-In
      drivers[chat_id].checkInTime = currentTime;
      await sendMessage(
        chat_id,
        "Check-In berhasil! Jangan lupa untuk mengirim foto."
      );
      if (dayOfWeek === 6 || dayOfWeek === 0) {
        // Saturday or Sunday
        drivers[chat_id].isWeekend = true;
      } else {
        drivers[chat_id].isWeekend = false;
      }
      break;
    case "2": // Check-Out
      const checkInTime = drivers[chat_id].checkInTime;
      if (!checkInTime) {
        return await sendMessage(chat_id, "Anda belum Check-In.");
      }
      const workHours = (currentTime - checkInTime) / 3600000;
      const overtime =
        drivers[chat_id].isWeekend || hour >= 19 ? Math.ceil(workHours - 7) : 0;
      drivers[chat_id].workdays += 1;
      drivers[chat_id].overtimeHours += overtime;
      await sendMessage(
        chat_id,
        `Check-Out berhasil! Anda lembur sebanyak ${overtime} jam hari ini.`
      );
      break;
    case "3": // Rekap Jam Kerja
      const { workdays, overtimeHours } = drivers[chat_id];
      await sendMessage(
        chat_id,
        `Jumlah Hari Kerja: ${workdays}, Jumlah Jam Lembur: ${overtimeHours}`
      );
      break;
    case "4": // Izin Sakit
      drivers[chat_id].absentDays += 1;
      await sendMessage(
        chat_id,
        `Izin sakit tercatat. Anda tidak masuk kerja hari ini.`
      );
      break;
    default:
      await sendMessage(
        chat_id,
        "Perintah tidak dikenali. Silakan pilih 1 untuk Check-In, 2 untuk Check-Out, 3 untuk Rekap, atau 4 untuk Izin."
      );
  }
};

// Webhook to receive updates from Telegram
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  const message = req.body.message;
  const chat_id = message.chat.id;
  const text = message.text;

  if (text === "/start") {
    startCommand(chat_id, message);
  } else {
    handleCommand(chat_id, text);
  }

  res.sendStatus(200);
});

// Set webhook
app.get("/setWebhook", async (req, res) => {
  const webhookUrl = `${process.env.WEBHOOK_URL}/${BOT_TOKEN}`;
  await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  res.send("Webhook has been set");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
