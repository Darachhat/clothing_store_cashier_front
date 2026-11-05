/**
 * AUTO-GENERATED API CONTRACT DEFINITIONS
 * Source: FastAPI OpenAPI Specification
 * Repository: Clothing Store Management System
 *
 * DO NOT EDIT DIRECTLY. Regenerate using:
 *   python scripts/generate_contracts.py
 * Or run from any frontend workspace:
 *   npm run generate:contracts
 */

/* eslint-disable */
// @ts-nocheck

// ============================================================================
// 1. SYSTEM ENUMS
// ============================================================================

export type RESPONSE_CODE_ENUM = 'SUCCESS' | 'CREATED' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION_ERROR' | 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE' | 'GATEWAY_TIMEOUT' | 'TELEGRAM_BOT_NOT_FOUND' | 'TELEGRAM_CHAT_NOT_FOUND' | 'SYSTEM_NOT_FOUND' | 'SYSTEM_ENDPOINT_NOT_FOUND' | 'INSUFFICIENT_STOCK' | 'SALE_ALREADY_COMPLETED' | 'PAYMENT_FAILED' | 'COUPON_INVALID';

// ============================================================================
// 2. COMPONENT SCHEMAS
// ============================================================================

export interface ADJUST_POINTS_REQUEST_SCHEMA {
  points: number;
  note?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
}

export interface API_KEY_CREATED_SCHEMA {
  code: string;
  /** Copy this API key immediately; it will not be shown again. */
  raw_api_key: string;
}

export interface AUDIT_LOG_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  user_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface AttachmentListResponse {
  items: Record<string, unknown>[];
  total: number;
}

export interface AttachmentResponse {
  id: string;
  filename: string;
  object_name: string;
  url: string;
  content_type: string;
  size: number;
  bucket: string;
  created_at: string;
}

export interface BRAND_CREATE_SCHEMA {
  name: string;
  slug?: string | null;
  description?: string | null;
  logo_url?: string | null;
  status_code?: string;
}

export interface BRAND_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
}

export interface BRAND_UPDATE_SCHEMA {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  logo_url?: string | null;
  status_code?: string | null;
}

export interface Body_upload_attachment_api_admin_v1_attachments_upload_post {
  /** File to upload */
  file: string;
  /** Folder/category (e.g. products, expenses, receipts, avatars) */
  folder?: string;
}

export interface Body_upload_attachment_api_admin_v1_uploads_images_post {
  /** File to upload */
  file: string;
  /** Folder/category (e.g. products, expenses, receipts, avatars) */
  folder?: string;
}

export interface Body_upload_attachment_api_v1_attachments_upload_post {
  /** File to upload */
  file: string;
  /** Folder/category (e.g. products, expenses, receipts, avatars) */
  folder?: string;
}

export interface Body_upload_attachment_api_v1_uploads_images_post {
  /** File to upload */
  file: string;
  /** Folder/category (e.g. products, expenses, receipts, avatars) */
  folder?: string;
}

export interface Body_upload_multiple_attachments_api_admin_v1_attachments_upload_multiple_post {
  /** Files to upload */
  files: string[];
  /** Folder/category */
  folder?: string;
}

export interface Body_upload_multiple_attachments_api_v1_attachments_upload_multiple_post {
  /** Files to upload */
  files: string[];
  /** Folder/category */
  folder?: string;
}

export interface BranchCreate {
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status?: string;
}

export interface BranchOut {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  warehouses?: WarehouseOut[];
}

export interface BranchUpdate {
  code?: string | null;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  status?: string | null;
}

export interface CATEGORY_CREATE_SCHEMA {
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  description?: string | null;
  sort_order?: number;
  status_code?: string;
}

export interface CATEGORY_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
  sort_order?: number;
}

export interface CATEGORY_UPDATE_SCHEMA {
  name?: string | null;
  slug?: string | null;
  parent_id?: string | null;
  description?: string | null;
  sort_order?: number | null;
  status_code?: string | null;
}

export interface CHANGE_PASSWORD_REQUEST_SCHEMA {
  current_password: string;
  new_password: string;
}

export interface COLOR_CREATE_SCHEMA {
  name: string;
  hex_code?: string | null;
  status_code?: string;
}

export interface COLOR_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  name: string;
  hex_code?: string | null;
}

export interface COLOR_UPDATE_SCHEMA {
  name?: string | null;
  hex_code?: string | null;
  status_code?: string | null;
}

export interface COUPON_VALIDATION_REQUEST_SCHEMA {
  code: string;
  cart_total: number | string;
}

export interface COUPON_VALIDATION_RESPONSE_SCHEMA {
  valid: boolean;
  discount_amount?: string;
  message: string;
  promotion?: PROMOTION_RESPONSE_SCHEMA | null;
}

export interface CUSTOMER_CREATE_SCHEMA {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  notes?: string | null;
  status?: string;
  status_code?: string;
}

export interface CUSTOMER_LIST_OUT_SCHEMA {
  items: CUSTOMER_RESPONSE_SCHEMA[];
  total: number;
  skip?: number | null;
  limit?: number | null;
  page?: number | null;
  size?: number | null;
}

export interface CUSTOMER_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  notes?: string | null;
  status?: string;
  status_code?: string;
  id: string;
  customer_code: string;
  loyalty_account?: LOYALTY_ACCOUNT_RESPONSE_SCHEMA | null;
}

