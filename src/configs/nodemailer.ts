import nodemailer from "nodemailer";
import { env } from "@/configs/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 587);
  const user = env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = env.EMAIL_FROM;
  if (!host || !user || !pass || !from) {
    throw new Error("SMTP/EMAIL env not configured");
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(subject: string, html: string) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: `<${env.EMAIL_FROM}>`,
    to: env.ADMIN_EMAIL,
    subject,
    html,
  });
}
