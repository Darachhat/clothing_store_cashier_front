// TypeScript types for the entire application

export interface User {
  id: string
  username: string
  email: string
  full_name: string
  employee_code?: string
  branch_id?: string
  status: string
  roles: Role[]
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  code: string
  name: string
  module: string
}

export interface Branch {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  status: string
}

export interface Warehouse {
  id: string
  branch_id: string
  name: string
  is_default: boolean
  status: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  status: string
  sort_order: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
  status: string
}

export interface Color {
  id: string
  name: string
  hex_code?: string
  status: string
}

export interface Size {
  id: string
  name: string
  type: 'LETTER' | 'NUMERIC' | 'CUSTOM'
  sort_order: number
  status: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  phone?: string
  email?: string
  contact_person?: string
  status: string
}

export interface Product {
  id: string
  code: string
  name: string
  slug: string
  description?: string
  category_id?: string
  brand_id?: string
  supplier_id?: string
  status: string
  image_url?: string
  category?: Category
  brand?: Brand
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  product?: Product
  sku: string
  barcode?: string
  qr_reference: string
  color_id?: string
  color?: Color
  size_id?: string
  size?: Size
  cost_price: number
  selling_price: number
  wholesale_price?: number
  weight_grams?: number
  status: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface InventoryStock {
  id: string
  variant_id: string
  warehouse_id: string
  quantity: number
  reorder_level: number
}

export interface InventoryMovement {
  id: string
  variant_id: string
  warehouse_id: string
  movement_type: string
  quantity: number
  before_quantity: number
  after_quantity: number
  reference_type?: string
  reference_id?: string
  note?: string
  created_by?: string
  created_at: string
}

export interface Customer {
  id: string
  customer_code: string
  name: string
  phone?: string
  email?: string
  status: string
  created_at: string
}

export interface Sale {
  id: string
  invoice_number: string
  customer_id?: string
  branch_id: string
  warehouse_id: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total: number
  payment_status: string
  sale_status: string
  cashier_id: string
  items: SaleItem[]
  payments: SalePayment[]
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  variant_id: string
  quantity: number
  unit_price: number
  cost_price: number
  discount_amount: number
  subtotal: number
}

export interface SalePayment {
  id: string
  sale_id: string
  payment_method: string
  amount: number
  reference_number?: string
}

export interface DashboardData {
  period: string
  sales_count: number
  revenue: number
  gross_profit: number
  expenses: number
  net_profit: number
  low_stock_count: number
}