export interface CUSTOMER_UPDATE_SCHEMA {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  notes?: string | null;
  status?: string | null;
  status_code?: string | null;
}

export interface CustomerRegisterRequest {
  username?: string | null;
  email: string;
  full_name: string;
  password: string;
  phone?: string | null;
}

export interface EXPENSE_CATEGORY_CREATE_SCHEMA {
  name: string;
  code: string;
  description?: string | null;
  status_code?: string;
}

export interface EXPENSE_CATEGORY_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  name: string;
  code: string;
  description?: string | null;
  is_system?: boolean;
}

export interface EXPENSE_CATEGORY_UPDATE_SCHEMA {
  name?: string | null;
  description?: string | null;
  status_code?: string | null;
}

export interface EXPENSE_CREATE_SCHEMA {
  category_id: string;
  branch_id?: string | null;
  amount: number | string;
  payment_method?: string;
  expense_date: string;
  description?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  status_code?: string;
}

export interface EXPENSE_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  expense_number: string;
  category_id: string;
  branch_id: string;
  amount: string;
  description?: string | null;
  payment_method: string;
  receipt_url?: string | null;
  expense_date: string;
  created_by?: unknown | null;
  approved_by?: unknown | null;
  notes?: string | null;
  category?: EXPENSE_CATEGORY_RESPONSE_SCHEMA | null;
}

export interface EXPENSE_UPDATE_SCHEMA {
  status?: string | null;
  status_code?: string | null;
  category_id?: string | null;
  branch_id?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
  expense_date?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
}

export interface GENERIC_SETTING_SCHEMA {
  category: string;
  key: string;
  value: Record<string, unknown>;
  description?: string | null;
}

export interface GOODS_RECEIPT_CREATE_FOR_ORDER_SCHEMA {
  purchase_order_id?: string | null;
  warehouse_id?: string | null;
  notes?: string | null;
  note?: string | null;
  items: GOODS_RECEIPT_ITEM_CREATE_SCHEMA[];
}

export interface GOODS_RECEIPT_CREATE_SCHEMA {
  purchase_order_id: string;
  warehouse_id?: string | null;
  notes?: string | null;
  note?: string | null;
  items: GOODS_RECEIPT_ITEM_CREATE_SCHEMA[];
}

export interface GOODS_RECEIPT_ITEM_CREATE_SCHEMA {
  purchase_item_id?: string | null;
  variant_id: string;
  quantity_received: number;
  unit_cost?: number | string | null;
  notes?: string | null;
}

export interface GOODS_RECEIPT_ITEM_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  goods_receipt_id: string;
  purchase_item_id: string;
  variant_id: string;
  quantity_received: number;
  unit_cost: string;
  notes?: string | null;
}

export interface GOODS_RECEIPT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  gr_number: string;
  purchase_order_id: string;
  warehouse_id: string;
  notes?: string | null;
  received_by: string;
  items?: GOODS_RECEIPT_ITEM_RESPONSE_SCHEMA[];
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface INVENTORY_MOVEMENT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  variant_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
  created_by?: unknown | null;
}

export interface INVENTORY_STOCK_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  variant_id: string;
  warehouse_id: string;
  quantity: number;
  reorder_level: number;
  sku?: string | null;
  variant?: unknown | null;
  warehouse?: unknown | null;
}

export interface LOGIN_REQUEST_SCHEMA {
  username: string;
  password: string;
}

export interface LOGIN_RESPONSE_SCHEMA {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user: USER_RESPONSE_SCHEMA;
}

export interface LOGOUT_REQUEST_SCHEMA {
  refresh_token: string;
}

export interface LOYALTY_ACCOUNT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  customer_id: string;
  points_balance?: number;
  total_points_earned?: number;
  total_points_redeemed?: number;
  tier?: string;
  transactions?: LOYALTY_TRANSACTION_RESPONSE_SCHEMA[];
}

export interface LOYALTY_TRANSACTION_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  account_id: string;
  transaction_type: string;
  points: number;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
}

export interface LabelGenerateRequest {
  variants: LabelVariantRequest[];
  paper_size?: string;
  label_width_mm?: number;
  label_height_mm?: number;
  columns?: number;
  code_type?: string;
  show_khr?: boolean;
  store_name_override?: string | null;
}

export interface LabelVariantRequest {
  variant_id: string;
  quantity: number;
}

export interface PAGINATION_METADATA_SCHEMA {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface PAYMENT_KHQR_CREATE_REQUEST_SCHEMA {
  sale_id: string;
}

export interface PAYMENT_PURCHASE_FORM_REQUEST_SCHEMA {
  sale_id: string;
  payment_option?: string;
}

export interface PAYMENT_PURCHASE_FORM_RESPONSE_SCHEMA {
  action_url: string;
  script_url: string;
  form_data: Record<string, string>;
  payment_id: string;
  tran_id: string;
  amount: number;
  currency: string;
}

export interface PAYMENT_TRANSACTION_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  tran_id: string;
  sale_id?: string | null;
  amount: number;
  currency?: string;
  qr_string?: string | null;
  qr_image?: string | null;
  checkout_url?: string | null;
  apv?: string | null;
  expires_at?: unknown | null;
  paid_at?: unknown | null;
}

export interface PERMISSION_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  code: string;
  name: string;
  module: string;
  status_code?: string;
}

export interface PHONE_VERIFICATION_CHALLENGE_RESPONSE_SCHEMA {
  message: string;
  normalized_phone: string;
  expires_in_seconds: number;
  delivery_channel?: string;
}

