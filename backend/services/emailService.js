const nodemailer = require("nodemailer");
require("dotenv").config();

const User = require("../models/User");
const Subscription = require("../models/Subscription");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 465),
  secure: String(process.env.EMAIL_PORT || 465) === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BRAND_NAME = "LankaNest";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ashelono@gmail.com";

const baseStyles = `
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background-color: #0284c7; padding: 20px; text-align: center; }
  .header h1 { color: white; margin: 0; }
  .content { padding: 30px; background-color: #f9f9f9; border-radius: 4px; margin: 20px 0; }
  .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  .code { display: inline-block; padding: 10px 20px; background-color: #0284c7; color: white; font-weight: bold; font-size: 20px; border-radius: 4px; margin: 10px 0; }
  .name { color: #0284c7; font-weight: bold; }
  .label { font-weight: bold; color: #0284c7; }
  .message { background-color: white; padding: 15px; border-left: 4px solid #0284c7; margin: 10px 0; }
  .button { background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; font-weight: bold; }
  .date { font-weight: bold; color: #0284c7; }
`;

const wrapEmail = (title, body) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>${baseStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${BRAND_NAME}</h1>
      </div>
      <div class="content">
        ${title ? `<h2>${title}</h2>` : ""}
        ${body}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

const sendVerificationEmail = async (to, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Verify Your ${BRAND_NAME} Account`,
      html: wrapEmail(
        `Welcome to ${BRAND_NAME}!`,
        `
          <p>Thank you for joining our community. To complete your registration, please verify your email address with the code below:</p>
          <div class="code">${code}</div>
          <p>Please enter this code in the app to verify your email.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", to);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

const sendWelcomeEmail = async (to, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Welcome to ${BRAND_NAME}!`,
      html: wrapEmail(
        `Hello, <span class="name">${name}</span>!`,
        `
          <p>Thank you for verifying your email. Welcome to ${BRAND_NAME}!</p>
          <p>We're excited to help you find your perfect boarding house. Our platform connects students with quality accommodation options near your university.</p>
          <p>Feel free to explore listings and reach out if you need any assistance.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", to);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

const sendInquiryEmail = async (inquiryType, email, name, phone, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: `New Inquiry: ${inquiryType}`,
      replyTo: email,
      html: wrapEmail(
        "New Inquiry from Website",
        `
          <p><span class="label">From:</span> ${name} (${email})</p>
          <p><span class="label">Phone:</span> ${phone || "Not provided"}</p>
          <p><span class="label">Inquiry Type:</span> ${inquiryType}</p>
          <p><span class="label">Message:</span></p>
          <div class="message">${message}</div>
        `
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Inquiry email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending inquiry email:", error);
    throw error;
  }
};

const informLandlordVerify = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${BRAND_NAME} Account Verification`,
      html: wrapEmail(
        `Hello, ${name}!`,
        `
          <p>Your account has been verified.</p>
          <p>Now you can log into your dashboard and add listings.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to landlord:", email);
    return true;
  } catch (error) {
    console.error("Error sending verification email to landlord:", error);
    throw error;
  }
};

const sendScheduleNotification = async (
  studentEmail,
  studentName,
  landlordEmail,
  landlordName,
  listingName,
  date,
  time
) => {
  try {
    const studentMailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: "Visit Schedule Confirmation - LankaNest",
      html: wrapEmail(
        `Hello, ${studentName}!`,
        `
          <p>Your visit to <b>${listingName}</b> has been scheduled successfully.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>The landlord has been notified of your visit. Please make sure to arrive on time.</p>
        `
      ),
    };

    const landlordMailOptions = {
      from: process.env.EMAIL_USER,
      to: landlordEmail,
      subject: "New Visit Schedule - LankaNest",
      html: wrapEmail(
        `Hello, ${landlordName}!`,
        `
          <p>A student has scheduled a visit to your property <b>${listingName}</b>.</p>
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>Please ensure you or your representative is available at the specified time.</p>
        `
      ),
    };

    await transporter.sendMail(studentMailOptions);
    console.log("Schedule notification sent to student:", studentEmail);

    await transporter.sendMail(landlordMailOptions);
    console.log("Schedule notification sent to landlord:", landlordEmail);

    return true;
  } catch (error) {
    console.error("Error sending schedule notification emails:", error);
    throw error;
  }
};

