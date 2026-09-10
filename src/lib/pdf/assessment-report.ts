import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type AssessmentReportData = {
  title: string;
  memberName: string;
  propertyAddress: string;
  score: number;
  result: string;
  submittedAt: string;
  answers: Array<{ question: string; answer: string; score: number }>;
  feedback: Array<{ note: string; createdAt: string }>;
  logoBytes: Uint8Array;
};

const navy = rgb(20 / 255, 34 / 255, 67 / 255);
const gold = rgb(249 / 255, 197 / 255, 91 / 255);
const ink = rgb(38 / 255, 48 / 255, 64 / 255);
const muted = rgb(100 / 255, 111 / 255, 128 / 255);
const resultColours = {
  green: rgb(21 / 255, 128 / 255, 61 / 255),
  orange: rgb(217 / 255, 119 / 255, 6 / 255),
  red: rgb(220 / 255, 38 / 255, 38 / 255),
};

function safeText(value: string) {
  return value.normalize("NFKD").replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7E]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

export async function createAssessmentReport(data: AssessmentReportData) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const logo = await document.embedPng(data.logoBytes);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 52;
  let page!: PDFPage;
  let y!: number;

  const addPage = () => {
    page = document.addPage(pageSize);
    page.drawRectangle({ x: 0, y: pageSize[1] - 112, width: pageSize[0], height: 112, color: navy });
    const scaled = logo.scale(0.105);
    page.drawImage(logo, { x: margin, y: pageSize[1] - 99, width: scaled.width, height: scaled.height });
    page.drawText("BLUE COAST REALTY", { x: 145, y: pageSize[1] - 64, size: 18, font: bold, color: gold });
    page.drawText("PROPERTY HUB REPORT", { x: 145, y: pageSize[1] - 84, size: 9, font: bold, color: rgb(1, 1, 1) });
    y = pageSize[1] - 145;
  };
  const ensure = (height: number) => { if (y - height < 55) addPage(); };
  const drawLines = (text: string, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const font = options.font ?? regular;
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const lines = wrap(text, font, size, pageSize[0] - margin * 2 - indent);
    ensure(lines.length * (size + 4));
    for (const line of lines) {
      page.drawText(line, { x: margin + indent, y, size, font, color: options.color ?? ink });
      y -= size + 4;
    }
    y -= options.gap ?? 3;
  };

  addPage();
  drawLines(data.title, { font: bold, size: 24, color: navy, gap: 12 });
  page.drawRectangle({ x: margin, y: y - 88, width: pageSize[0] - margin * 2, height: 88, color: rgb(244 / 255, 248 / 255, 251 / 255) });
  const resultKey = data.result.toLowerCase() as keyof typeof resultColours;
  const resultColour = resultColours[resultKey] ?? resultColours.orange;
  const scoreText = `${Math.round(data.score)}`;
  page.drawCircle({ x: margin + 55, y: y - 44, size: 31, color: rgb(1, 1, 1), borderColor: resultColour, borderWidth: 7 });
  page.drawText(scoreText, { x: margin + 55 - bold.widthOfTextAtSize(scoreText, 20) / 2, y: y - 49, size: 20, font: bold, color: navy });
  page.drawText("/100", { x: margin + 92, y: y - 49, size: 8, font: regular, color: muted });
  page.drawText(safeText(data.result.toUpperCase()), { x: margin + 150, y: y - 36, size: 11, font: bold, color: resultColour });
  page.drawText(`Submitted ${safeText(data.submittedAt)}`, { x: margin + 150, y: y - 56, size: 9, font: regular, color: muted });
  y -= 112;
  drawLines(`Member: ${data.memberName}`, { font: bold, size: 11 });
  drawLines(`Property: ${data.propertyAddress}`, { font: bold, size: 11, gap: 18 });
  drawLines("Assessment responses", { font: bold, size: 16, color: navy, gap: 10 });

  data.answers.forEach((answer, index) => {
    ensure(72);
    drawLines(`${index + 1}. ${answer.question}`, { font: bold, size: 10, gap: 2 });
    drawLines(`Response: ${answer.answer}`, { size: 9.5, color: muted, indent: 14, gap: 2 });
    drawLines(`Score: ${Math.round(answer.score)}/10`, { size: 9, color: navy, indent: 14, gap: 10 });
  });

  if (data.feedback.length) {
    ensure(55);
    drawLines("Feedback from Blue Coast Realty", { font: bold, size: 16, color: navy, gap: 10 });
    data.feedback.forEach((item) => {
      drawLines(item.note, { size: 10, gap: 2 });
      drawLines(item.createdAt, { size: 8.5, color: muted, gap: 10 });
    });
  }

  document.getPages().forEach((reportPage, index, pages) => {
    reportPage.drawLine({ start: { x: margin, y: 38 }, end: { x: pageSize[0] - margin, y: 38 }, thickness: 0.6, color: rgb(0.85, 0.87, 0.9) });
    reportPage.drawText("Blue Coast Realty - Confidential property assessment", { x: margin, y: 23, size: 7.5, font: regular, color: muted });
    reportPage.drawText(`Page ${index + 1} of ${pages.length}`, { x: pageSize[0] - margin - 46, y: 23, size: 7.5, font: regular, color: muted });
  });
  document.setTitle(data.title);
  document.setAuthor("Blue Coast Realty");
  return document.save();
}