export interface PHONE_VERIFICATION_REQUEST_SCHEMA {
  phone_number: string;
}

export interface PHONE_VERIFY_CONFIRM_SCHEMA {
  phone_number: string;
  otp_code: string;
}

export interface PRODUCT_CREATE_SCHEMA {
  name: string;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  supplier_id?: string | null;
  status_code?: string;
  image_url?: string | null;
}

export interface PRODUCT_PAGINATION_RESPONSE_SCHEMA {
  items: PRODUCT_RESPONSE_SCHEMA[];
  pagination: PAGINATION_METADATA_SCHEMA;
}

/** Paginated product list that includes product variants (used by POS). */
export interface PRODUCT_PAGINATION_WITH_VARIANTS_RESPONSE_SCHEMA {
  items: PRODUCT_WITH_VARIANTS_SCHEMA[];
  pagination: PAGINATION_METADATA_SCHEMA;
}

export interface PRODUCT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  supplier_id?: string | null;
  image_url?: string | null;
  category?: CATEGORY_RESPONSE_SCHEMA | null;
  brand?: BRAND_RESPONSE_SCHEMA | null;
  total_stock?: number | null;
}

export interface PRODUCT_UPDATE_SCHEMA {
  name?: string | null;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  supplier_id?: string | null;
  status_code?: string | null;
  image_url?: string | null;
}

export interface PRODUCT_VARIANT_CREATE_FOR_PRODUCT_SCHEMA {
  product_id?: string | null;
  color_id?: string | null;
  size_id?: string | null;
  cost_price: number | string;
  selling_price: number | string;
  wholesale_price?: number | string | null;
  barcode?: string | null;
  weight_grams?: number | null;
  image_url?: string | null;
  status_code?: string;
}

export interface PRODUCT_VARIANT_CREATE_SCHEMA {
  product_id: string;
  color_id?: string | null;
  size_id?: string | null;
  cost_price: number | string;
  selling_price: number | string;
  wholesale_price?: number | string | null;
  barcode?: string | null;
  weight_grams?: number | null;
  image_url?: string | null;
  status_code?: string;
}

export interface PRODUCT_VARIANT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  product_id: string;
  sku: string;
  barcode?: string | null;
  qr_reference: string;
  color_id?: string | null;
  size_id?: string | null;
  color?: COLOR_RESPONSE_SCHEMA | null;
  size?: SIZE_RESPONSE_SCHEMA | null;
  cost_price: string;
  selling_price: string;
  wholesale_price?: string | null;
  weight_grams?: number | null;
  image_url?: string | null;
  product?: PRODUCT_RESPONSE_SCHEMA | null;
}

export interface PRODUCT_VARIANT_UPDATE_SCHEMA {
  cost_price?: number | string | null;
  selling_price?: number | string | null;
  wholesale_price?: number | string | null;
  barcode?: string | null;
  weight_grams?: number | null;
  image_url?: string | null;
  status_code?: string | null;
}

export interface PRODUCT_WITH_VARIANTS_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  supplier_id?: string | null;
  image_url?: string | null;
  category?: CATEGORY_RESPONSE_SCHEMA | null;
  brand?: BRAND_RESPONSE_SCHEMA | null;
  total_stock?: number | null;
  variants?: PRODUCT_VARIANT_RESPONSE_SCHEMA[];
}

export interface PROMOTION_CREATE_SCHEMA {
  name: string;
  type: string;
  value: number | string;
  code?: string | null;
  min_purchase_amount?: number | string;
  max_discount_amount?: number | string | null;
  usage_limit?: number | null;
  applies_to?: string;
  category_id?: string | null;
  start_datetime: string;
  end_datetime: string;
  status?: string;
  status_code?: string;
}

export interface PROMOTION_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  name: string;
  type: string;
  value: string;
  code?: string | null;
  min_purchase_amount?: string;
  max_discount_amount?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  applies_to?: string;
  category_id?: string | null;
  start_datetime: string;
  end_datetime: string;
}

export interface PROMOTION_UPDATE_SCHEMA {
  status?: string | null;
  status_code?: string | null;
  name?: string | null;
  type?: string | null;
  value?: number | string | null;
  code?: string | null;
  min_purchase_amount?: number | string | null;
  max_discount_amount?: number | string | null;
  usage_limit?: number | null;
  applies_to?: string | null;
  category_id?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
}

export interface PURCHASE_ITEM_CREATE_SCHEMA {
  variant_id: string;
  quantity_ordered: number;
  unit_cost: number | string;
}

export interface PURCHASE_ITEM_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  purchase_order_id: string;
  variant_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: string;
  subtotal: string;
}

export interface PURCHASE_ORDER_CREATE_SCHEMA {
  supplier_id: string;
  branch_id?: string | null;
  warehouse_id?: string | null;
  expected_date?: string | null;
  notes?: string | null;
  tax_amount?: number | string;
  items?: PURCHASE_ITEM_CREATE_SCHEMA[];
}

export interface PURCHASE_ORDER_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  po_number: string;
  supplier_id: string;
  branch_id: string;
  warehouse_id: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  expected_date?: string | null;
  notes?: string | null;
  created_by?: unknown | null;
  approved_by?: unknown | null;
  items?: PURCHASE_ITEM_RESPONSE_SCHEMA[];
  goods_receipts?: GOODS_RECEIPT_RESPONSE_SCHEMA[];
}

