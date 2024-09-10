import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { handleWebhook, setWebhook } from "./controllers/telegramController.js";
import { dbConnection } from "./config/db.js";
import { fileURLToPath } from "url";
import userController from "./controllers/userController.js";
import path from "path";
import ejs from "ejs";

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

app.use(userController);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
