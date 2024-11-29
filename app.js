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
import { calculateOvertime } from "./utils/overtimeUtils.js";
import { sendEmailWithMonthlyRecap } from "./services/nodemailerService.js";

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

    const startDate = moment(`${year}-${month}-01`)
      .startOf("month")
      .subtract(7, "days")
      .format("YYYY-MM-DD");
    const endDate = moment(`${year}-${month}-01`)
      .endOf("month")
      .subtract(7, "days")
      .format("YYYY-MM-DD");

    const query = `
      SELECT u.chat_id, 
             u.full_name AS name,
             u.created_at AS join_date,
             r.date,
             r.check_in_time, 
             r.check_out_time
      FROM recaps r
      LEFT JOIN users u ON u.chat_id = r.chat_id
      WHERE r.date BETWEEN ? AND ?
        AND r.check_in_time IS NOT NULL
        AND r.check_out_time IS NOT NULL;
    `;

    const [rows] = await db.connection.query(query, [startDate, endDate]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Recap");

    worksheet.mergeCells("A1:A2");
    worksheet.mergeCells("B1:B2");
    worksheet.mergeCells("C1:C2");
    worksheet.mergeCells("D1:F1");
    worksheet.mergeCells("G1:H1");

    const headerCells = [
      { cell: "A1", value: "Nama Karyawan" },
      { cell: "B1", value: "Join Date" },
      { cell: "C1", value: "Hari Kerja" },
      { cell: "D1", value: "OT Senin - Jumat (Jam)" },
      { cell: "G1", value: "OT Sabtu - Minggu (Jam)" },
      { cell: "D2", value: "9-11" },
      { cell: "E2", value: "12-14" },
      { cell: "F2", value: "15 Up" },
      { cell: "G2", value: "1-9" },
      { cell: "H2", value: "11 Up" },
    ];

    headerCells.forEach(({ cell, value }) => {
      worksheet.getCell(cell).value = value;
      worksheet.getCell(cell).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell(cell).font = { bold: true };
    });

    worksheet.columns = [
      { key: "name", width: 25 },
      { key: "join_date", width: 15 },
      { key: "total_days", width: 15 },
      { key: "ot_weekday_9_11", width: 10 },
      { key: "ot_weekday_12_14", width: 10 },
      { key: "ot_weekday_15_up", width: 10 },
      { key: "ot_weekend_1_9", width: 10 },
      { key: "ot_weekend_11_up", width: 10 },
    ];

    const recapData = {};

    rows.forEach((row) => {
      const chatId = row.chat_id;
      const dayOfWeek = moment(row.date).day();
      const checkInTime = row.check_in_time;
      const checkOutTime = row.check_out_time;

      if (!recapData[chatId]) {
        recapData[chatId] = {
          name: row.name,
          join_date: moment(row.join_date).format("YYYY-MM-DD"),
          total_days: 0,
          ot_weekday: { "9-11": 0, "12-14": 0, "15-Up": 0 },
          ot_weekend: { "1-9": 0, "11-Up": 0 },
        };
      }

      recapData[chatId].total_days += 1;

      let overtimeHours = calculateOvertime(
        moment(checkInTime),
        moment(checkOutTime),
        dayOfWeek
      );

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        console.log("checkInTime :", moment(checkInTime));
        console.log("checkOutTime :", moment(checkOutTime));

        console.log("overtimeHours :", overtimeHours);

        if (overtimeHours >= 1) {
          recapData[chatId].ot_weekday["9-11"] += Math.min(overtimeHours, 2);
          overtimeHours = Math.max(overtimeHours - 2, 0);
        }
        if (overtimeHours >= 1) {
          recapData[chatId].ot_weekday["12-14"] += Math.min(overtimeHours, 2);
          overtimeHours = Math.max(overtimeHours - 2, 0);
        }
        if (overtimeHours >= 1) {
          recapData[chatId].ot_weekday["15-Up"] += overtimeHours;
        }
      } else {
        if (overtimeHours >= 1 && overtimeHours <= 9) {
          recapData[chatId].ot_weekend["1-9"] += Math.min(overtimeHours, 9);
          overtimeHours = Math.max(overtimeHours - 9, 0);
        }
        if (overtimeHours >= 11) {
          recapData[chatId].ot_weekend["11-Up"] += overtimeHours;
        }
      }
    });

    Object.values(recapData).forEach((row) => {
      worksheet.addRow({
        name: row.name,
        join_date: row.join_date,
        total_days: row.total_days,
        ot_weekday_9_11: row.ot_weekday["9-11"],
        ot_weekday_12_14: row.ot_weekday["12-14"],
        ot_weekday_15_up: row.ot_weekday["15-Up"],
        ot_weekend_1_9: row.ot_weekend["1-9"],
        ot_weekend_11_up: row.ot_weekend["11-Up"],
      });
    });

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

    res.download(filePath, `monthly_recap_${year}_${month}.xlsx`, () => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error("Error generating monthly recap:", error);
    res.status(500).json({ message: "Error generating or sending report" });
  }
});

app.use(userController);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
