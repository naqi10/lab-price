import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Quotation data structure expected by the PDF generator.
 */
interface QuotationData {
  quotationNumber: string;
  title: string;
  createdAt: Date;
  validUntil: Date;
  clientReference?: string | null;
  notes?: string | null;
  totalPrice: number;
  laboratory: {
    name: string; code: string;
    address?: string | null; city?: string | null;
    phone?: string | null; email?: string | null;
  };
  items: Array<{
    position: number; testName: string;
    testCode?: string | null; labTestName: string; price: number;
  }>;
  createdBy: { name: string; email: string; };
}

/**
 * Generate a PDF document for a quotation.
 * @param quotation - The quotation data to render
 * @returns A Buffer containing the PDF binary data
 */
export async function generateQuotationPdf(quotation: QuotationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4", margin: 50,
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

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("DEVIS", 50, 50);
      doc.fontSize(10).font("Helvetica")
        .text("N° " + quotation.quotationNumber, 50, 75)
        .text("Date: " + formatDate(quotation.createdAt), 50, 90)
        .text("Valide jusqu'au: " + formatDate(quotation.validUntil), 50, 105);

      if (quotation.clientReference) {
        doc.text("Réf. client: " + quotation.clientReference, 50, 120);
      }

      // Laboratory info
      const labInfoY = 150;
      doc.fontSize(12).font("Helvetica-Bold").text("Laboratoire", 50, labInfoY);
      doc.fontSize(10).font("Helvetica").text(quotation.laboratory.name, 50, labInfoY + 20);
      if (quotation.laboratory.address) doc.text(quotation.laboratory.address, 50, labInfoY + 35);
      if (quotation.laboratory.city) doc.text(quotation.laboratory.city, 50, labInfoY + 50);
      if (quotation.laboratory.phone) doc.text("Tél: " + quotation.laboratory.phone, 50, labInfoY + 65);

      // Title
      const titleY = labInfoY + 95;
      doc.fontSize(14).font("Helvetica-Bold").text(quotation.title, 50, titleY, { align: "center" });

      // Tests table
      const tableTop = titleY + 35;
      const cols = { num: 50, test: 80, code: 320, price: 420 };
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("N°", cols.num, tableTop);
      doc.text("Analyse", cols.test, tableTop);
      doc.text("Code", cols.code, tableTop);
      doc.text("Prix (MAD)", cols.price, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      doc.font("Helvetica").fontSize(9);
      let currentY = tableTop + 25;
      for (const item of quotation.items) {
        if (currentY > 720) { doc.addPage(); currentY = 50; }
        doc.text(String(item.position), cols.num, currentY);
        doc.text(item.testName, cols.test, currentY, { width: 230 });
        doc.text(item.testCode ?? "-", cols.code, currentY);
        doc.text(formatCurrency(item.price), cols.price, currentY, { width: 120, align: "right" });
        currentY += 20;
      }

      // Total
      currentY += 10;
      doc.moveTo(350, currentY).lineTo(545, currentY).stroke();
      currentY += 10;
      doc.fontSize(12).font("Helvetica-Bold").text("Total:", 350, currentY)
        .text(formatCurrency(quotation.totalPrice), cols.price, currentY, { width: 120, align: "right" });

      // Notes
      if (quotation.notes) {
        currentY += 40;
        doc.fontSize(10).font("Helvetica-Bold").text("Notes:", 50, currentY);
        doc.font("Helvetica").text(quotation.notes, 50, currentY + 15, { width: 495 });
      }

      // Footer
      doc.fontSize(8).font("Helvetica")
        .text("Généré par Lab Price Comparator - " + formatDate(new Date()), 50, 780, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
