import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('POS Customer Loyalty Points Redemption Suite', () => {
  it('calculates dollar redemption equivalent accurately (100 pts = $1.00)', () => {
    function calculateMaxRedeemable(points: number, subtotal: number): number {
      const dollarEquivalent = Math.floor(points / 100) * 1.0
      return Math.min(dollarEquivalent, Math.max(0, Math.floor(subtotal)))
    }

    assert.equal(calculateMaxRedeemable(50, 25.0), 0, 'Under 100 points cannot redeem dollar values')
    assert.equal(calculateMaxRedeemable(100, 25.0), 1.0, '100 points = $1.00 discount')
    assert.equal(calculateMaxRedeemable(550, 25.0), 5.0, '550 points = $5.00 discount (floor to whole dollars)')
    assert.equal(calculateMaxRedeemable(3000, 15.0), 15.0, 'Redemption cannot exceed subtotal ceiling')
  })

  it('deducts loyalty points discount from taxable subtotal and re-calculates grand total', () => {
    const subtotal = 50.0
    const taxRate = 0.05
    const pointsDiscount = 5.0 // 500 points redeemed

    const taxableAmount = Math.max(0, subtotal - pointsDiscount)
    const tax = taxableAmount * taxRate
    const grandTotal = taxableAmount + tax

    assert.equal(taxableAmount, 45.0, 'Taxable amount is reduced by redeemed points')
    assert.equal(tax, 2.25, 'VAT is calculated on post-loyalty subtotal')
    assert.equal(grandTotal, 47.25, 'Grand total reflects points discount accurately')
  })

  it('constructs negative adjustment payload for backend loyalty ledger sync', () => {
    const customerId = 'cust-123'
    const redeemedPoints = 500
    const invoiceNumber = 'INV-2026-0099'

    const payload = {
      points: -redeemedPoints,
      note: `Redeemed on ${invoiceNumber}`,
    }

    assert.equal(payload.points, -500, 'Payload points must be negative to deduct from balance')
    assert.ok(payload.note.includes(invoiceNumber), 'Note must cross-reference invoice number')
  })
})