export interface PURCHASE_ORDER_UPDATE_SCHEMA {
  status?: string | null;
  status_code?: string | null;
  supplier_id?: string | null;
  branch_id?: string | null;
  warehouse_id?: string | null;
  expected_date?: string | null;
  notes?: string | null;
  tax_amount?: number | string | null;
}

export interface REFRESH_REQUEST_SCHEMA {
  refresh_token: string;
}

export interface RESPONSE_CODE_ITEM_SCHEMA {
  code: string;
  http_status: number;
  message: string;
}

export interface RESPONSE_ENVELOPE_API_KEY_CREATED_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: API_KEY_CREATED_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_Dict_str__Any__ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: Record<string, unknown> | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_List_RESPONSE_CODE_ITEM_SCHEMA__ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: RESPONSE_CODE_ITEM_SCHEMA[] | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_List_SYSTEM_CLIENT_RESPONSE_SCHEMA__ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_CLIENT_RESPONSE_SCHEMA[] | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_List_SYSTEM_CREDENTIAL_RESPONSE_SCHEMA__ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_CREDENTIAL_RESPONSE_SCHEMA[] | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_List_SYSTEM_ENDPOINT_RESPONSE_SCHEMA__ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_ENDPOINT_RESPONSE_SCHEMA[] | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_List_TELEGRAM_OUTBOUND_RESPONSE_SCHEMA__ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: TELEGRAM_OUTBOUND_RESPONSE_SCHEMA[] | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_SYSTEM_CLIENT_RESPONSE_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_CLIENT_RESPONSE_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_SYSTEM_CREDENTIAL_RESPONSE_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_CREDENTIAL_RESPONSE_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_SYSTEM_ENDPOINT_RESPONSE_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_ENDPOINT_RESPONSE_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_SYSTEM_LIST_OUT_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_LIST_OUT_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_SYSTEM_LOG_LIST_OUT_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_LOG_LIST_OUT_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_SYSTEM_RESPONSE_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: SYSTEM_RESPONSE_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_TELEGRAM_BOT_LIST_OUT_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: TELEGRAM_BOT_LIST_OUT_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_TELEGRAM_BOT_RESPONSE_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: TELEGRAM_BOT_RESPONSE_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_TELEGRAM_CHAT_LIST_OUT_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: TELEGRAM_CHAT_LIST_OUT_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_TELEGRAM_CHAT_RESPONSE_SCHEMA_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: TELEGRAM_CHAT_RESPONSE_SCHEMA | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RESPONSE_ENVELOPE_dict_ {
  /** Application response status code */
  code?: RESPONSE_CODE_ENUM;
  /** Human readable message */
  message?: string;
  /** Response payload */
  data?: Record<string, unknown> | null;
  /** List of error messages if operation failed */
  errors?: string[] | null;
  /** Unique trace request ID */
  request_id?: string | null;
}

export interface RETURN_CREATE_FOR_SALE_SCHEMA {
  original_sale_id?: string | null;
  return_type?: string;
  reason?: string | null;
  items: RETURN_ITEM_CREATE_SCHEMA[];
  refund_payments?: RETURN_PAYMENT_CREATE_SCHEMA[];
}

export interface RETURN_CREATE_SCHEMA {
  original_sale_id: string;
  return_type?: string;
  reason?: string | null;
  items: RETURN_ITEM_CREATE_SCHEMA[];
  refund_payments?: RETURN_PAYMENT_CREATE_SCHEMA[];
}

export interface RETURN_ITEM_CREATE_SCHEMA {
  sale_item_id: string;
  quantity: number;
}

export interface RETURN_PAYMENT_CREATE_SCHEMA {
  payment_method: string;
  amount: number | string;
}

export interface RETURN_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  return_number: string;
  original_sale_id: string;
  customer_id?: string | null;
  branch_id: string;
  return_type: string;
  reason?: string | null;
  total_refund: string;
  processed_by: string;
}

export interface ROLE_CREATE_SCHEMA {
  name: string;
  description?: string | null;
  permission_ids?: string[];
  status_code?: string;
}

export interface ROLE_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  name: string;
  description?: string | null;
  status_code?: string;
  permissions?: PERMISSION_RESPONSE_SCHEMA[];
}

export interface ROLE_UPDATE_SCHEMA {
  name?: string | null;
  description?: string | null;
  permission_ids?: string[] | null;
  status_code?: string | null;
}

export interface SALE_COMPLETE_SCHEMA {
  payments: SALE_PAYMENT_CREATE_SCHEMA[];
}

export interface SALE_CREATE_SCHEMA {
  branch_id?: string | null;
  warehouse_id?: string | null;
  terminal_id?: string | null;
  shift_id?: string | null;
  customer_id?: string | null;
  items: SALE_ITEM_CREATE_SCHEMA[];
  discount_amount?: number | string;
  tax_amount?: number | string;
  notes?: string | null;
  promotion_id?: string | null;
  payments?: SALE_PAYMENT_CREATE_SCHEMA[] | null;
}

export interface SALE_ITEM_CREATE_SCHEMA {
  variant_id: string;
  quantity: number;
  unit_price?: number | string | null;
  discount_amount?: number | string;
}

export interface SALE_ITEM_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  sale_id: string;
  variant_id: string;
  sku?: string | null;
  product_name?: string | null;
  color_name?: string | null;
  size_name?: string | null;
  quantity: number;
  unit_price: string;
  cost_price: string;
  discount_amount: string;
  subtotal: string;
}