const sendScheduleStatusEmail = async (
  studentEmail,
  studentName,
  landlordName,
  listingName,
  date,
  time,
  status
) => {
  try {
    const subject =
      status === "confirmed"
        ? "Visit Schedule Confirmed - LankaNest"
        : "Visit Schedule Rejected - LankaNest";

    const statusMessage =
      status === "confirmed"
        ? `<p>Your scheduled visit to <b>${listingName}</b> has been <span style="color: green; font-weight: bold;">CONFIRMED</span> by the landlord.</p><p>Please make sure to arrive at the property on time.</p>`
        : `<p>We regret to inform you that your scheduled visit to <b>${listingName}</b> has been <span style="color: red; font-weight: bold;">REJECTED</span> by the landlord.</p><p>This could be due to schedule conflicts or other reasons. You may want to contact the landlord directly for more information or schedule a different time.</p>`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject,
      html: wrapEmail(
        `Hello, ${studentName}!`,
        `
          ${statusMessage}
          <p><strong>Property:</strong> ${listingName}</p>
          <p><strong>Landlord:</strong> ${landlordName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>If you have any questions, please contact us or the landlord directly.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Schedule ${status} notification sent to student:`, studentEmail);
    return true;
  } catch (error) {
    console.error(`Error sending schedule ${status} notification email:`, error);
    throw error;
  }
};

const sendReportEmail = async (
  reporterName,
  reporterEmail,
  listingName,
  reportType,
  description
) => {
  try {
    const reporterMailOptions = {
      from: process.env.EMAIL_USER,
      to: reporterEmail,
      subject: "Your Report Has Been Received - LankaNest",
      html: wrapEmail(
        `Hello, ${reporterName}!`,
        `
          <p>Thank you for submitting a report. Your report regarding <b>${listingName}</b> has been received.</p>
          <p><strong>Report Type:</strong> ${reportType}</p>
          <p>Our administrative team will review your report and take appropriate action. You may be contacted if we need additional information.</p>
        `
      ),
    };

    await transporter.sendMail(reporterMailOptions);
    console.log("Report confirmation sent to reporter:", reporterEmail);
    return true;
  } catch (error) {
    console.error("Error sending report notification emails:", error);
    throw error;
  }
};

const sendPasswordResetEmail = async (to, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Reset Your ${BRAND_NAME} Password`,
      html: wrapEmail(
        "Password Reset Request",
        `
          <p>You requested to reset your password for your ${BRAND_NAME} account.</p>
          <div class="code">${code}</div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent to:", to);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

const sendSubscriptionConfirmationEmail = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `${BRAND_NAME} Premium Subscription Confirmation`,
      html: wrapEmail(
        "Thank you for subscribing to LankaNest Premium!",
        `
          <p>Dear ${user.username},</p>
          <p>Your premium subscription has been activated successfully. You now have access to unlimited property listings and all premium features.</p>
          <p>Your subscription will expire in 30 days. We will send you a reminder 3 days before expiration.</p>
          <p>Thank you for choosing ${BRAND_NAME}.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Subscription confirmation email sent to:", user.email);
    return true;
  } catch (error) {
    console.error("Error sending subscription confirmation email:", error);
    return false;
  }
};

const sendSubscriptionExpirationReminder = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) return false;

    const expirationDate = new Date(subscription.nextBillingDate);
    const formattedDate = expirationDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Your ${BRAND_NAME} Premium Subscription is Expiring Soon`,
      html: wrapEmail(
        "Your Premium Subscription is Expiring Soon",
        `
          <p>Dear ${user.username},</p>
          <p>Your ${BRAND_NAME} premium subscription will expire on <span class="date">${formattedDate}</span>.</p>
          <p>To continue enjoying unlimited property listings and all premium features, please log in to your dashboard and renew your subscription.</p>
          <a href="${process.env.FRONTEND_URL}/landlord/pricing" class="button">Renew Now</a>
          <p>If you choose not to renew, your account will be downgraded to the free plan with limited features.</p>
          <p>Thank you for choosing ${BRAND_NAME}.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Subscription expiration reminder sent to:", user.email);
    return true;
  } catch (error) {
    console.error("Error sending subscription expiration reminder:", error);
    return false;
  }
};

const sendSubscriptionExpiredEmail = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Your ${BRAND_NAME} Premium Subscription Has Expired`,
      html: wrapEmail(
        "Your Premium Subscription Has Expired",
        `
          <p>Dear ${user.username},</p>
          <p>Your ${BRAND_NAME} premium subscription has expired. Your account has been downgraded to the free plan.</p>
          <p>What this means:</p>
          <ul>
            <li>Your oldest property listing remains active</li>
            <li>Additional listings are now on hold and not visible to students</li>
            <li>You no longer have access to premium features</li>
          </ul>
          <p>To restore all your listings and premium features, please renew your subscription.</p>
          <a href="${process.env.FRONTEND_URL}/landlord/pricing" class="button">Renew Now</a>
          <p>Thank you for choosing ${BRAND_NAME}.</p>
        `
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log("Subscription expired email sent to:", user.email);
    return true;
  } catch (error) {
    console.error("Error sending subscription expired email:", error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendInquiryEmail,
  informLandlordVerify,
  sendScheduleNotification,
  sendScheduleStatusEmail,
  sendReportEmail,
  sendPasswordResetEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionExpirationReminder,
  sendSubscriptionExpiredEmail,
};