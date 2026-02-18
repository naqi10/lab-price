import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ComparisonEmailResult } from "@/lib/services/comparison.service";

/**
 * Quotation data structure expected by the PDF generator.
 */
export interface QuotationData {
  quotationNumber: string;
  title: string;
  createdAt: Date;
  validUntil: Date;
  clientName?: string | null;
  clientEmail?: string | null;
  clientReference?: string | null;
  notes?: string | null;
  subtotal?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalPrice: number;
  laboratory: {
    name: string;
    code: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  items: Array<{
    position: number;
    testName: string;
    testCode?: string | null;
    labTestName: string;
    price: number;
  }>;
  createdBy: { name: string; email: string };
}

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const HEADER_LOGO_HEIGHT = 36;
const HEADER_LOGO_WIDTH = 200;

/**
 * Generate a PDF document for a quotation.
 * @param quotation - The quotation data to render
 * @returns A Buffer containing the PDF binary data
 */
export async function generateQuotationPdf(quotation: QuotationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        info: {
          Title: "Devis " + quotation.quotationNumber,
          Author: "Lab Price Comparator",
          Subject: quotation.title,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      let currentY = 50;

      // --- Header: logo block (styled text as logo) ---
      doc.rect(50, currentY, HEADER_LOGO_WIDTH, HEADER_LOGO_HEIGHT).fill("#1e3a5f");
      doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold");
      doc.text("Lab Price Comparator", 58, currentY + 10, { width: HEADER_LOGO_WIDTH - 16 });
      doc.fillColor("#000000");

      // --- Document title and number (right side of header) ---
      doc.fontSize(18).font("Helvetica-Bold").text("DEVIS", PAGE_WIDTH - MARGIN - 150, 55);
      doc.fontSize(10).font("Helvetica");
      doc.text("N° " + quotation.quotationNumber, PAGE_WIDTH - MARGIN - 150, 72);
      doc.text("Date : " + formatDate(quotation.createdAt), PAGE_WIDTH - MARGIN - 150, 85);
      doc.text("Valide jusqu'au : " + formatDate(quotation.validUntil), PAGE_WIDTH - MARGIN - 150, 98);

      currentY += HEADER_LOGO_HEIGHT + 24;

      // --- Two columns: Lab info (left) / Customer info (right) ---
      const colLeft = 50;
      const colRight = 320;
      const colWidth = 220;

      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e3a5f");
      doc.text("Laboratoire", colLeft, currentY);
      doc.text("Client", colRight, currentY);
      doc.font("Helvetica").fontSize(10).fillColor("#000000");
      currentY += 18;

      let labY = currentY;
      doc.text(quotation.laboratory.name, colLeft, labY, { width: colWidth });
      labY += 14;
      if (quotation.laboratory.address) {
        doc.text(quotation.laboratory.address, colLeft, labY, { width: colWidth });
        labY += 14;
      }
      if (quotation.laboratory.city) {
        doc.text(quotation.laboratory.city, colLeft, labY, { width: colWidth });
        labY += 14;
      }
      if (quotation.laboratory.phone) {
        doc.text("Tél : " + quotation.laboratory.phone, colLeft, labY, { width: colWidth });
        labY += 14;
      }
      if (quotation.laboratory.email) {
        doc.text(quotation.laboratory.email, colLeft, labY, { width: colWidth });
        labY += 14;
      }

      let clientY = currentY;
      if (quotation.clientName) {
        doc.text(quotation.clientName, colRight, clientY, { width: colWidth });
        clientY += 14;
      }
      if (quotation.clientEmail) {
        doc.text(quotation.clientEmail, colRight, clientY, { width: colWidth });
        clientY += 14;
      }
      if (!quotation.clientName && !quotation.clientEmail) {
        doc.text("—", colRight, clientY, { width: colWidth });
      }

      currentY = Math.max(labY, clientY) + 8;
      if (quotation.clientReference) {
        doc.text("Réf. client : " + quotation.clientReference, colLeft, currentY);
        currentY += 16;
      }

      // --- Title ---
      currentY += 6;
      doc.fontSize(14).font("Helvetica-Bold").text(quotation.title, 50, currentY, { align: "center", width: PAGE_WIDTH - 100 });
      currentY += 28;

      // --- Items table ---
      const tableTop = currentY;
      const cols = { num: 50, test: 80, code: 320, price: 420 };
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("N°", cols.num, tableTop);
      doc.text("Analyse", cols.test, tableTop);
      doc.text("Code", cols.code, tableTop);
      doc.text("Prix (MAD)", cols.price, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      doc.font("Helvetica").fontSize(9);
      currentY = tableTop + 25;
      for (const item of quotation.items) {
        if (currentY > 620) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(String(item.position), cols.num, currentY);
        doc.text(item.testName, cols.test, currentY, { width: 230 });
        doc.text(item.testCode ?? "—", cols.code, currentY);
        doc.text(formatCurrency(item.price), cols.price, currentY, { width: 120, align: "right" });
        currentY += 20;
      }

      // --- Tax & total breakdown ---
      currentY += 12;
      doc.moveTo(350, currentY).lineTo(545, currentY).stroke();
      currentY += 12;

      const subtotalVal = quotation.subtotal ?? quotation.items.reduce((s, i) => s + i.price, 0);
      const taxRateVal = quotation.taxRate ?? 0;
      const taxAmountVal = quotation.taxAmount ?? 0;

      doc.font("Helvetica").fontSize(10);
      doc.text("Sous-total :", 350, currentY);
      doc.text(formatCurrency(subtotalVal), cols.price, currentY, { width: 120, align: "right" });
      currentY += 18;

      if (taxRateVal > 0) {
        doc.text("TVA (" + taxRateVal + " %) :", 350, currentY);
        doc.text(formatCurrency(taxAmountVal), cols.price, currentY, { width: 120, align: "right" });
        currentY += 18;
      }

      doc.moveTo(350, currentY).lineTo(545, currentY).stroke();
      currentY += 12;
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Total TTC :", 350, currentY);
      doc.text(formatCurrency(quotation.totalPrice), cols.price, currentY, { width: 120, align: "right" });
      currentY += 24;

      // --- Notes ---
      if (quotation.notes) {
        doc.fontSize(10).font("Helvetica-Bold").text("Notes :", 50, currentY);
        doc.font("Helvetica").text(quotation.notes, 50, currentY + 15, { width: 495 });
        currentY += 40;
      }

      // --- Footer: Company contact + Terms + Generation date ---
      const footerY = 750;
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#1e3a5f");
      doc.text("Lab Price Comparator", 50, footerY, { align: "center", width: PAGE_WIDTH - 100 });
      doc.font("Helvetica").fontSize(8).fillColor("#000000");
      doc.text("Email : contact@labprice.com  •  www.labprice.com", 50, footerY + 12, { align: "center", width: PAGE_WIDTH - 100 });

      doc.fontSize(8).text("Conditions :", 50, footerY + 32, { align: "center", width: PAGE_WIDTH - 100 });
      doc.text("Ce devis est valable jusqu'au " + formatDate(quotation.validUntil) + ".", 50, footerY + 44, { align: "center", width: PAGE_WIDTH - 100 });
      doc.text("Les prix sont exprimés en Dirhams Marocains (MAD).", 50, footerY + 56, { align: "center", width: PAGE_WIDTH - 100 });
      doc.text("Conditions de paiement : à réception de facture.", 50, footerY + 68, { align: "center", width: PAGE_WIDTH - 100 });
      doc.text("Généré le " + formatDate(new Date()) + " par " + quotation.createdBy.name, 50, footerY + 86, { align: "center", width: PAGE_WIDTH - 100 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a single combined PDF for a comparison result.
 * Shows all laboratories in a table with price + turnaround time per test.
 */
export async function generateComparisonPdf(
  result: ComparisonEmailResult,
  clientName?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: MARGIN,
        info: {
          Title: "Comparaison de prix",
          Author: "Lab Price Comparator",
          Subject: result.testNames.join(", "),
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 841.89; // A4 landscape
      let currentY = 50;

      // --- Header ---
      doc.rect(50, currentY, HEADER_LOGO_WIDTH, HEADER_LOGO_HEIGHT).fill("#1e3a5f");
      doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold");
      doc.text("Lab Price Comparator", 58, currentY + 10, { width: HEADER_LOGO_WIDTH - 16 });
      doc.fillColor("#000000");

      doc.fontSize(16).font("Helvetica-Bold").text("COMPARAISON DE PRIX", pageWidth - MARGIN - 250, currentY + 6);
      doc.fontSize(10).font("Helvetica");
      doc.text("Date : " + formatDate(new Date()), pageWidth - MARGIN - 250, currentY + 24);
      if (clientName) {
        doc.text("Client : " + clientName, pageWidth - MARGIN - 250, currentY + 37);
      }

      currentY += HEADER_LOGO_HEIGHT + 20;

      // --- Test list ---
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e3a5f");
      doc.text("Tests comparés :", 50, currentY);
      doc.font("Helvetica").fontSize(10).fillColor("#000000");
      currentY += 16;
      doc.text(result.testNames.join("  •  "), 50, currentY, { width: pageWidth - 100 });
      currentY += 20;

      // --- Comparison table ---
      const testCount = result.testNames.length;
      // Columns: Lab name | (price + TAT) per test | Total
      const labColW = 120;
      const totalColW = 70;
      const availableW = pageWidth - 100 - labColW - totalColW;
      const perTestW = Math.min(availableW / testCount, 140);
      const priceSubW = perTestW * 0.55;
      const tatSubW = perTestW * 0.45;

      const tableLeft = 50;
      const rowHeight = 18;
      const headerHeight = 32;

      // Header row 1: Lab | Test names (spanning 2 sub-cols each) | Total
      doc.fontSize(8).font("Helvetica-Bold");
      const drawHeaderBg = (x: number, w: number) => {
        doc.save().rect(x, currentY, w, headerHeight).fill("#f1f5f9").restore();
        doc.fillColor("#0f172a");
      };

      drawHeaderBg(tableLeft, labColW);
      doc.text("Laboratoire", tableLeft + 4, currentY + 4, { width: labColW - 8 });

      let colX = tableLeft + labColW;
      for (const testName of result.testNames) {
        drawHeaderBg(colX, perTestW);
        doc.text(testName, colX + 2, currentY + 2, { width: perTestW - 4, align: "center" });
        // Sub-header labels
        doc.fontSize(7).font("Helvetica");
        doc.text("Prix", colX + 2, currentY + 16, { width: priceSubW - 4, align: "center" });
        doc.text("Délai", colX + priceSubW + 2, currentY + 16, { width: tatSubW - 4, align: "center" });
        doc.fontSize(8).font("Helvetica-Bold");
        colX += perTestW;
      }

      drawHeaderBg(colX, totalColW);
      doc.text("Total", colX + 4, currentY + 10, { width: totalColW - 8, align: "center" });
      doc.fillColor("#000000");

      // Header border
      doc.save().rect(tableLeft, currentY, labColW + perTestW * testCount + totalColW, headerHeight).stroke("#cbd5e1").restore();

      currentY += headerHeight;

      // Data rows
      doc.fontSize(8).font("Helvetica");
      for (let i = 0; i < result.laboratories.length; i++) {
        const lab = result.laboratories[i];
        if (currentY > 500) {
          doc.addPage();
          currentY = 50;
        }

        const bgColor = lab.isCheapest ? "#f0fdf4" : i % 2 === 0 ? "#ffffff" : "#f8fafc";
        const rowW = labColW + perTestW * testCount + totalColW;

        doc.save().rect(tableLeft, currentY, rowW, rowHeight).fill(bgColor).restore();
        doc.save().rect(tableLeft, currentY, rowW, rowHeight).stroke("#e2e8f0").restore();

        doc.fillColor(lab.isCheapest ? "#15803d" : "#1e293b");
        doc.font(lab.isCheapest ? "Helvetica-Bold" : "Helvetica");
        doc.text(lab.name, tableLeft + 4, currentY + 4, { width: labColW - 8 });

        colX = tableLeft + labColW;
        doc.font("Helvetica");
        for (const test of lab.tests) {
          doc.fillColor(lab.isCheapest ? "#15803d" : "#334155");
          doc.text(test.formattedPrice, colX + 2, currentY + 4, { width: priceSubW - 4, align: "right" });
          doc.fillColor("#64748b");
          doc.text(test.turnaroundTime ?? "—", colX + priceSubW + 2, currentY + 4, { width: tatSubW - 4, align: "center" });
          colX += perTestW;
        }

        // Total
        doc.fillColor(lab.isCheapest ? "#15803d" : "#1e293b");
        doc.font("Helvetica-Bold");
        doc.text(lab.formattedTotalPrice, colX + 4, currentY + 4, { width: totalColW - 8, align: "right" });

        currentY += rowHeight;
      }

      // --- Recommendation box ---
      currentY += 16;
      const boxWidth = 300;
      doc.save().roundedRect(tableLeft, currentY, boxWidth, 50, 4).fill("#f0fdf4").restore();
      doc.save().roundedRect(tableLeft, currentY, boxWidth, 50, 4).stroke("#bbf7d0").restore();

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#16a34a");
      doc.text("LABORATOIRE RECOMMANDÉ", tableLeft + 12, currentY + 8);
      doc.fontSize(14).fillColor("#15803d");
      doc.text(result.cheapestLaboratory.name, tableLeft + 12, currentY + 22);
      doc.fontSize(10).font("Helvetica").fillColor("#166534");
      doc.text("Prix total : " + result.cheapestLaboratory.formattedTotalPrice, tableLeft + 12 + 200, currentY + 26);

      // --- Footer ---
      const footerY = 530;
      doc.fontSize(8).fillColor("#94a3b8");
      doc.text(
        `Généré le ${formatDate(new Date())} — Lab Price Comparator`,
        50, footerY,
        { align: "center", width: pageWidth - 100 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
