// ---------------------------------------------------------------------------
// Quotation & Email Types
// ---------------------------------------------------------------------------

export enum QuotationStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  RESENT = "RESENT",
}

export interface QuotationItem {
  testMappingId: string;
  canonicalName: string;
  laboratoryId: string;
  labName: string;
  testName: string;
  price: number;
}

export interface QuotationFormData {
  customerId?: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  notes?: string;
  items: QuotationItem[];
}

export interface QuotationPreviewItem extends QuotationItem {
  id: string;
}

export interface QuotationPreview {
  id: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  notes: string | null;
  status: QuotationStatus;
  items: QuotationPreviewItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailFormData {
  to: string;
  subject: string;
  message: string;
}
