const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

export const sendMessage = async (chat_id, text) => {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text }),
  });
};

export async function sendMessageWithButtons(chatId, message, buttons) {
  const replyMarkup = {
    inline_keyboard: buttons.map((buttonRow) =>
      buttonRow.map((button) => ({
        text: button.text,
        callback_data: button.callback_data,
      }))
    ),
  };

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      reply_markup: replyMarkup,
    }),
  });
}