export interface SALE_PAYMENT_CREATE_SCHEMA {
  payment_method: string;
  amount: number | string;
  reference_number?: string | null;
  notes?: string | null;
}

export interface SALE_PAYMENT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  sale_id: string;
  payment_method: string;
  amount: string;
  reference_number?: string | null;
  notes?: string | null;
}

export interface SALE_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  branch_id: string;
  branch_name?: string | null;
  warehouse_id: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total: string;
  payment_status: string;
  sale_status: string;
  notes?: string | null;
  cashier_id: string;
  cashier_name?: string | null;
  terminal_id?: string | null;
  terminal_code?: string | null;
  shift_id?: string | null;
  promotion_id?: string | null;
  items?: SALE_ITEM_RESPONSE_SCHEMA[];
  payments?: SALE_PAYMENT_RESPONSE_SCHEMA[];
}

export interface SHIFT_CLOSE_SCHEMA {
  /** Actual counted drawer cash in USD */
  closing_cash_usd: number | string;
  /** Actual counted drawer cash in KHR */
  closing_cash_khr: number | string;
  notes?: string | null;
}

export interface SHIFT_OPEN_SCHEMA {
  terminal_id: string;
  /** Opening drawer float in USD */
  opening_float_usd?: number | string;
  /** Opening drawer float in KHR */
  opening_float_khr?: number | string;
  notes?: string | null;
}

export interface SHIFT_RESPONSE_SCHEMA {
  id: string;
  terminal_id: string;
  terminal_code?: string | null;
  branch_id: string;
  branch_name?: string | null;
  cashier_id: string;
  cashier_name?: string | null;
  opened_at: string;
  closed_at?: string | null;
  opening_float_usd?: string;
  opening_float_khr?: string;
  closing_cash_usd?: string | null;
  closing_cash_khr?: string | null;
  expected_cash_usd?: string | null;
  expected_cash_khr?: string | null;
  status_code?: string;
  notes?: string | null;
  created_at: string;
}

export interface SHIFT_SUMMARY_SCHEMA {
  shift_id: string;
  terminal_id: string;
  terminal_code?: string | null;
  branch_id: string;
  branch_name?: string | null;
  cashier_id: string;
  cashier_name?: string | null;
  opened_at: string;
  closed_at?: string | null;
  status_code?: string;
  opening_float_usd?: string;
  opening_float_khr?: string;
  total_sales_count?: number;
  total_sales_amount?: string;
  cash_sales_amount?: string;
  cash_payments_count?: number;
  aba_sales_amount?: string;
  aba_payments_count?: number;
  card_sales_amount?: string;
  card_payments_count?: number;
  bank_sales_amount?: string;
  expected_cash_usd?: string;
  expected_cash_khr?: string;
  closing_cash_usd?: string | null;
  closing_cash_khr?: string | null;
  discrepancy_usd?: string | null;
  discrepancy_khr?: string | null;
  notes?: string | null;
}

export interface SIZE_CREATE_SCHEMA {
  name: string;
  type?: string;
  sort_order?: number;
  status_code?: string;
}

export interface SIZE_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  name: string;
  type: string;
  sort_order: number;
}

export interface SIZE_UPDATE_SCHEMA {
  name?: string | null;
  type?: string | null;
  sort_order?: number | null;
  status_code?: string | null;
}

export interface STATS_SUMMARY_SCHEMA {
  total?: number;
  active?: number;
  inactive?: number;
}

export interface STOCK_ADJUSTMENT_CREATE_SCHEMA {
  variant_id: string;
  warehouse_id: string;
  quantity_delta?: number | null;
  new_quantity?: number | null;
  movement_type?: string;
  note?: string | null;
}

export interface STOCK_TRANSFER_CREATE_SCHEMA {
  from_warehouse_id: string;
  to_warehouse_id: string;
  items: STOCK_TRANSFER_ITEM_CREATE_SCHEMA[];
  notes?: string | null;
}

export interface STOCK_TRANSFER_ITEM_CREATE_SCHEMA {
  variant_id: string;
  quantity: number;
}

export interface STOCK_TRANSFER_ITEM_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  transfer_id: string;
  variant_id: string;
  quantity_requested: number;
  quantity_sent: number;
  quantity_received: number;
  notes?: string | null;
}

export interface STOCK_TRANSFER_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  transfer_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  notes?: string | null;
  created_by?: unknown | null;
  approved_by?: unknown | null;
  items?: STOCK_TRANSFER_ITEM_RESPONSE_SCHEMA[];
}

export interface STORE_SETTINGS_SCHEMA {
  name?: string;
  currency?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  receipt_footer?: string | null;
  default_tax_rate?: number;
  tax_inclusive?: boolean;
  rounding?: string;
}

export interface SUPPLIER_CREATE_SCHEMA {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact_person?: string | null;
  notes?: string | null;
  status_code?: string;
}

export interface SUPPLIER_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact_person?: string | null;
}

export interface SUPPLIER_UPDATE_SCHEMA {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact_person?: string | null;
  notes?: string | null;
  status_code?: string | null;
}

export interface SYSTEM_CLIENT_CREATE_SCHEMA {
  code: string;
  name: string;
  description?: string | null;
}

