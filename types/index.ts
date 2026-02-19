// ---------------------------------------------------------------------------
// Central Type Re-exports & Common Utility Types
// ---------------------------------------------------------------------------

// -- Laboratory ---------------------------------------------------------------
export type {
  Laboratory,
  LaboratoryFormData,
  LaboratoryWithPriceLists,
  PriceList,
  PriceListPreview,
  PriceListPreviewRow,
  PriceListUploadData,
} from "./laboratory";

// -- Test ---------------------------------------------------------------------
export { MatchType } from "./test";
export type {
  MatchIndicatorProps,
  SelectedLabTest,
  TestCartItem,
  TestMappingEntry,
  TestMappingFormData,
  TestSearchParams,
  TestSearchResult,
} from "./test";

// -- User ---------------------------------------------------------------------
export type {
  LoginCredentials,
  SessionUser,
  UserFormData,
  UserProfile,
  UserRole,
} from "./user";

// ---------------------------------------------------------------------------
// Common Utility Types
// ---------------------------------------------------------------------------

/** Standard wrapper for all API responses. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Paginated variant of ApiResponse. */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/** Generic option used in select / dropdown components. */
export interface SelectOption {
  label: string;
  value: string;
}
