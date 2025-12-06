import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type FeedbackSectionTip = { type: "good" | "improve"; tip: string; explanation?: string };
export type Feedback = {
  overallScore: number;
  ATS: { score: number; tips: { type: "good" | "improve"; tip: string }[] };
  toneAndStyle: { score: number; tips: FeedbackSectionTip[] };
  content: { score: number; tips: FeedbackSectionTip[] };
  structure: { score: number; tips: FeedbackSectionTip[] };
  skills: { score: number; tips: FeedbackSectionTip[] };
};

export interface AnalysisPdfInput {
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  feedback: Feedback;
  imageUrl?: string; // object URL or data URL
  resumeUrl?: string; // for reference, not embedded
}

/**
 * Convert an image URL (object URL or remote) to a data URL suitable for jsPDF.addImage.
 * Scales it down to a max width in pixels to keep PDF size small.
 */
async function imageUrlToDataUrl(url: string, maxWidth = 600): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Failed to load image"));
      i.src = url;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return { dataUrl, w, h };
  } catch {
    return null;
  }
}

function fmtDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function safeFilePart(s?: string): string {
  return (s || "analysis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "analysis";
}

/**
 * Build and immediately download the analysis PDF (text-first, multi-page).
 * Returns the generated jsPDF instance in case the caller wants to do more.
 */
export async function buildAnalysisPdf(input: AnalysisPdfInput): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };
  const margin = 48; // 2/3 inch
  let y = margin;

  const title = "Resucheck — Resume Review";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dateStr = `Generated: ${new Date().toLocaleString()}`;
  doc.text(dateStr, page.w - margin, y, { align: "right" });
  y += 18;

  // Job context
  const metaLines: string[] = [];
  if (input.companyName) metaLines.push(`Company: ${input.companyName}`);
  if (input.jobTitle) metaLines.push(`Job Title: ${input.jobTitle}`);
  if (input.jobDescription) metaLines.push(`Job Description: ${input.jobDescription}`);

  doc.setFontSize(12);
  const metaText = doc.splitTextToSize(metaLines.join("\n"), page.w - margin * 2);
  doc.text(metaText, margin, y);
  y += metaText.length * 14 + 6;

  // Optional thumbnail of resume
  if (input.imageUrl) {
    const thumb = await imageUrlToDataUrl(input.imageUrl, 360);
    if (thumb) {
      const ratio = thumb.h / thumb.w;
      const imgW = Math.min(360, page.w - margin * 2);
      const imgH = Math.round(imgW * ratio);
      if (y + imgH > page.h - margin) {
        doc.addPage();
        y = margin;
      }
      doc.addImage(thumb.dataUrl, "JPEG", margin, y, imgW, imgH, undefined, "FAST");
      y += imgH + 12;
    }
  }

  // Summary scores
  const addSectionHeader = (text: string) => {
    if (y > page.h - margin - 22) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(text, margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
  };

  addSectionHeader(`Overall Score: ${Math.round(input.feedback.overallScore)}/100`);

  const scores = [
    ["ATS", input.feedback.ATS?.score ?? 0],
    ["Tone & Style", input.feedback.toneAndStyle?.score ?? 0],
    ["Content", input.feedback.content?.score ?? 0],
    ["Structure", input.feedback.structure?.score ?? 0],
    ["Skills", input.feedback.skills?.score ?? 0],
  ] as const;

  const scoreLine = scores.map(([k, v]) => `${k}: ${Math.round(Number(v))}/100`).join("    ");
  const scoreLines = doc.splitTextToSize(scoreLine, page.w - margin * 2);
  doc.text(scoreLines, margin, y);
  y += scoreLines.length * 14 + 8;

  // Detail sections with tips
  const tipBullet = (t: string) => `• ${t}`;

  const writeTips = (label: string, tips: any[]) => {
    addSectionHeader(label);
    if (!Array.isArray(tips) || tips.length === 0) {
      const line = doc.splitTextToSize("No suggestions provided.", page.w - margin * 2);
      if (y + line.length * 14 > page.h - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += line.length * 14 + 6;
      return;
    }
    tips.forEach((t: any) => {
      const pieces = [String(t?.tip ?? "")];
      if (t?.explanation) pieces.push(String(t.explanation));
      const text = pieces.filter(Boolean).join(" — ");
      const lines = doc.splitTextToSize(tipBullet(text), page.w - margin * 2);
      if (y + lines.length * 14 > page.h - margin) { doc.addPage(); y = margin; }
      doc.text(lines, margin, y);
      y += lines.length * 14 + 6;
    });
    y += 4;
  };

  writeTips("ATS Suggestions", input.feedback.ATS?.tips || []);
  writeTips("Tone & Style", input.feedback.toneAndStyle?.tips || []);
  writeTips("Content", input.feedback.content?.tips || []);
  writeTips("Structure", input.feedback.structure?.tips || []);
  writeTips("Skills", input.feedback.skills?.tips || []);

  // Footer
  if (y > page.h - margin - 32) { doc.addPage(); y = margin; }
  doc.setDrawColor(220);
  doc.line(margin, page.h - margin - 24, page.w - margin, page.h - margin - 24);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Generated by Resucheck", margin, page.h - margin - 8);
  doc.setTextColor(0);

  const namePart = safeFilePart(input.jobTitle || input.companyName || "analysis");
  const filename = `resume-review_${namePart}_${fmtDate()}.pdf`;
  doc.save(filename);
  return doc;
}

/**
 * Alternative: snapshot a DOM element into the PDF (WYSIWYG). Not used by default.
 */
export async function snapshotElementToPdf(el: HTMLElement, filename = `resume-review_${fmtDate()}.pdf`) {
  const canvas = await html2canvas(el, { scale: 2 });
  const imgData = canvas.toDataURL("image/jpeg", 0.9);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Fit image to width and paginate if needed
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  let y = 0;
  let remaining = imgH;

  while (remaining > 0) {
    const sliceH = Math.min(remaining, pageH);
    // Draw the entire image scaled; jsPDF will clip per page bounds
    doc.addImage(imgData, "JPEG", 0, y ? 0 : 0, imgW, imgH, undefined, "FAST");
    remaining -= pageH;
    if (remaining > 0) doc.addPage();
    y += pageH;
  }

  doc.save(filename);
  return doc;
}
