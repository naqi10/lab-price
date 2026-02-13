// ---------------------------------------------------------------------------
// Test Search, Mapping & Cart Types
// ---------------------------------------------------------------------------

export enum MatchType {
  MANUAL = "MANUAL",
  AUTO_EXACT = "AUTO_EXACT",
  AUTO_FUZZY = "AUTO_FUZZY",
}

export interface TestSearchParams {
  query?: string;
  laboratoryId?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface TestSearchResult {
  id: string;
  testName: string;
  price: number;
  laboratoryId: string;
  labName: string;
  matchType: MatchType;
  confidence: number;
}

export interface SelectedLabTest {
  laboratoryId: string;
  labName: string;
  testName: string;
  price: number;
}

export interface TestCartItem {
  testMappingId: string;
  canonicalName: string;
  selectedTests: SelectedLabTest[];
}

export interface TestMappingEntry {
  laboratoryId: string;
  originalName: string;
  price: number;
  matchType: MatchType;
  confidence: number;
}

export interface TestMappingFormData {
  canonicalName: string;
  description: string;
  category: string;
  entries: TestMappingEntry[];
}

export interface MatchIndicatorProps {
  type: MatchType;
  confidence: number;
}
