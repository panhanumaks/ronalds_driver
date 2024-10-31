import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { handleWebhook, setWebhook } from "./controllers/telegramController.js";
import { db, dbConnection } from "./config/db.js";
import { fileURLToPath } from "url";
import userController from "./controllers/userController.js";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import moment from "moment";
import ExcelJS from "exceljs";
import {
  sendEmailWithAttachment,
  sendEmailWithMonthlyRecap,
} from "./services/nodemailerService.js";

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

// Set the view engine to EJS
app.set("view engine", "ejs");

app.engine("ejs", ejs.__express);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("views", path.join(__dirname, "views"));

await dbConnection();

app.post(`/webhook/${process.env.BOT_TOKEN}`, handleWebhook);
app.get("/setWebhook", setWebhook);

app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), "uploads", filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error previewing file:", err);
      res.status(500).send("Error previewing the file");
    }
  });
});

app.get("/api/monthly-recap", async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const startDate = moment(`${year}-${month}-01`).format("YYYY-MM-DD");
    const endDate = moment(`${year}-${month}-01`)
      .endOf("month")
      .format("YYYY-MM-DD");

    const query = `
      SELECT u.full_name AS name, 
             COUNT(r.id) AS total_days, 
             IFNULL(SUM(r.overtime_hours), 0) AS total_overtime
      FROM users u
      LEFT JOIN recaps r ON u.chat_id = r.chat_id
                          AND r.date BETWEEN ? AND ?
                          AND r.check_in_time IS NOT NULL
                          AND r.check_out_time IS NOT NULL
      GROUP BY u.full_name;
    `;
    const [rows] = await db.connection.query(query, [startDate, endDate]);

    // Buat workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Recap");

    // Menambahkan header
    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Total Days", key: "total_days", width: 15 },
      { header: "Total Overtime Hours", key: "total_overtime", width: 20 },
    ];

    // Menambahkan data ke worksheet
    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Simpan file Excel di direktori sementara
    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const filePath = path.join(
      outputDir,
      `monthly_recap_${year}_${month}.xlsx`
    );
    await workbook.xlsx.writeFile(filePath);

    // Kirim file Excel melalui email
    await sendEmailWithMonthlyRecap(
      filePath,
      "ronald@akasia.id",
      `Monthly Recap Report for ${month}-${year}`,
      `Berikut adalah rekap bulanan Anda untuk bulan ${month}-${year} dari tanggal ${startDate} hingga ${endDate}.`
    );

    // Buat Tracking DEV
    await sendEmailWithMonthlyRecap(
      filePath,
      "pan.hanum@gmail.com",
      `Monthly Recap Report for ${month}-${year}`,
      `Berikut adalah rekap bulanan Anda untuk bulan ${month}-${year} dari tanggal ${startDate} hingga ${endDate}.`
    );

    // Hapus file setelah dikirim
    fs.unlinkSync(filePath);

    res.json({ message: "Laporan bulanan berhasil dikirim ke email." });
  } catch (error) {
    console.error("Error generating monthly recap:", error);
    res.status(500).json({ message: "Error generating or sending report" });
  }
});

app.use(userController);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
