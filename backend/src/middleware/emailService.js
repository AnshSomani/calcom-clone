const nodemailer = require('nodemailer');

// Create transporter - uses environment SMTP config or Ethereal (test) by default
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Use real SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use Ethereal test account (auto-created, no setup needed)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Email preview URL: https://ethereal.email');
    console.log(`   Login: ${testAccount.user} / ${testAccount.pass}`);
  }

  return transporter;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

async function sendBookingConfirmation({ booking, eventType, hostName, hostEmail, rescheduleUrl, cancelUrl }) {
  try {
    const t = await getTransporter();
    const startFormatted = formatDateTime(booking.start_time);
    const endFormatted = formatDateTime(booking.end_time);
    const fromEmail = process.env.SMTP_FROM || `Cal.com Clone <noreply@calcom.local>`;

    // Email to booker
    const bookerMail = await t.sendMail({
      from: fromEmail,
      to: `${booking.booker_name} <${booking.booker_email}>`,
      subject: `Booking Confirmed: ${eventType.title} with ${hostName}`,
      html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="background: #111827; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 28px; margin-bottom: 8px;">✅</div>
            <h1 style="color: white; font-size: 20px; margin: 0 0 4px;">Booking Confirmed!</h1>
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">Your meeting has been scheduled</p>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px;">${eventType.title}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 100px;">📅 Date</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 500;">${startFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">⏱ Duration</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 500;">${eventType.duration} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">👤 Host</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 500;">${hostName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">📍 Where</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 500;">${eventType.location || 'Online'}</td>
              </tr>
            </table>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            ${rescheduleUrl ? `<a href="${rescheduleUrl}" style="flex: 1; display: block; text-align: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; color: #111827; text-decoration: none; font-size: 13px; font-weight: 500;">Reschedule</a>` : ''}
            ${cancelUrl ? `<a href="${cancelUrl}" style="flex: 1; display: block; text-align: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; color: #dc2626; text-decoration: none; font-size: 13px; font-weight: 500;">Cancel</a>` : ''}
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Booking ID: ${booking.uid} • Powered by Cal.com Clone
          </p>
        </div>
      `,
    });

    // Email to host
    const hostMail = await t.sendMail({
      from: fromEmail,
      to: `${hostName} <${hostEmail}>`,
      subject: `New Booking: ${eventType.title} with ${booking.booker_name}`,
      html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="background: #111827; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 28px; margin-bottom: 8px;">📅</div>
            <h1 style="color: white; font-size: 20px; margin: 0 0 4px;">New Meeting Booked!</h1>
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">${booking.booker_name} scheduled a time with you</p>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px;">${eventType.title}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 100px;">📅 Date</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 500;">${startFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">👤 Guest</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 500;">${booking.booker_name} &lt;${booking.booker_email}&gt;</td>
              </tr>
              ${booking.notes ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">📝 Notes</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${booking.notes}</td></tr>` : ''}
            </table>
          </div>
        </div>
      `,
    });

    if (!process.env.SMTP_HOST) {
      console.log(`📧 Booker email preview: ${nodemailer.getTestMessageUrl(bookerMail)}`);
      console.log(`📧 Host email preview: ${nodemailer.getTestMessageUrl(hostMail)}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendCancellationEmail({ booking, eventType, hostName, reason }) {
  try {
    const t = await getTransporter();
    const fromEmail = process.env.SMTP_FROM || `Cal.com Clone <noreply@calcom.local>`;
    const startFormatted = formatDateTime(booking.start_time);

    const mail = await t.sendMail({
      from: fromEmail,
      to: `${booking.booker_name} <${booking.booker_email}>`,
      subject: `Booking Cancelled: ${eventType.title}`,
      html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="background: #dc2626; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 28px; margin-bottom: 8px;">❌</div>
            <h1 style="color: white; font-size: 20px; margin: 0 0 4px;">Booking Cancelled</h1>
            <p style="color: #fca5a5; margin: 0; font-size: 14px;">Your meeting has been cancelled</p>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>${eventType.title}</strong> with ${hostName}</p>
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">Originally scheduled: ${startFormatted}</p>
            ${reason ? `<p style="color: #6b7280; font-size: 13px; margin: 0;">Reason: ${reason}</p>` : ''}
          </div>
        </div>
      `,
    });

    if (!process.env.SMTP_HOST) {
      console.log(`📧 Cancellation email preview: ${nodemailer.getTestMessageUrl(mail)}`);
    }
    return { success: true };
  } catch (err) {
    console.error('Cancellation email error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendRescheduleEmail({ booking, eventType, hostName, oldStartTime }) {
  try {
    const t = await getTransporter();
    const fromEmail = process.env.SMTP_FROM || `Cal.com Clone <noreply@calcom.local>`;

    const mail = await t.sendMail({
      from: fromEmail,
      to: `${booking.booker_name} <${booking.booker_email}>`,
      subject: `Booking Rescheduled: ${eventType.title}`,
      html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <div style="background: #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 28px; margin-bottom: 8px;">🔄</div>
            <h1 style="color: white; font-size: 20px; margin: 0 0 4px;">Booking Rescheduled</h1>
            <p style="color: #bfdbfe; margin: 0; font-size: 14px;">Your meeting time has changed</p>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">Old time: <s>${formatDateTime(oldStartTime)}</s></p>
            <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">New time: ${formatDateTime(booking.start_time)}</p>
          </div>
        </div>
      `,
    });

    if (!process.env.SMTP_HOST) {
      console.log(`📧 Reschedule email preview: ${nodemailer.getTestMessageUrl(mail)}`);
    }
    return { success: true };
  } catch (err) {
    console.error('Reschedule email error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendBookingConfirmation, sendCancellationEmail, sendRescheduleEmail };
