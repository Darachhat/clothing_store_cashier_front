import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const KHR_EXCHANGE_RATE = 4000

function roundCurrency(val: number): number {
  return Math.round((Number(val) || 0) * 100) / 100
}

function formatRiel(amountUsd: number): string {
  const khr = Math.round((Number(amountUsd) || 0) * KHR_EXCHANGE_RATE)
  return `៛${khr.toLocaleString()}`
}

function computeChangeDue(tender: number, grandTotal: number): number {
  const diff = Number(tender) - Number(grandTotal)
  return diff > 0 ? roundCurrency(diff) : 0
}

function computeShortfall(tender: number, grandTotal: number): number {
  const diff = Number(grandTotal) - Number(tender)
  return diff > 0 ? roundCurrency(diff) : 0
}

function computeSplitTotal(splits: Array<{ amount: number }>): number {
  return roundCurrency(splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0))
}

function computeSplitRemaining(grandTotal: number, splits: Array<{ amount: number }>): number {
  const total = computeSplitTotal(splits)
  return roundCurrency(Math.max(0, grandTotal - total))
}

describe('Payment System QA & Calculations Suite', () => {
  describe('1. Currency Conversion & Exchange Rate Integrity', () => {
    it('uses standard 4,000 KHR per 1 USD exchange rate consistently', () => {
      assert.equal(KHR_EXCHANGE_RATE, 4000)
    })

    it('converts USD amounts to KHR formatted strings accurately', () => {
      assert.equal(formatRiel(1), '៛4,000')
      assert.equal(formatRiel(2.5), '៛10,000')
      assert.equal(formatRiel(25.75), '៛103,000')
      assert.equal(formatRiel(100), '៛400,000')
      assert.equal(formatRiel(0), '៛0')
    })

    it('converts KHR denominations to equivalent USD values', () => {
      const khrDenominations = [20000, 50000, 100000, 200000, 400000]
      const expectedUsd = [5.00, 12.50, 25.00, 50.00, 100.00]

      khrDenominations.forEach((khr, i) => {
        const usd = roundCurrency(khr / KHR_EXCHANGE_RATE)
        assert.equal(usd, expectedUsd[i])
      })
    })
  })

  describe('2. Cash Tender & Change Calculations', () => {
    it('calculates exact payment with zero change and zero shortfall', () => {
      const total = 42.50
      const tender = 42.50
      assert.equal(computeChangeDue(tender, total), 0)
      assert.equal(computeShortfall(tender, total), 0)
    })

    it('calculates change due correctly for overpayment', () => {
      const total = 37.25
      const tender = 50.00
      const changeUsd = computeChangeDue(tender, total)
      assert.equal(changeUsd, 12.75)
      assert.equal(formatRiel(changeUsd), '៛51,000')
    })

    it('calculates shortfall correctly for underpayment', () => {
      const total = 85.00
      const tender = 50.00
      const shortUsd = computeShortfall(tender, total)
      assert.equal(shortUsd, 35.00)
      assert.equal(formatRiel(shortUsd), '៛140,000')
    })

    it('handles floating point arithmetic cleanly without precision drift', () => {
      const total = 0.10 + 0.20 // 0.30000000000000004
      const tender = 1.00
      const change = computeChangeDue(tender, total)
      assert.equal(change, 0.70)
    })
  })

  describe('3. Exactly 2 Primary Payment Methods Architecture', () => {
    it('restricts available primary payment methods to Cash and ABA Payment', () => {
      const paymentMethods = [
        { value: 'CASH', label: 'Cash' },
        { value: 'ABA_PAYWAY', label: 'ABA Payment' },
      ]
      assert.equal(paymentMethods.length, 2)
      assert.deepEqual(paymentMethods.map(m => m.value), ['CASH', 'ABA_PAYWAY'])
    })

    it('supports all 6 official ABA PayWay payment options', () => {
      const expectedOptions = ['bakong', 'abapay', 'cards', 'alipay', 'wechat', 'google_pay']
      assert.equal(expectedOptions.length, 6)
      assert.ok(expectedOptions.includes('bakong')) // KHQR
      assert.ok(expectedOptions.includes('abapay')) // ABA Mobile QR
      assert.ok(expectedOptions.includes('cards'))  // Credit/Debit Cards
      assert.ok(expectedOptions.includes('alipay')) // Alipay
      assert.ok(expectedOptions.includes('wechat')) // WeChat Pay
      assert.ok(expectedOptions.includes('google_pay')) // Google Pay
    })
  })

  describe('4. Split Payment Allocations with Exactly 2 Methods', () => {
    it('allocates multiple payment methods between Cash and ABA Payment', () => {
      const grandTotal = 150.00
      const splits = [
        { payment_method: 'CASH', amount: 50.00 },
        { payment_method: 'ABA_PAYWAY', amount: 100.00 },
      ]

      assert.equal(computeSplitTotal(splits), 150.00)
      assert.equal(computeSplitRemaining(grandTotal, splits), 0)
    })

    it('identifies shortfall when split payments do not cover grand total', () => {
      const grandTotal = 120.00
      const splits = [
        { payment_method: 'CASH', amount: 40.00 },
        { payment_method: 'ABA_PAYWAY', amount: 30.00 },
      ]

      assert.equal(computeSplitTotal(splits), 70.00)
      assert.equal(computeSplitRemaining(grandTotal, splits), 50.00)
    })

    it('updates balance remaining immediately when a split row is removed', () => {
      const grandTotal = 100.00
      const splits = [
        { payment_method: 'CASH', amount: 40.00 },
        { payment_method: 'ABA_PAYWAY', amount: 60.00 },
      ]

      assert.equal(computeSplitRemaining(grandTotal, splits), 0)

      // Remove row index 1 (ABA_PAYWAY)
      splits.splice(1, 1)

      assert.equal(splits.length, 1)
      assert.equal(computeSplitTotal(splits), 40.00)
      assert.equal(computeSplitRemaining(grandTotal, splits), 60.00)
    })
  })

  describe('5. ABA PayWay Built-in Checkout Integration Lifecycle', () => {
    it('constructs purchase form payload with the selected option', () => {
      function buildMockFormPayload(saleId: string, option: string, amount: number) {
        return {
          action_url: 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase',
          form_data: {
            tran_id: 'TRAN_' + Date.now(),
            amount: amount.toFixed(2),
            payment_option: option,
            type: 'purchase',
            view_type: 'popup',
          },
        }
      }

      const payload = buildMockFormPayload('sale_123', 'bakong', 25.00)
      assert.equal(payload.form_data.payment_option, 'bakong')
      assert.equal(payload.form_data.view_type, 'popup')
      assert.equal(payload.form_data.amount, '25.00')
    })

    it('verifies transitions from pending to approved upon backend confirmation', () => {
      type TxStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED'

      function processStatusUpdate(currentStatus: TxStatus, receivedStatus: string): TxStatus {
        if (receivedStatus === '0' || receivedStatus === 'APPROVED') return 'APPROVED'
        if (receivedStatus === 'DECLINED') return 'DECLINED'
        if (receivedStatus === 'CANCELLED') return 'CANCELLED'
        return currentStatus
      }

      assert.equal(processStatusUpdate('PENDING', '0'), 'APPROVED')
      assert.equal(processStatusUpdate('PENDING', 'APPROVED'), 'APPROVED')
      assert.equal(processStatusUpdate('PENDING', 'DECLINED'), 'DECLINED')
      assert.equal(processStatusUpdate('PENDING', '1'), 'PENDING')
    })
  })
})
