// ---------------------------------------------------------------------------
// Laboratory & Price List Types
// ---------------------------------------------------------------------------

export interface LaboratoryFormData {
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export interface PriceListUploadData {
  laboratoryId: string;
  file: File;
  notes?: string;
}

export interface PriceListPreviewRow {
  [column: string]: string;
}

export interface PriceListPreview {
  headers: string[];
  rows: PriceListPreviewRow[];
  totalRows: number;
}

export interface PriceList {
  id: string;
  laboratoryId: string;
  fileName: string;
  notes: string | null;
  uploadedAt: Date;
  rowCount: number;
}

export interface Laboratory {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaboratoryWithPriceLists extends Laboratory {
  priceLists: PriceList[];
  testCount: number;
}
