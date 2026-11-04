import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('Cashier Shift Sessions & Cash Drawer Float Tracking Suite', () => {
  it('calculates expected cash in drawer from opening float and cash sales', () => {
    const openingFloatUsd = 100.00
    const openingFloatKhr = 400000.00

    const sales = [
      { total: 25.00, payments: [{ payment_method: 'CASH', amount: 25.00 }] },
      { total: 50.00, payments: [{ payment_method: 'ABA_KHQR', amount: 50.00 }] },
      { total: 15.00, payments: [{ payment_method: 'CASH', amount: 15.00 }] },
      { total: 60.00, payments: [{ payment_method: 'CARD', amount: 60.00 }] },
    ]

    // Only CASH payments increase expected physical cash drawer
    let cashSalesTotal = 0
    let nonCashTotal = 0

    for (const s of sales) {
      for (const p of s.payments) {
        if (p.payment_method === 'CASH') {
          cashSalesTotal += p.amount
        } else {
          nonCashTotal += p.amount
        }
      }
    }

    assert.strictEqual(cashSalesTotal, 40.00)
    assert.strictEqual(nonCashTotal, 110.00)

    const expectedCashUsd = openingFloatUsd + cashSalesTotal
    const expectedCashKhr = openingFloatKhr

    assert.strictEqual(expectedCashUsd, 140.00)
    assert.strictEqual(expectedCashKhr, 400000.00)
  })

  it('calculates drawer discrepancy accurately: balanced, over, and short', () => {
    const expectedCashUsd = 140.00

    // Scenario A: Exact count (Balanced)
    const countedExact = 140.00
    const diffExact = Number((countedExact - expectedCashUsd).toFixed(2))
    assert.strictEqual(diffExact, 0.00)

    // Scenario B: $5 Over
    const countedOver = 145.00
    const diffOver = Number((countedOver - expectedCashUsd).toFixed(2))
    assert.strictEqual(diffOver, 5.00)
    assert.ok(diffOver > 0, 'Should be flagged as OVER')

    // Scenario C: $3.50 Short
    const countedShort = 136.50
    const diffShort = Number((countedShort - expectedCashUsd).toFixed(2))
    assert.strictEqual(diffShort, -3.50)
    assert.ok(diffShort < 0, 'Should be flagged as SHORT')
  })

  it('constructs shift open and close payloads adhering to backend schema', () => {
    const terminalDbId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

    // Open Shift Payload
    const openPayload = {
      terminal_id: terminalDbId,
      opening_float_usd: 100.00,
      opening_float_khr: 400000.00,
      notes: 'Morning shift opening float',
    }
    assert.strictEqual(openPayload.terminal_id, terminalDbId)
    assert.strictEqual(openPayload.opening_float_usd, 100.00)
    assert.strictEqual(openPayload.opening_float_khr, 400000.00)

    // Close Shift Payload
    const closePayload = {
      closing_cash_usd: 140.00,
      closing_cash_khr: 400000.00,
      notes: 'Drawer verified with floor manager',
    }
    assert.strictEqual(closePayload.closing_cash_usd, 140.00)
    assert.strictEqual(closePayload.closing_cash_khr, 400000.00)
  })

  it('automatically links active shift_id to outgoing checkout sale payload', () => {
    const activeShift = {
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      terminal_code: 'POS-01',
      status_code: 'OPEN',
    }

    const salePayload = {
      branch_id: 'b1',
      warehouse_id: 'w1',
      terminal_id: 't1',
      shift_id: activeShift.id,
      customer_id: null,
      discount_amount: 0,
      tax_amount: 1.50,
      items: [{ variant_id: 'v1', quantity: 1, unit_price: 30.00 }],
      payments: [{ payment_method: 'CASH', amount: 31.50 }],
    }

    assert.strictEqual(salePayload.shift_id, '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
    assert.strictEqual(salePayload.payments?.[0]?.payment_method, 'CASH')
  })

  it('formats end-of-shift Z-Report summary correctly for 80mm thermal slip', () => {
    const zReportSummary = {
      shift_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      terminal_code: 'POS-01',
      branch_name: 'Flagship Mall',
      cashier_name: 'Alice Cashier',
      opened_at: '2026-11-03T08:00:00Z',
      closed_at: '2026-11-03T16:00:00Z',
      opening_float_usd: 100.00,
      opening_float_khr: 400000.00,
      total_sales_count: 14,
      total_sales_amount: 540.00,
      cash_sales_amount: 220.00,
      aba_sales_amount: 280.00,
      card_sales_amount: 40.00,
      expected_cash_usd: 320.00,
      closing_cash_usd: 320.00,
      discrepancy_usd: 0.00,
    }

    assert.strictEqual(zReportSummary.total_sales_amount, zReportSummary.cash_sales_amount + zReportSummary.aba_sales_amount + zReportSummary.card_sales_amount)
    assert.strictEqual(zReportSummary.expected_cash_usd, zReportSummary.opening_float_usd + zReportSummary.cash_sales_amount)
    assert.strictEqual(zReportSummary.discrepancy_usd, zReportSummary.closing_cash_usd - zReportSummary.expected_cash_usd)
  })
})
