import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { handleWebhook, setWebhook } from "./controllers/telegramController.js";
import { dbConnection } from "./config/db.js";

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

await dbConnection();

app.post(`/webhook/${process.env.BOT_TOKEN}`, handleWebhook);
app.get("/setWebhook", setWebhook);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