export interface SYSTEM_CLIENT_RESPONSE_SCHEMA {
  id: string;
  code: string;
  name: string;
  status_code: string;
  description?: string | null;
}

export interface SYSTEM_CREATE_SCHEMA {
  code: string;
  name: string;
  description?: string | null;
  base_url?: string | null;
  scope?: string;
  is_encrypted_body?: boolean;
  status_code?: string;
}

export interface SYSTEM_CREDENTIAL_CREATE_SCHEMA {
  traffic_type: string;
  auth_type_code: string;
  status_code?: string;
  system_code?: string | null;
  username?: string | null;
  password?: string | null;
  secret?: string | null;
  token?: string | null;
  api_key?: string | null;
  description?: string | null;
  details?: Record<string, unknown> | null;
}

export interface SYSTEM_CREDENTIAL_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  system_code: string;
  traffic_type: string;
  auth_type?: string | null;
  auth_type_code?: string | null;
  status_code: string;
  details?: Record<string, unknown> | null;
  generated_secret?: string | null;
  header_value?: string | null;
  authorization_header_value?: string | null;
}

export interface SYSTEM_ENDPOINT_CREATE_SCHEMA {
  system_code: string;
  code: string;
  name: string;
  endpoint: string;
  http_method: string;
  traffic_type?: string | null;
  operation_type?: string | null;
  request_timeout?: number | null;
  auth_type?: string | null;
  headers_config?: unknown | null;
  query_config?: unknown | null;
  description?: string | null;
  is_encrypted_body?: boolean;
  status_code?: string;
}

export interface SYSTEM_ENDPOINT_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  system_code: string;
  code: string;
  name: string;
  endpoint?: string | null;
  endpoint_url?: string | null;
  http_method: string;
  auth_type?: string | null;
  description?: string | null;
  is_encrypted_body?: boolean;
  traffic_type?: string | null;
  operation_type?: string | null;
  request_timeout?: number | null;
  headers_config?: unknown | null;
  query_config?: unknown | null;
  status_code: string;
}

export interface SYSTEM_ENDPOINT_UPDATE_SCHEMA {
  name?: string | null;
  endpoint?: string | null;
  endpoint_url?: string | null;
  http_method?: string | null;
  traffic_type?: string | null;
  operation_type?: string | null;
  request_timeout?: number | null;
  auth_type?: string | null;
  headers_config?: unknown | null;
  query_config?: unknown | null;
  description?: string | null;
  is_encrypted_body?: boolean | null;
  status_code?: string | null;
}

export interface SYSTEM_LIST_OUT_SCHEMA {
  items: SYSTEM_RESPONSE_SCHEMA[];
  total: number;
  page: number;
  size: number;
  stats: STATS_SUMMARY_SCHEMA;
}

export interface SYSTEM_LOG_LIST_OUT_SCHEMA {
  items: SYSTEM_LOG_RESPONSE_SCHEMA[];
  total: number;
  page: number;
  size: number;
}

export interface SYSTEM_LOG_RESPONSE_SCHEMA {
  id: string;
  client_log_id?: string | null;
  traffic_type?: string | null;
  system_code?: string | null;
  channel?: string | null;
  request_method: string;
  request_endpoint: string;
  request_netloc?: string | null;
  request_content_type?: string | null;
  request_user_agent?: string | null;
  request_headers?: unknown | null;
  request_body?: unknown | null;
  requested_datetime?: string | null;
  client_ip?: string | null;
  response_code?: number | null;
  response_headers?: unknown | null;
  response_body?: unknown | null;
  response_duration?: string | null;
  response_datetime?: string | null;
  status_code: string;
  created_datetime?: string | null;
}

export interface SYSTEM_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  code: string;
  name: string;
  description?: string | null;
  base_url?: string | null;
  scope: string;
  is_encrypted_body: boolean;
  status_code: string;
}

export interface SYSTEM_UPDATE_SCHEMA {
  name?: string | null;
  description?: string | null;
  base_url?: string | null;
  scope?: string | null;
  is_encrypted_body?: boolean | null;
  status_code?: string | null;
}

export interface ScanPayload {
  barcode: string;
  format?: string | null;
  device_info?: string | null;
}

export interface SessionStatus {
  session_id: string;
  phone_connected: boolean;
  pc_connected: boolean;
  scan_count: number;
  last_barcode?: string | null;
}

export interface StoreCouponValidateRequest {
  code: string;
  cart_total: number | string;
}

export interface StoreOrderCompleteRequest {
  payment_method?: string;
  reference_number?: string | null;
}

export interface StoreOrderCreate {
  items: StoreOrderItemCreate[];
  payment_method?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  coupon_code?: string | null;
  create_draft?: boolean;
}

export interface StoreOrderItemCreate {
  variant_id: string;
  quantity: number;
}

export interface TELEGRAM_AUTH_PAYLOAD_SCHEMA {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  auth_date: number;
  hash: string;
}

export interface TELEGRAM_BOT_CREATE_SCHEMA {
  code: string;
  name: string;
  user_id?: string | null;
  username?: string | null;
  token?: string | null;
  description?: string | null;
  status_code?: string;
}

export interface TELEGRAM_BOT_LIST_OUT_SCHEMA {
  items: TELEGRAM_BOT_RESPONSE_SCHEMA[];
  total: number;
  page: number;
  size: number;
  stats: STATS_SUMMARY_SCHEMA;
}

