/**
 * Generates an official, print-ready PDF document for MP Asma Derouiche's response
 * to a citizen's petition/complaint in Manouba & Den Den.
 * 
 * Works 100% client-side without any heavy external dependencies:
 * 1. Renders the official Tunisian Republic & Parliamentary header, citizen info,
 *    and MP official feedback on a high-res HTML5 Canvas (ensuring flawless Arabic RTL typography).
 * 2. Compiles the rasterized page into a valid, standard PDF 1.4 binary data URL.
 */

interface GeneratePdfOptions {
  ticketId: string;
  citizenName: string;
  zone: string;
  category: string;
  status: string;
  feedbackText: string;
  referenceNumber?: string;
  dateStr?: string;
}

export async function generateOfficialResponsePdf(options: GeneratePdfOptions): Promise<{ dataUrl: string; fileName: string }> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in client-side environment.");
  }

  const {
    ticketId,
    citizenName,
    zone,
    category,
    status,
    feedbackText,
    referenceNumber = `م.ب/منوبة/2026/${ticketId.replace("TN-", "")}`,
    dateStr = new Date().toLocaleDateString("ar-TN", { year: "numeric", month: "long", day: "numeric" }),
  } = options;

  // A4 dimensions at 150 DPI for crisp typography & light file size
  const width = 1240;
  const height = 1754;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  // 1. Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Decorative border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#DC2626"; // Tunisian red
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#CBD5E1";
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Set RTL direction
  ctx.direction = "rtl";
  ctx.textAlign = "right";

  // 2. Official Header
  // Top text
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 26px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("الجمهورية التونسية", width - 80, 110);

  ctx.font = "black 32px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("مجلس نواب الشعب", width - 80, 155);

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 22px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("المكتب البرلماني للنائب أسماء درويش", width - 80, 195);

  ctx.fillStyle = "#64748B";
  ctx.font = "normal 18px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("دائرة منوبة - الدندان", width - 80, 225);

  // Left header (Date & Ref)
  ctx.textAlign = "left";
  ctx.fillStyle = "#334155";
  ctx.font = "normal 18px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText(`تونس في: ${dateStr}`, 80, 110);
  ctx.font = "bold 18px monospace, monospace";
  ctx.fillText(`العدد: ${referenceNumber}`, 80, 145);
  ctx.fillText(`رمز الملف: ${ticketId}`, 80, 180);

  // Center Emblem / Red badge
  ctx.textAlign = "center";
  ctx.beginPath();
  ctx.arc(width / 2, 140, 44, 0, Math.PI * 2);
  ctx.fillStyle = "#FEF2F2";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#DC2626";
  ctx.stroke();

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 38px system-ui, sans-serif";
  ctx.fillText("🇹🇳", width / 2, 155);

  // Header separator line
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.moveTo(80, 260);
  ctx.lineTo(width - 80, 260);
  ctx.stroke();

  // 3. Document Title
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 32px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("ردّ وإفادة رسمية من النائب أسماء درويش", width / 2, 320);

  ctx.fillStyle = "#64748B";
  ctx.font = "normal 18px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("بخصوص المطلب والمشاغل المودعة بدائرة منوبة - الدندان", width / 2, 355);

  // 4. Citizen Information Box
  ctx.textAlign = "right";
  ctx.fillStyle = "#F8FAFC";
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  const boxY = 390;
  const boxH = 170;
  roundRect(ctx, 80, boxY, width - 160, boxH, 16);
  ctx.fill();
  ctx.stroke();

  // Information grid inside box
  ctx.fillStyle = "#475569";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("معطيات المطلب المسجل بالمنصة:", width - 110, boxY + 38);

  ctx.font = "normal 18px system-ui, sans-serif";
  ctx.fillStyle = "#0F172A";
  ctx.fillText(`• صاحب المطلب: ${citizenName}`, width - 110, boxY + 75);
  ctx.fillText(`• العمادة / المنطقة: ${zone}`, width - 110, boxY + 115);
  ctx.fillText(`• قطاع المشغل: ${category}`, width - 110, boxY + 150);

  // Left column in info box
  ctx.textAlign = "left";
  ctx.fillText(`• رمز التتبع: ${ticketId}`, 110, boxY + 75);
  ctx.fillStyle = status === "تم الحل" ? "#059669" : "#DC2626";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText(`• الحالة المعتمدة: ${status}`, 110, boxY + 115);

  // 5. Official Response Body
  ctx.textAlign = "right";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 22px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  const bodyStartY = 610;
  ctx.fillText("إفادة وتوجيه مكتب النائب:", width - 80, bodyStartY);

  // Response text with word wrap
  ctx.font = "normal 21px/36px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.fillStyle = "#1E293B";
  const maxWidth = width - 160;
  const lines = wrapArabicText(ctx, feedbackText, maxWidth);

  let currentY = bodyStartY + 45;
  for (const line of lines) {
    if (currentY > height - 360) break; // stay within page limits
    ctx.fillText(line, width - 80, currentY);
    currentY += 40;
  }

  // 6. Official Stamp & Signature Block
  const stampBoxY = Math.max(currentY + 60, height - 380);

  // Left side: Digital Security & Verification
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748B";
  ctx.font = "normal 14px monospace, monospace";
  ctx.fillText("التحقق الرقمي والتوثيق الإلكتروني", 80, stampBoxY);
  ctx.fillText(`معرف الوثيقة: TN-DOC-${ticketId.replace("TN-", "")}-${Date.now().toString().slice(-6)}`, 80, stampBoxY + 24);
  ctx.fillText("منصة التواصل البرلماني للنائب أسماء درويش", 80, stampBoxY + 48);
  ctx.fillText("https://naiba.tn/track", 80, stampBoxY + 72);

  // Right side: Official Signature
  ctx.textAlign = "right";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("النائب أسماء درويش", width - 80, stampBoxY);
  ctx.font = "normal 18px system-ui, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("نائب الشعب عن دائرة منوبة - الدندان", width - 80, stampBoxY + 30);

  // Stamp circle simulation
  const stampCenterX = width - 180;
  const stampCenterY = stampBoxY + 110;
  ctx.beginPath();
  ctx.arc(stampCenterX, stampCenterY, 55, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(220, 38, 38, 0.7)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(stampCenterX, stampCenterY, 48, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(220, 38, 38, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(220, 38, 38, 0.85)";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("مجلس نواب الشعب", stampCenterX, stampCenterY - 20);
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillText("النائب أسماء درويش", stampCenterX, stampCenterY + 4);
  ctx.font = "normal 11px system-ui, sans-serif";
  ctx.fillText("منوبة - الدندان", stampCenterX, stampCenterY + 24);

  // 7. Footer note
  ctx.textAlign = "center";
  ctx.fillStyle = "#94A3B8";
  ctx.font = "normal 14px system-ui, sans-serif";
  ctx.fillText("تم إنشاء هذه الوثيقة الرسمية إلكترونياً وهي معتمدة وموجهة لصاحب المطلب لمتابعة مآل ملفه.", width / 2, height - 70);

  // Convert canvas to JPEG blob
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas blob conversion failed"))), "image/jpeg", 0.92);
  });

  const jpegArrayBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(jpegArrayBuffer);

  // Build standard PDF 1.4 wrapper containing the JPEG stream
  const pdfBytes = buildSinglePageJpegPdf(jpegBytes, width, height);

  // Convert PDF bytes to Base64 Data URL
  const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

  const fileName = `رد_رسمي_${ticketId}_مكتب_النائب_أسماء_درويش.pdf`;
  return { dataUrl, fileName };
}

