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
 * Generate a portrait A4 PDF for the recommended laboratory only.
 * When multiLabSelection is present, renders the per-test lab assignments instead.
 * Clean B&W format with minimal styling for universal printing.
 */
export async function generateComparisonPdf(
   result: ComparisonEmailResult,
   clientName?: string,
   selectionMode?: string | null
): Promise<Buffer> {
  const isMultiLab = !!result.multiLabSelection;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        info: {
          Title: isMultiLab ? "Sélection optimisée" : "Comparaison de prix",
          Author: "Lab Price Comparator",
          Subject: result.testNames.join(", "),
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const contentWidth = PAGE_WIDTH - MARGIN * 2;
      let currentY = MARGIN;

      // --- Header: Clean title section ---
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#000000");
      const titleText = isMultiLab ? "SÉLECTION OPTIMISÉE" : "COMPARAISON DE PRIX";
      doc.text(titleText, MARGIN, currentY);
      currentY += 20;

      // Header line
      doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
      currentY += 10;

      // Date and client info
      doc.fontSize(10).font("Helvetica").fillColor("#000000");
      doc.text("Date : " + formatDate(new Date()), MARGIN, currentY);
      if (clientName) {
        doc.text("Client : " + clientName, MARGIN + 250, currentY);
      }
      currentY += 18;
      currentY += 6; // Extra space

       if (isMultiLab) {
         // ===== Multi-lab PDF =====
         const sel = result.multiLabSelection!;

         doc.fontSize(10).font("Helvetica-Bold").text("Laboratoires sélectionnés :", MARGIN, currentY);
         currentY += 14;
         doc.fontSize(10).font("Helvetica").text(sel.laboratories.map((l) => l.name).join(", "), MARGIN, currentY, { width: contentWidth });
         currentY += 18;

         // Show selection mode if present
         if (selectionMode) {
           doc.fontSize(9).font("Helvetica").fillColor("#666666");
           let modeText = "";
           if (selectionMode === "CHEAPEST") {
             modeText = "Sélection optimisée par prix";
           } else if (selectionMode === "FASTEST") {
             modeText = "Sélection optimisée par délai";
           } else if (selectionMode === "CUSTOM") {
             modeText = "Sélection personnalisée";
           }
           if (modeText) {
             doc.text(modeText, MARGIN, currentY);
             currentY += 12;
           }
         }

         doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000").text("Prix total : " + sel.formattedTotalPrice, MARGIN, currentY);
         currentY += 18;
         currentY += 8; // Extra space before table

          // Table header - 4 columns: N° | Analyse | Laboratoire | Prix (MAD)
          const cols = { 
            num: MARGIN, 
            test: MARGIN + 28, 
            lab: MARGIN + 130, 
            price: PAGE_WIDTH - MARGIN - 80 
          };
         const headerH = 16;

          doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000");
          doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
          doc.text("N°", cols.num + 2, currentY + 2, { width: 26 });
          doc.text("Analyse", cols.test + 2, currentY + 2, { width: 100 });
          doc.text("Laboratoire", cols.lab + 2, currentY + 2, { width: 85 });
          doc.text("Prix (MAD)", cols.price - 70, currentY + 2, { width: 70, align: "right" });
         currentY += headerH;
         doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
         currentY += 2;

         // Table rows
         doc.fontSize(9).font("Helvetica").fillColor("#000000");
         for (let i = 0; i < sel.assignments.length; i++) {
           const a = sel.assignments[i];
           const rowH = 14;
           if (currentY + rowH > 750) {
             doc.addPage();
             currentY = MARGIN;
           }

            doc.text(String(i + 1), cols.num + 2, currentY, { width: 26 });
            doc.text(a.canonicalName, cols.test + 2, currentY, { width: 100 });
            doc.text(a.laboratoryName, cols.lab + 2, currentY, { width: 85 });
            doc.text(a.formattedPrice, cols.price - 70, currentY, { width: 70, align: "right" });
           currentY += rowH;
         }

         // Total row
          doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
          currentY += 2;
          doc.fontSize(10).font("Helvetica-Bold");
          doc.text("Total", cols.test + 2, currentY, { width: 100 });
          doc.text(sel.formattedTotalPrice, cols.price - 70, currentY, { width: 70, align: "right" });
         currentY += 14;
         doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
         currentY += 12;

         doc.fontSize(8).font("Helvetica").fillColor("#333333");
         doc.text(
           "Ce document présente une sélection optimisée répartie entre plusieurs laboratoires.",
           MARGIN, currentY, { width: contentWidth }
         );
       } else {
        // ===== Single-lab PDF =====
        const lab = result.laboratories.find((l) => l.isCheapest) ?? result.laboratories[0];
        if (!lab) {
          doc.fontSize(12).text("Aucun laboratoire disponible.", MARGIN, currentY);
          doc.end();
          return;
        }

        doc.fontSize(10).font("Helvetica-Bold").text("Laboratoire recommandé :", MARGIN, currentY);
        currentY += 14;
        doc.fontSize(10).font("Helvetica").text(lab.name, MARGIN, currentY);
        currentY += 18;

        doc.fontSize(10).font("Helvetica-Bold").text("Prix total : " + lab.formattedTotalPrice, MARGIN, currentY);
        currentY += 18;
        currentY += 8; // Extra space before table

         // Table header — N°(28) | Analyse(200) | Prix(80) | Délai(remaining)
         const cols = {
           num: MARGIN,
           test: MARGIN + 28,
           price: MARGIN + 228,
           tat: MARGIN + 328,
         };
         const tatWidth = PAGE_WIDTH - MARGIN - cols.tat;
        const headerH = 16;

         doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000");
         doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
         doc.text("N°", cols.num + 2, currentY + 2, { width: 26 });
         doc.text("Analyse", cols.test + 2, currentY + 2, { width: 198 });
         doc.text("Prix (MAD)", cols.price + 2, currentY + 2, { width: 96, align: "right" });
         doc.text("Délai", cols.tat + 2, currentY + 2, { width: tatWidth - 4 });
        currentY += headerH;
        doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
        currentY += 2;

        // Table rows
        doc.fontSize(9).font("Helvetica").fillColor("#000000");
        for (let i = 0; i < lab.tests.length; i++) {
          const test = lab.tests[i];
          const tatText = test.turnaroundTime ?? "—";
          const rowH = Math.max(14, Math.ceil(doc.heightOfString(tatText, { width: tatWidth - 4 }) / 14) * 14);
          if (currentY + rowH > 750) {
            doc.addPage();
            currentY = MARGIN;
          }

           doc.text(String(i + 1), cols.num + 2, currentY, { width: 26 });
           doc.text(test.canonicalName, cols.test + 2, currentY, { width: 198 });
           doc.text(test.formattedPrice, cols.price + 2, currentY, { width: 96, align: "right" });
           doc.text(tatText, cols.tat + 2, currentY, { width: tatWidth - 4 });
          currentY += rowH;
        }

         // Total row
         doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
         currentY += 2;
         doc.fontSize(10).font("Helvetica-Bold");
         doc.text("Total", cols.test + 2, currentY, { width: 198 });
         doc.text(lab.formattedTotalPrice, cols.price + 2, currentY, { width: 96, align: "right" });
        currentY += 14;
        doc.moveTo(MARGIN, currentY).lineTo(PAGE_WIDTH - MARGIN, currentY).stroke("#000000");
        currentY += 12;

        doc.fontSize(8).font("Helvetica").fillColor("#333333");
        doc.text(
          "Ce document présente le meilleur tarif trouvé parmi les laboratoires référencés pour les tests sélectionnés.",
          MARGIN, currentY, { width: contentWidth }
        );
      }

      // --- Footer ---
      const footerY = 770;
      doc.fontSize(8).fillColor("#666666");
      doc.text(
        `Généré le ${formatDate(new Date())} — Lab Price Comparator`,
        MARGIN, footerY,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