export interface TELEGRAM_BOT_RESPONSE_SCHEMA {
  id: string;
  code: string;
  name: string;
  user_id?: string | null;
  username?: string | null;
  token?: string | null;
  description?: string | null;
  status_code: string;
  created_datetime?: string | null;
  updated_datetime?: string | null;
}

export interface TELEGRAM_BOT_UPDATE_SCHEMA {
  code?: string | null;
  name?: string | null;
  user_id?: string | null;
  username?: string | null;
  token?: string | null;
  description?: string | null;
  status_code?: string | null;
}

export interface TELEGRAM_CHAT_CREATE_SCHEMA {
  code: string;
  telegram_bot_code: string;
  name: string;
  /** channel | group | topic */
  chat_type?: string | null;
  link?: string | null;
  chat_id?: string | null;
  thread_id?: string | null;
  description?: string | null;
  status_code?: string;
}

export interface TELEGRAM_CHAT_LIST_OUT_SCHEMA {
  items: TELEGRAM_CHAT_RESPONSE_SCHEMA[];
  total: number;
  page: number;
  size: number;
  stats: STATS_SUMMARY_SCHEMA;
}

export interface TELEGRAM_CHAT_RESPONSE_SCHEMA {
  id: string;
  code: string;
  telegram_bot_code: string;
  name: string;
  chat_type?: string | null;
  link?: string | null;
  chat_id?: string | null;
  thread_id?: string | null;
  description?: string | null;
  status_code: string;
  created_datetime?: string | null;
  updated_datetime?: string | null;
}

export interface TELEGRAM_CHAT_UPDATE_SCHEMA {
  code?: string | null;
  telegram_bot_code?: string | null;
  name?: string | null;
  chat_type?: string | null;
  link?: string | null;
  chat_id?: string | null;
  thread_id?: string | null;
  description?: string | null;
  status_code?: string | null;
}

export interface TELEGRAM_CONFIG_RESPONSE_SCHEMA {
  enabled?: boolean;
  bot_username?: string | null;
}

export interface TELEGRAM_OUTBOUND_RESPONSE_SCHEMA {
  id: string;
  telegram_chat_code?: string | null;
  chat_type?: string | null;
  telegram_bot_code?: string | null;
  chat_id?: string | null;
  thread_id?: string | null;
  request_object?: unknown | null;
  response_object?: unknown | null;
  is_success: boolean;
  telegram_message_id?: string | null;
  error_code?: number | null;
  error_detail?: string | null;
  status_code: string;
  created_datetime?: string | null;
}

export interface TELEGRAM_SEND_MESSAGE_SCHEMA {
  /** Target telegram_chat code */
  chat_code: string;
  /** Message text to send */
  text: string;
  /** HTML or Markdown */
  parse_mode?: string;
}

export interface TELEGRAM_STATUS_RESPONSE_SCHEMA {
  enabled?: boolean;
  bot_username?: string | null;
  is_linked?: boolean;
  telegram_is_verified?: boolean;
  telegram_id?: string | null;
  telegram_user_id?: string | null;
  telegram_username?: string | null;
  telegram_photo_url?: string | null;
  telegram_linked_at?: string | null;
}

export interface TERMINAL_CREATE_SCHEMA {
  branch_id: string;
  warehouse_id: string;
  /** Register code, e.g. POS-01 */
  code: string;
  /** Register name, e.g. Front Counter Main */
  name: string;
  notes?: string | null;
}

export interface TERMINAL_RESPONSE_SCHEMA {
  id: string;
  branch_id: string;
  warehouse_id: string;
  code: string;
  name: string;
  status_code: string;
  notes?: string | null;
  last_active_at?: string | null;
  created_at: string;
  branch_name?: string | null;
  warehouse_name?: string | null;
}

export interface TERMINAL_UPDATE_SCHEMA {
  name?: string | null;
  warehouse_id?: string | null;
  status_code?: string | null;
  notes?: string | null;
}

