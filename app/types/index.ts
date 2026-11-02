// Centralized API Contract Types - Re-exported from Generated Backend OpenAPI Schemas
export * from './api.generated'

// Frontend-only View Models and Presentation Types
export interface DashboardData {
  period: string
  sales_count: number
  revenue: number
  gross_profit: number
  expenses: number
  net_profit: number
  low_stock_count: number
}
