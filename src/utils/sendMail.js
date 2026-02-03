const nodemailer = require("nodemailer");

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"🕸️ DevConnect" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {

    console.error("Email send failed:", err);
    throw new Error("Unable to send email");

  }
};

module.exports = {
  sendMail
};