export interface TOKEN_RESPONSE_SCHEMA {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface USER_CREATE_SCHEMA {
  username: string;
  email: string;
  full_name: string;
  password: string;
  employee_code?: string | null;
  branch_id?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean;
  role_ids?: string[];
  status_code?: string;
}

export interface USER_RESPONSE_SCHEMA {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  username: string;
  email: string;
  full_name: string;
  employee_code?: string | null;
  branch_id?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  telegram_id?: string | null;
  telegram_user_id?: string | null;
  telegram_username?: string | null;
  telegram_photo_url?: string | null;
  telegram_linked_at?: string | null;
  telegram_is_verified?: boolean;
  last_login_at?: string | null;
  roles?: ROLE_RESPONSE_SCHEMA[];
}

export interface USER_UPDATE_SCHEMA {
  status?: string | null;
  status_code?: string | null;
  full_name?: string | null;
  email?: string | null;
  employee_code?: string | null;
  branch_id?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean | null;
  unlink_phone?: boolean | null;
  unlink_telegram?: boolean | null;
  password?: string | null;
  role_ids?: string[] | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface WarehouseCreate {
  branch_id: string;
  name: string;
  address?: string | null;
  is_default?: boolean;
  status?: string;
}

export interface WarehouseOut {
  created_datetime?: string | null;
  updated_datetime?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  id: string;
  status_code?: string;
  status?: string;
  branch_id: string;
  name: string;
  address?: string | null;
  is_default?: boolean;
}

export interface WarehouseUpdate {
  branch_id?: string | null;
  name?: string | null;
  address?: string | null;
  is_default?: boolean | null;
  status?: string | null;
}

// ============================================================================
// 3. CANONICAL DOMAIN ENTITY CONTRACTS (SHARED ACROSS ALL 4 FRONTENDS)
// ============================================================================

/** Standard JSON Response Envelope */
export interface ApiResponse<T = unknown> {
  code: RESPONSE_CODE_ENUM | string;
  message: string;
  data?: T | null;
  errors?: string[] | null;
  request_id?: string | null;
}

/** Standard Pagination Metadata */
export type Pagination = PAGINATION_METADATA_SCHEMA;

/** Canonical Error Response */
export interface ErrorResponse {
  code: RESPONSE_CODE_ENUM | string;
  message: string;
  errors?: string[] | null;
  request_id?: string | null;
  detail?: string | Array<{ loc?: (string | number)[]; msg?: string; type?: string }>;
}

/** Canonical Product Entity */
export type Product = PRODUCT_WITH_VARIANTS_SCHEMA;
export type ProductBase = PRODUCT_RESPONSE_SCHEMA;
export type ProductWithVariants = PRODUCT_WITH_VARIANTS_SCHEMA;
export type ProductCreate = PRODUCT_CREATE_SCHEMA;
export type ProductUpdate = PRODUCT_UPDATE_SCHEMA;
export type ProductPagination = PRODUCT_PAGINATION_RESPONSE_SCHEMA;

/** Canonical Product Variant Entity */
export type ProductVariant = PRODUCT_VARIANT_RESPONSE_SCHEMA;
export type ProductVariantCreate = PRODUCT_VARIANT_CREATE_SCHEMA;
export type ProductVariantUpdate = PRODUCT_VARIANT_UPDATE_SCHEMA;

/** Canonical Customer Entity */
export type Customer = CUSTOMER_RESPONSE_SCHEMA;
export type CustomerCreate = CUSTOMER_CREATE_SCHEMA;
export type CustomerUpdate = CUSTOMER_UPDATE_SCHEMA;
export type CustomerListOut = CUSTOMER_LIST_OUT_SCHEMA;

/** Canonical Sale & Order Entity */
export type Sale = SALE_RESPONSE_SCHEMA;
export type SaleCreate = SALE_CREATE_SCHEMA;
export type SaleItem = SALE_ITEM_RESPONSE_SCHEMA;
export type SaleItemCreate = SALE_ITEM_CREATE_SCHEMA;
export type SalePayment = SALE_PAYMENT_RESPONSE_SCHEMA;
export type SalePaymentCreate = SALE_PAYMENT_CREATE_SCHEMA;
export type Invoice = SALE_RESPONSE_SCHEMA;

/** Canonical Inventory Stock & Movement Entities */
export type InventoryStock = INVENTORY_STOCK_RESPONSE_SCHEMA;
export type InventoryMovement = INVENTORY_MOVEMENT_RESPONSE_SCHEMA;

/** Canonical Warehouse & Branch Entities */
export type Warehouse = WarehouseOut;
export type WarehouseCreate = BranchCreate;
export type Branch = BranchOut;
export type BranchCreateInput = BranchCreate;
export type BranchUpdateInput = BranchUpdate;

/** Canonical Purchase Order Entity */
export type PurchaseOrder = PURCHASE_ORDER_RESPONSE_SCHEMA;
export type PurchaseItem = PURCHASE_ITEM_RESPONSE_SCHEMA;

/** Canonical Payment Entities */
export type PaymentTransaction = PAYMENT_TRANSACTION_RESPONSE_SCHEMA;
export type KhqrPaymentRequest = PAYMENT_KHQR_CREATE_REQUEST_SCHEMA;
export type PurchaseFormRequest = PAYMENT_PURCHASE_FORM_REQUEST_SCHEMA;
export type PurchaseFormResponse = PAYMENT_PURCHASE_FORM_RESPONSE_SCHEMA;

/** Canonical Catalog Entities */
export type Category = CATEGORY_RESPONSE_SCHEMA;
export type CategoryCreate = CATEGORY_CREATE_SCHEMA;
export type CategoryUpdate = CATEGORY_UPDATE_SCHEMA;
export type Brand = BRAND_RESPONSE_SCHEMA;
export type BrandCreate = BRAND_CREATE_SCHEMA;
export type BrandUpdate = BRAND_UPDATE_SCHEMA;
export type Color = COLOR_RESPONSE_SCHEMA;
export type ColorCreate = COLOR_CREATE_SCHEMA;
export type ColorUpdate = COLOR_UPDATE_SCHEMA;
export type Size = SIZE_RESPONSE_SCHEMA;
export type Supplier = SUPPLIER_RESPONSE_SCHEMA;

/** Canonical Promotion & Coupon Entities */
export type Promotion = PROMOTION_RESPONSE_SCHEMA;
export type CouponValidationRequest = COUPON_VALIDATION_REQUEST_SCHEMA;
export type CouponValidationResponse = COUPON_VALIDATION_RESPONSE_SCHEMA;

/** Canonical User, Role & Auth Entities */
export type User = USER_RESPONSE_SCHEMA;
export type Role = ROLE_RESPONSE_SCHEMA;
export type Permission = PERMISSION_RESPONSE_SCHEMA;
export type TokenResponse = TOKEN_RESPONSE_SCHEMA;
export type LoginResponse = LOGIN_RESPONSE_SCHEMA;