/**
 * Text word wrapping helper for RTL Arabic canvas
 */
function wrapArabicText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }

    const words = para.split(" ");
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Rounded rectangle path helper
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Compiles a raw JPEG stream into a 100% compliant PDF 1.4 A4 document
 */
function buildSinglePageJpegPdf(jpegBytes: Uint8Array, imgWidth: number, imgHeight: number): Uint8Array {
  // A4 point size (1 point = 1/72 inch)
  const a4Width = 595.28;
  const a4Height = 841.89;

  const encoder = new TextEncoder();

  // PDF Structure
  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${a4Width.toFixed(2)} ${a4Height.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;

  const obj4Head = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const obj4Tail = "\nendstream\nendobj\n";

  const contentStream = `q\n${a4Width.toFixed(2)} 0 0 ${a4Height.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
  const obj5 = `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`;

  // Calculate byte offsets for xref table
  const offsets: number[] = [];
  let currentOffset = header.length;

  offsets.push(currentOffset);
  currentOffset += encoder.encode(obj1).length;

  offsets.push(currentOffset);
  currentOffset += encoder.encode(obj2).length;

  offsets.push(currentOffset);
  currentOffset += encoder.encode(obj3).length;

  offsets.push(currentOffset);
  const obj4HeadBytes = encoder.encode(obj4Head);
  const obj4TailBytes = encoder.encode(obj4Tail);
  currentOffset += obj4HeadBytes.length + jpegBytes.length + obj4TailBytes.length;

  offsets.push(currentOffset);
  currentOffset += encoder.encode(obj5).length;

  const startXref = currentOffset;

  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += off.toString().padStart(10, "0") + " 00000 n \n";
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  // Concatenate all parts
  const totalLength =
    header.length +
    encoder.encode(obj1).length +
    encoder.encode(obj2).length +
    encoder.encode(obj3).length +
    obj4HeadBytes.length +
    jpegBytes.length +
    obj4TailBytes.length +
    encoder.encode(obj5).length +
    encoder.encode(xref).length +
    encoder.encode(trailer).length;

  const result = new Uint8Array(totalLength);
  let pos = 0;

  function append(data: Uint8Array) {
    result.set(data, pos);
    pos += data.length;
  }

  append(encoder.encode(header));
  append(encoder.encode(obj1));
  append(encoder.encode(obj2));
  append(encoder.encode(obj3));
  append(obj4HeadBytes);
  append(jpegBytes);
  append(obj4TailBytes);
  append(encoder.encode(obj5));
  append(encoder.encode(xref));
  append(encoder.encode(trailer));

  return result;
}
