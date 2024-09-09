import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { handleWebhook, setWebhook } from "./controllers/telegramController.js";
import { dbConnection } from "./config/db.js";
import path from "path";

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
