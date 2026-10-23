/**
 * Email notification service for citizen responses
 * Dispatches automated notifications when MP Asma Derouiche responds to a request.
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";
import { getStoreItem, setStoreItem } from "./platform-store";

export interface SendResponseEmailOptions {
  to: string;
  citizenName: string;
  ticketId: string;
  status: string;
  feedbackMessage: string;
  pdfName?: string;
  pdfBase64?: string;
  pdfUrl?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  senderUsed?: string;
  warning?: string;
  error?: string;
}

export function generateCitizenEmailHtml({
  citizenName,
  ticketId,
  status,
  feedbackMessage,
  pdfName,
  pdfUrl,
}: {
  citizenName: string;
  ticketId: string;
  status: string;
  feedbackMessage: string;
  pdfName?: string;
  pdfUrl?: string;
}): string {
  const getStatusBadgeColor = (s: string) => {
    switch (s) {
      case "تم الحل":
        return "#16a34a"; // emerald-600
      case "بصدد الدرس":
        return "#d97706"; // amber-600
      case "تمت مراسلة الوزارة/البلدية":
        return "#2563eb"; // blue-600
      case "مرفوض":
        return "#dc2626"; // red-600
      default:
        return "#4b5563"; // zinc-600
    }
  };

  const statusColor = getStatusBadgeColor(status);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sawt-chaab-manouba.vercel.app";
  const trackingUrl = `${siteUrl}/track?id=${ticketId}`;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إفادة رسمية بخصوص مطلبكم - النائب أسماء درويش</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
          <!-- Top Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 13px; font-weight: bold; opacity: 0.95; letter-spacing: 0.5px; margin-bottom: 6px;">
                الجمهورية التونسية 🇹🇳 | مجلس نواب الشعب
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; line-height: 1.3;">
                المكتب البرلماني للنائب أسماء درويش
              </h1>
              <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
                دائرة معتمدية منوبة - الدندان | متابعة المطالب والعرائض
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 16px; font-weight: bold; color: #18181b; margin-top: 0; margin-bottom: 12px;">
                تحية برلمانية وبعد، السيد(ة) ${citizenName}،
              </p>

              <p style="font-size: 14px; line-height: 1.65; color: #3f3f46; margin-bottom: 20px;">
                نعلمكم بأنه تم تحيين ومتابعة المطلب الخاص بكم المودع لدى مكتب النائب أسماء درويش بدائرة منوبة - الدندان. وفيما يلي الإفادة الرسمية المحينة:
              </p>

              <!-- Ticket Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 22px; padding: 14px 18px;">
                <tr>
                  <td style="font-size: 13px; color: #64748b;">
                    رمز تتبع المطلب:
                  </td>
                  <td align="left" style="font-size: 16px; font-weight: 800; font-family: monospace; color: #dc2626; direction: ltr;">
                    ${ticketId}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding-top: 8px;">
                    الحالة الحالية:
                  </td>
                  <td align="left" style="padding-top: 8px;">
                    <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                      ${status}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- MP Feedback Box -->
              <div style="margin-bottom: 22px;">
                <div style="font-size: 13px; font-weight: bold; color: #991b1b; margin-bottom: 6px;">
                  📋 إفادة ورد مكتب النائب أسماء درويش:
                </div>
                <div style="background-color: #fef2f2; border-right: 4px solid #dc2626; padding: 16px; border-radius: 10px; font-size: 14px; line-height: 1.7; color: #1c1917;">
                  ${feedbackMessage.replace(/\n/g, "<br>")}
                </div>
              </div>

              ${
                pdfUrl || pdfName
                  ? `
              <!-- PDF Notice Box -->
              <div style="background-color: #eff6ff; border: 1px dashed #93c5fd; padding: 16px 18px; border-radius: 12px; margin-bottom: 22px;">
                <div style="font-size: 13px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">
                  📄 تم إرفاق وثيقة الرد الرسمي المعتمدة (PDF):
                </div>
                <div style="font-size: 12px; color: #3b82f6; margin-bottom: 10px;">
                  ${pdfName || `مراسلة_رسمية_${ticketId}.pdf`} - متوفرة للمعاينة والتحميل.
                </div>
                ${
                  pdfUrl
                    ? `
                <div>
                  <a href="${pdfUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: bold;">
                    تحميل ومعاينة الوثيقة المرفقة (PDF) 📥
                  </a>
                </div>
                `
                    : `
                <div style="font-size: 11px; color: #60a5fa;">
                  (ملف الرد الرسمي PDF مرفق مباشرة بهذا البريد الإلكتروني)
                </div>
                `
                }
              </div>
              `
                  : ""
              }

              <!-- Track Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: bold; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">
                  معاينة وتتبع مآل المطلب كاملاً عبر المنصة 🔍
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 18px 24px; text-align: center; font-size: 11px; color: #71717a; line-height: 1.5;">
              هذا إشعار إداري رسمي صادر آلياً من المنصة الرقمية للمكتب البرلماني للنائب أسماء درويش.<br>
              دائرة معتمدية منوبة - الدندان | الجمهورية التونسية © 2026
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch an email notification to the citizen
 */
