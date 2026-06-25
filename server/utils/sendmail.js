import { Resend } from "resend";
import { USER_MAIL , RESEND_API_KEY} from "../config/env";

const resend = new Resend(RESEND_API_KEY);

export async function sendEmail(to, subject, html) {
  return resend.emails.send({
    from: USER_MAIL,
    to,
    subject,
    html,
  });
}
