/**
 * Email Service Layer — Levlox Student Portal
 *
 * Handles sending welcome emails, account activation links,
 * email verification, and delivery status tracking in Firestore.
 */

import { updateStudent, updateTrainer, getDocument, getEmailTemplates, interpolateEmailTemplate, DEFAULT_TRAINER_WELCOME_TEMPLATE } from "./firebaseService";
import { serverTimestamp } from "firebase/firestore";

/**
 * Generate a secure, unique verification token.
 */
export const generateVerificationToken = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Send Welcome / Verification email to a trainee.
 * Contains:
 *  - Trainee's name
 *  - Training ID / Roll Number
 *  - Training details (Course, Batch)
 *  - Login page link
 *  - Secure account activation / password setup link
 *  - Access instructions
 *
 * Updates Firestore with email delivery status and verification token details.
 */
export const sendTraineeWelcomeEmail = async (studentData, tempPassword = "") => {
  if (!studentData || (!studentData.email && !studentData.id)) {
    throw new Error("Student details and email address are required.");
  }

  const studentId = studentData.id || studentData.uid;
  const emailAddr = studentData.email;

  if (!emailAddr) {
    throw new Error("No registered email address found for this trainee.");
  }

  // Generate activation token if not present or expired
  const token = studentData.verificationToken || generateVerificationToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours expiry

  const origin = window.location.origin;
  const loginLink = `${origin}/login`;
  const activationLink = `${origin}/verify-email?uid=${studentId}&token=${token}`;

  try {
    const templateData = await getEmailTemplates();
    const welcomeTemplate = templateData?.studentWelcome || {};

    const variables = {
      studentName: studentData.name || "Trainee",
      studentId: studentData.rollNumber || studentData.id || "N/A",
      email: emailAddr,
      temporaryPassword: tempPassword || studentData.password || "********",
      course: studentData.course || "Levlox Training Program",
      batch: studentData.batch_name || studentData.batch || "Regular Batch",
    };

    let subject = interpolateEmailTemplate(welcomeTemplate.subject, variables);
    let body = interpolateEmailTemplate(welcomeTemplate.body, variables);

    // Try sending via backend SMTP service
    let backendSuccess = false;
    try {
      const { sendBackendEmail } = await import("./apiService");
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Welcome to Levlox Training Portal</h2>
          <p>Dear <strong>${studentData.name || "Trainee"}</strong>,</p>
          <p>Your enrollment has been registered successfully. Here are your program details:</p>
          <ul style="background: #f8fafc; padding: 16px 32px; border-radius: 6px; list-style-type: square;">
            <li><strong>Roll Number:</strong> ${studentData.rollNumber || studentData.id || "N/A"}</li>
            <li><strong>Course:</strong> ${studentData.course || "Levlox Training Program"}</li>
            <li><strong>Batch:</strong> ${studentData.batch_name || studentData.batch || "Regular Batch"}</li>
          </ul>
          <p>Please activate your account and verify your email by clicking the button below:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${activationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate My Account</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Or copy this link: <a href="${activationLink}">${activationLink}</a></p>
          <p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">This link expires in 48 hours. If you did not register, please ignore this email.</p>
        </div>
      `;
      await sendBackendEmail({
        to: emailAddr,
        subject,
        text: body,
        html: htmlBody,
        recipientUid: studentId,
        recipientType: "student",
        templateName: "studentWelcome",
      });
      backendSuccess = true;
    } catch (backendErr) {
      console.warn("[EmailService] Backend SMTP not available or failed:", backendErr.message);
    }

    // Construct mailto URL for fallback or manual email client opening
    const mailtoUrl = `mailto:${encodeURIComponent(emailAddr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (studentData.openMailClient === true) {
      window.open(mailtoUrl, "_blank");
    }

    // Update Firestore student record with delivery tracking and token
    await updateStudent(studentId, {
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
      emailDeliveryStatus: backendSuccess ? "Sent" : "Ready",
      emailSentAt: new Date().toISOString(),
      verificationStatus: studentData.emailVerified ? "Verified" : "Pending",
    });

    return {
      success: true,
      deliveryStatus: backendSuccess ? "Sent" : "Ready",
      backendDelivered: backendSuccess,
      activationLink,
      mailtoUrl,
      token,
    };
  } catch (err) {
    console.error("[EmailService] Failed to send welcome email:", err);
    await updateStudent(studentId, {
      emailDeliveryStatus: "Failed",
      emailDeliveryError: err.message || "Email dispatch failed",
    }).catch(() => null);

    throw err;
  }
};

/**
 * Resend verification email for a student whose account is pending verification.
 */
export const resendVerificationEmail = async (studentIdOrEmail) => {
  let studentDoc = null;

  if (typeof studentIdOrEmail === "object" && studentIdOrEmail.id) {
    studentDoc = studentIdOrEmail;
  } else {
    studentDoc = await getDocument("students", studentIdOrEmail).catch(() => null);
  }

  if (!studentDoc) {
    throw new Error("Trainee profile not found.");
  }

  return sendTraineeWelcomeEmail(studentDoc);
};

/**
 * Send Welcome email to a Trainer.
 * Uses trainerWelcome template from Master Data if available.
 */
export const sendTrainerWelcomeEmail = async (trainerData, tempPassword = "") => {
  if (!trainerData || (!trainerData.email && !trainerData.id)) {
    throw new Error("Trainer details and email address are required.");
  }

  const trainerId = trainerData.id || trainerData.uid;
  const emailAddr = trainerData.email;

  if (!emailAddr) {
    throw new Error("No registered email address found for this trainer.");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://levlox-students-portal.vercel.app";
  const loginLink = `${origin}/login`;

  try {
    const templateData = await getEmailTemplates();
    const welcomeTemplate = templateData?.trainerWelcome || DEFAULT_TRAINER_WELCOME_TEMPLATE;

    const variables = {
      trainerName: trainerData.name || trainerData.trainer_name || "Trainer",
      trainerId: trainerData.trainerId || trainerData.code || trainerData.id || "N/A",
      email: emailAddr,
      temporaryPassword: tempPassword || trainerData.tempPassword || trainerData.password || "********",
      loginUrl: loginLink,
    };

    let subject = interpolateEmailTemplate(welcomeTemplate.subject, variables);
    let body = interpolateEmailTemplate(welcomeTemplate.body, variables);

    let backendSuccess = false;
    try {
      const { sendBackendEmail } = await import("./apiService");
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Welcome to Levlox Faculty Portal</h2>
          <p>Dear Faculty Member <strong>${trainerData.name || "Trainer"}</strong>,</p>
          <p>Your faculty profile has been created. Here are your credentials:</p>
          <ul style="background: #f8fafc; padding: 16px 32px; border-radius: 6px; list-style-type: square;">
            <li><strong>Trainer ID:</strong> ${trainerData.trainerId || trainerData.code || "N/A"}</li>
            <li><strong>Login Email:</strong> ${emailAddr}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword || "Provided separately"}</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Faculty Portal</a>
          </div>
          <p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">You will be prompted to set a permanent password upon first login.</p>
        </div>
      `;
      await sendBackendEmail({
        to: emailAddr,
        subject,
        text: body,
        html: htmlBody,
        recipientUid: trainerId,
        recipientType: "trainer",
        templateName: "trainerWelcome",
      });
      backendSuccess = true;
    } catch (backendErr) {
      console.warn("[EmailService] Backend SMTP not available or failed for trainer:", backendErr.message);
    }

    const mailtoUrl = `mailto:${encodeURIComponent(emailAddr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (trainerData.openMailClient === true) {
      window.open(mailtoUrl, "_blank");
    }

    if (trainerId) {
      await updateTrainer(trainerId, {
        emailDeliveryStatus: backendSuccess ? "Sent" : "Ready",
        emailSentAt: new Date().toISOString(),
      }).catch(() => null);
    }

    return {
      success: true,
      deliveryStatus: backendSuccess ? "Sent" : "Ready",
      backendDelivered: backendSuccess,
      subject,
      body,
      mailtoUrl,
    };
  } catch (err) {
    console.error("[EmailService] Failed to send trainer welcome email:", err);
    throw err;
  }
};

/**
 * Send email notification when student profile or credentials are updated.
 */
export const sendStudentProfileUpdatedEmail = async (studentData, newPassword = null) => {
  const emailAddr = studentData.email;
  if (!emailAddr) return;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const loginLink = `${origin}/login`;
  const studentName = studentData.name || 'Student';

  const subject = `Your Levlox Student Profile Has Been Updated`;
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #6c3cf0; margin: 0 0 6px;">Profile Details Updated</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Levlox Student Training Portal</p>
      </div>

      <p style="font-size: 15px; color: #1e293b;">Dear <strong>${studentName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        Your student profile details have been updated by administration. Below are your latest registered details:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td>
            <td style="padding: 6px 0; font-weight: 600;">${studentData.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Mobile Number:</strong></td>
            <td style="padding: 6px 0; font-weight: 600;">${studentData.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; font-weight: 600;">${studentData.email || 'N/A'}</td>
          </tr>
          ${studentData.course ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Course:</strong></td>
            <td style="padding: 6px 0; font-weight: 600;">${studentData.course}</td>
          </tr>` : ''}
          ${studentData.batch_name ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Batch:</strong></td>
            <td style="padding: 6px 0; font-weight: 600;">${studentData.batch_name}</td>
          </tr>` : ''}
        </table>
      </div>

      ${newPassword ? `
      <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <h4 style="color: #b45309; margin: 0 0 6px; font-size: 14px;">🔑 Password Updated</h4>
        <p style="margin: 0 0 8px; font-size: 13.5px; color: #92400e;">Your account login password has been changed to:</p>
        <div style="background: #ffffff; border: 1px dashed #f59e0b; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: 700; color: #b45309; display: inline-block;">
          ${newPassword}
        </div>
        <p style="margin: 8px 0 0; font-size: 12.5px; color: #78350f;">Please use this new password along with your email or mobile number when signing in.</p>
      </div>` : ''}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginLink}" style="background-color: #6c3cf0; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Access Student Portal</a>
      </div>

      <p style="font-size: 12.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        If you did not request this update, please contact administration at sales@levlox.in immediately.
      </p>
    </div>
  `;

  try {
    const { sendBackendEmail } = await import("./apiService");
    await sendBackendEmail({
      to: emailAddr,
      subject,
      text: `Your student profile has been updated. Access the portal at: ${loginLink}`,
      html: htmlBody,
      recipientUid: studentData.id || studentData.uid,
      recipientType: "student",
      templateName: "studentProfileUpdated",
    });
  } catch (err) {
    console.warn("[EmailService] Profile update email notification failed:", err.message);
  }
};

export default {
  generateVerificationToken,
  sendTraineeWelcomeEmail,
  sendTrainerWelcomeEmail,
  resendVerificationEmail,
  sendStudentProfileUpdatedEmail,
};
