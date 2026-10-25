import { LegislativeProposal } from "./types";

/**
 * Generates an official, print-ready PDF document for MP Asma Derouiche's legislative proposal
 * or written parliamentary question in the Assembly of the Representatives of the People (ARP).
 */
export async function generateLegislativeProposalPdf(
  proposal: LegislativeProposal
): Promise<{ dataUrl: string; fileName: string }> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in client-side environment.");
  }

  const width = 1240;
  const height = 1754;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  // 1. Crisp White Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 2. Official Outer Border
  ctx.strokeStyle = "#b91c1c"; // Red accent
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = "#e4e4e7"; // Thin inner border
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // 3. Top Tunisian Flag & Seal Banner
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(48, 48, width - 96, 170);

  ctx.fillStyle = "#b91c1c";
  ctx.fillRect(48, 218, width - 96, 4);

  // Try to load Tunisia flag image
  try {
    const flagImg = new Image();
    flagImg.crossOrigin = "anonymous";
    flagImg.src = "/tunisia-flag.jpg";
    await new Promise<void>((resolve) => {
      flagImg.onload = () => resolve();
      flagImg.onerror = () => resolve();
      setTimeout(resolve, 350);
    });
    if (flagImg.complete && flagImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(140, 133, 44, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(flagImg, 96, 89, 88, 88);
      ctx.restore();
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(140, 133, 45, 0, Math.PI * 2);
      ctx.stroke();
    }
  } catch {}

  // 4. Official Parliamentary Header Text
  ctx.textAlign = "center";
  ctx.direction = "rtl";

  ctx.fillStyle = "#18181b";
  ctx.font = "bold 26px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("الـجـمـهـوريـة الـتـونـسـيـة", width / 2, 95);

  ctx.fillStyle = "#b91c1c";
  ctx.font = "bold 32px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("مـجـلـس نـواب الـشـعـب", width / 2, 140);

  ctx.fillStyle = "#52525b";
  ctx.font = "bold 20px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("المكتب البرلماني للنائب أسماء درويش — دائرة معتمدية منوبة - الدندان", width / 2, 185);

  // 5. Document Type Title Banner
  ctx.fillStyle = "#fef2f2";
  ctx.strokeStyle = "#fecaca";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(80, 245, width - 160, 80, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#991b1b";
  ctx.font = "bold 28px 'Segoe UI', Tahoma, Arial, sans-serif";
  const mainBadgeTitle =
    proposal.type === "مسائلة كتابية"
      ? "وثيقة مسائلة كتابية برلمانية موجهة للحكومة"
      : "وثيقة رسمية لمبادرة تشريعية برلمانية ومقترح قانون";
  ctx.fillText(mainBadgeTitle, width / 2, 296);

  // 6. Metadata Table (Number, Date, Committee, Status)
  const metaY = 350;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(80, metaY, width - 160, 160, 8);
  ctx.fill();
  ctx.stroke();

  // Column divider
  ctx.strokeStyle = "#f4f4f5";
  ctx.beginPath();
  ctx.moveTo(width / 2, metaY);
  ctx.lineTo(width / 2, metaY + 160);
  ctx.stroke();

  // Horizontal divider
  ctx.beginPath();
  ctx.moveTo(80, metaY + 80);
  ctx.lineTo(width - 80, metaY + 80);
  ctx.stroke();

  ctx.textAlign = "right";

  // Row 1 - Right: Number
  ctx.fillStyle = "#71717a";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("المرجع / الرقم الرسمي بالمجلس:", width - 110, metaY + 32);
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 22px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText(proposal.number, width - 110, metaY + 62);

  // Row 1 - Left: Date & Year
  ctx.fillStyle = "#71717a";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("تاريخ الإيداع الرسمي:", width / 2 - 30, metaY + 32);
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 20px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText(`${proposal.depositDate} (${proposal.year})`, width / 2 - 30, metaY + 62);

  // Row 2 - Right: Committee
  ctx.fillStyle = "#71717a";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText(proposal.type === "مسائلة كتابية" ? "الجهة الحكومية الموجه إليها:" : "اللجنة القارة المتعهدة:", width - 110, metaY + 112);
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 18px 'Segoe UI', Tahoma, Arial, sans-serif";
  const truncatedCommittee =
    proposal.committee.length > 50
      ? proposal.committee.slice(0, 48) + "..."
      : proposal.committee;
  ctx.fillText(truncatedCommittee, width - 110, metaY + 142);

  // Row 2 - Left: Status
  ctx.fillStyle = "#71717a";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("المآل الإجرائي والوضعية الحالية:", width / 2 - 30, metaY + 112);
  ctx.fillStyle = "#047857";
  ctx.font = "bold 19px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText(proposal.status, width / 2 - 30, metaY + 142);

  // 7. Proposal Subject / Title Box
  const titleBoxY = 535;
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(80, titleBoxY, width - 160, 110, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#334155";
  ctx.font = "bold 18px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("موضوع المبادرة التشريعية:", width - 110, titleBoxY + 34);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px 'Segoe UI', Tahoma, Arial, sans-serif";
  wrapAndFillText(ctx, proposal.title, width - 110, titleBoxY + 70, width - 220, 32);

  // 8. Reasons and Legal Intent (شرح الأسباب ومقاصد المبادرة)
  const summaryBoxY = 670;
  const summaryBoxHeight = 590;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(80, summaryBoxY, width - 160, summaryBoxHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Header of summary
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.roundRect(80, summaryBoxY, width - 160, 50, 8);
  ctx.fill();

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 20px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("وثيقة شرح الأسباب ومقاصد المبادرة البرلمانية:", width - 110, summaryBoxY + 33);

  // Content text
  ctx.fillStyle = "#1e293b";
  ctx.font = "20px 'Segoe UI', Tahoma, Arial, sans-serif";
  const bodyIntro =
    proposal.type === "مسائلة كتابية"
      ? `بناءً على أحكام النظام الداخلي لمجلس نواب الشعب وطبقاً لصلاحيات النائب في الرقابة ومتابعة مشاغل المواطنين، تقدمت النائبة أسماء درويش بالمساءلة الكتابية التالية لمتابعة شواغل دائرة منوبة - الدندان:`
      : `عملاً بأحكام الدستور والنظام الداخلي لمجلس نواب الشعب، وضمن ممارسة الوظيفة التشريعية الرامية إلى الاستجابة لتطلعات المواطنين وتكريس العدالة الاجتماعية والتنمية المستدامة، يندرج مقترح القانون هذا في إطار المبادرات التشريعية المقدمة من النائب أسماء درويش:`;

  let currentY = summaryBoxY + 90;
  currentY = wrapAndFillText(ctx, bodyIntro, width - 110, currentY, width - 220, 34);

  currentY += 24;
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 21px 'Segoe UI', Tahoma, Arial, sans-serif";
  currentY = wrapAndFillText(ctx, proposal.summary, width - 110, currentY, width - 220, 36);

  if (proposal.signatories) {
    currentY += 30;
    ctx.fillStyle = "#475569";
    ctx.font = "italic 18px 'Segoe UI', Tahoma, Arial, sans-serif";
    currentY = wrapAndFillText(ctx, `الموقعون على المبادرة: ${proposal.signatories}`, width - 110, currentY, width - 220, 30);
  }

  if (proposal.arpUrl) {
    currentY += 20;
    ctx.fillStyle = "#2563eb";
    ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
    ctx.fillText(`الرابط بموقع مجلس نواب الشعب: ${proposal.arpUrl}`, width - 110, currentY);
  }

  // 9. Official Stamp & Parliamentary Signature Block
  const signY = 1300;
  ctx.fillStyle = "#fafafa";
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(80, signY, width - 160, 240, 8);
  ctx.fill();
  ctx.stroke();

  // Signature Left Side
  ctx.textAlign = "center";
  ctx.fillStyle = "#71717a";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("الختم الرسمي وتوقيع النائب:", 280, signY + 36);

  ctx.fillStyle = "#09090b";
  ctx.font = "bold 22px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("النائب أسماء درويش", 280, signY + 80);

  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("عضو مجلس نواب الشعب", 280, signY + 110);
  ctx.fillText("دائرة منوبة - الدندان", 280, signY + 134);

  // Circular Decorative Stamp
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(280, signY + 160, 42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 11px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("الجمهورية التونسية", 280, signY + 152);
  ctx.fillText("مجلس نواب الشعب", 280, signY + 168);

  // Notes Right Side
  ctx.textAlign = "right";
  ctx.fillStyle = "#71717a";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("تأشيرة ومصادقة المكتب البرلماني:", width - 110, signY + 36);

  ctx.fillStyle = "#1e293b";
  ctx.font = "16px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.fillText("• مستخرج رسمي طبق الأصل من جدول أعمال المبادرات التشريعية بمجلس نواب الشعب.", width - 110, signY + 75);
  ctx.fillText("• يمكن الاطلاع على النسخة الكاملة ومحاضر الجلسات عبر بوابة المجلس: arp.tn", width - 110, signY + 110);
  ctx.fillText("• تم إعداد هذه الوثيقة إلكترونياً وتوثيقها في المنظومة الرقمية للنائب.", width - 110, signY + 145);

  // 10. Footer
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "13px 'Segoe UI', Tahoma, Arial, sans-serif";
  ctx.textAlign = "center";
  const sanitizedDate = new Date().toLocaleDateString("ar-TN");
  ctx.fillText(
    `المنصة البرلمانية التفاعلية للنائب أسماء درويش © ${new Date().getFullYear()} — تاريخ استخراج الوثيقة: ${sanitizedDate}`,
    width / 2,
    height - 54
  );

  // 11. Compile to PDF Binary Data URL
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const base64Data = jpegDataUrl.split(",")[1];
  const binaryString = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    jpegBytes[i] = binaryString.charCodeAt(i);
  }

  const pdfBytes = buildSinglePageJpegPdf(jpegBytes, width, height);

  // Convert PDF bytes to base64
  let binary = "";
  const len = pdfBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
  }
  const pdfBase64 = btoa(binary);
  const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
  const safeNumber = proposal.number.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `مقترح_قانون_${safeNumber}_النائب_أسماء_درويش.pdf`;

  return { dataUrl, fileName };
}

/**
 * Text wrapper for canvas RTL Arabic rendering
 */
function wrapAndFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? " " : "") + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Compiles a raw JPEG stream into a 100% compliant PDF 1.4 A4 document
 */
function buildSinglePageJpegPdf(jpegBytes: Uint8Array, imgWidth: number, imgHeight: number): Uint8Array {
  const a4Width = 595.28;
  const a4Height = 841.89;
  const encoder = new TextEncoder();

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${a4Width.toFixed(2)} ${a4Height.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
  const obj4Head = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const obj4Tail = "\nendstream\nendobj\n";
  const contentStream = `q\n${a4Width.toFixed(2)} 0 0 ${a4Height.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
  const obj5 = `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`;

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
