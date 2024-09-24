import nodemailer from "nodemailer";
import path from "path";

const transporter = nodemailer.createTransport({
  host: "mail.akasia.id",
  port: 465,
  secure: true,
  auth: {
    user: "botdriver@akasia.id",
    pass: "fSR93*Rpdh.1E7",
  },
});

export const sendEmailWithAttachment = async (filePath) => {
  try {
    await transporter.sendMail({
      from: '"Ronald Driver Bot" <botdriver@akasia.id>',
      to: "ronald@akasia.id",
      subject: "Ronald Driver - Rekap Harian",
      text: "Berikut adalah rekap harian untuk hari ini.",
      attachments: [
        {
          filename: path.basename(filePath),
          path: filePath,
        },
      ],
    });

    console.log("Email with attachment sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