export async function sendCitizenResponseEmail(
  options: SendResponseEmailOptions
): Promise<EmailDispatchResult> {
  const { to, citizenName, ticketId, status, feedbackMessage, pdfName, pdfBase64, pdfUrl } = options;

  if (!to || !to.includes("@")) {
    return { success: false, error: "البريد الإلكتروني للمواطن غير صالح أو غير محدد." };
  }

  const subject = `إفادة رسمية بخصوص مطلبكم [${ticketId}] - النائب أسماء درويش`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sawt-chaab-manouba.vercel.app";
  const trackingUrl = `${siteUrl}/track?id=${ticketId}`;

  const htmlContent = generateCitizenEmailHtml({
    citizenName,
    ticketId,
    status,
    feedbackMessage,
    pdfName,
    pdfUrl,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  const primarySender =
    process.env.SENDER_EMAIL ||
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    "المكتب البرلماني للنائب أسماء درويش <contact@asmaderouiche.website>";
  const fallbackSender = "المكتب البرلماني للنائب أسماء درويش <onboarding@resend.dev>";

  // 1. Try Resend Official SDK
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const attachments =
        pdfBase64 && pdfName
          ? [
              {
                filename: pdfName,
                content: Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ""), "base64"),
              },
            ]
          : undefined;

      console.log(`[email] Sending email to ${to} using primary sender: ${primarySender}...`);
      let resendResult = await resend.emails.send({
        from: primarySender,
        to: [to],
        subject,
        html: htmlContent,
        attachments,
      });

      // Domain verification fallback (if asmaderouiche.website is not yet verified in Resend)
      if (resendResult.error) {
        const errorMsg = resendResult.error.message || JSON.stringify(resendResult.error);
        console.warn(`[email] Resend primary sender error:`, errorMsg);

        if (primarySender !== fallbackSender) {
          console.log(`[email] Automatically retrying dispatch with fallback sender: ${fallbackSender}...`);
          const fallbackResult = await resend.emails.send({
            from: fallbackSender,
            to: [to],
            subject,
            html: htmlContent,
            attachments,
          });

          if (!fallbackResult.error && fallbackResult.data?.id) {
            console.log("\n" + "=".repeat(75));
            console.log(`✅ [LIVE EMAIL SENT via RESEND FALLBACK] Dispatched to ${to}`);
            console.log(`Ticket ID: ${ticketId} | Status: ${status}`);
            console.log(`Message ID: ${fallbackResult.data.id}`);
            console.log(`Sender: ${fallbackSender}`);
            console.log("=".repeat(75) + "\n");

            await logEmailDispatch({
              to,
              ticketId,
              status,
              citizenName,
              success: true,
              provider: "resend-onboarding-fallback",
              id: fallbackResult.data.id,
              sender: fallbackSender,
              timestamp: new Date().toISOString(),
            });

            return {
              success: true,
              messageId: fallbackResult.data.id,
              simulated: false,
              senderUsed: fallbackSender,
              warning: "تم الإرسال عبر النطاق التجريبي (onboarding@resend.dev) لأن نطاق asmaderouiche.website غير مكتمل التفعيل.",
            };
          } else if (fallbackResult.error) {
            console.error("[email] Resend fallback error:", fallbackResult.error);
            return {
              success: false,
              error: `فشل إرسال البريد عبر Resend: ${fallbackResult.error.message || errorMsg}`,
            };
          }
        } else {
          return {
            success: false,
            error: `فشل إرسال البريد عبر Resend: ${errorMsg}`,
          };
        }
      }

      if (resendResult.data?.id) {
        console.log("\n" + "=".repeat(75));
        console.log(`✅ [LIVE EMAIL SENT via RESEND] Dispatched from ${primarySender} to ${to}`);
        console.log(`Ticket ID: ${ticketId} | Status: ${status}`);
        console.log(`Message ID: ${resendResult.data.id}`);
        console.log("=".repeat(75) + "\n");

        await logEmailDispatch({
          to,
          ticketId,
          status,
          citizenName,
          success: true,
          provider: "resend",
          id: resendResult.data.id,
          sender: primarySender,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          messageId: resendResult.data.id,
          simulated: false,
          senderUsed: primarySender,
        };
      }
    } catch (err: any) {
      console.error("[email] Resend exception:", err);
      return {
        success: false,
        error: `استثناء تقني أثناء إرسال البريد عبر Resend: ${err?.message || "خطأ غير معروف"}`,
      };
    }
  }

  // 2. Simulation Fallback
  console.log("\n" + "=".repeat(75));
  console.log("📧 [EMAIL SIMULATION FALLBACK] Automated Notification Dispatched");
  console.log(`To: ${citizenName} <${to}>`);
  console.log(`Ticket ID: ${ticketId}`);
  console.log(`Status: ${status}`);
  console.log(`Subject: ${subject}`);
  console.log(`Feedback Message:\n${feedbackMessage}`);
  if (pdfName) {
    console.log(`Attached Document (PDF): ${pdfName}`);
  }
  console.log(`Citizen Tracking URL: ${trackingUrl}`);
  console.log("=".repeat(75) + "\n");

  await logEmailDispatch({
    to,
    ticketId,
    status,
    citizenName,
    success: true,
    provider: "simulated-cloud-logger",
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    simulated: true,
    messageId: `log-${Date.now()}`,
    senderUsed: primarySender,
  };
}

async function logEmailDispatch(entry: Record<string, any>) {
  try {
    const existingLogs = await getStoreItem<any[]>("email_notifications_log", []);
    existingLogs.unshift({
      ...entry,
      createdAt: new Date().toISOString(),
    });
    // keep latest 100 entries
    await setStoreItem("email_notifications_log", existingLogs.slice(0, 100));
  } catch (e) {
    console.warn("[email] Could not log email dispatch:", e);
  }
}
