import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Station Device Enrollment State Machine matching usePosSettings.ts
 */
class StationEnrollmentStateMachine {
  terminalId: string
  enrolledTerminalId: string | null
  deviceLockEnabled: boolean
  managerPin: string

  constructor(initialTerminal = 'POS-01', managerPin = '1234') {
    this.terminalId = initialTerminal
    this.enrolledTerminalId = null
    this.deviceLockEnabled = false
    this.managerPin = managerPin
  }

  enroll(terminalCode: string): void {
    this.terminalId = terminalCode.trim().toUpperCase()
    this.enrolledTerminalId = this.terminalId
    this.deviceLockEnabled = true
  }

  unlock(pin: string): boolean {
    if (!this.verifyPin(pin)) return false
    this.deviceLockEnabled = false
    return true
  }

  verifyPin(pin: string): boolean {
    return (pin || '').trim() === this.managerPin
  }

  attemptSwitchTerminal(targetCode: string, providedPin?: string): { allowed: boolean; reason: string } {
    const normalizedTarget = targetCode.trim().toUpperCase()

    if (normalizedTarget === this.terminalId) {
      return { allowed: true, reason: 'Already on active terminal' }
    }

    if (!this.deviceLockEnabled) {
      this.terminalId = normalizedTarget
      return { allowed: true, reason: 'Switch allowed (unlocked device)' }
    }

    // Locked device: must verify manager PIN
    if (!providedPin || !this.verifyPin(providedPin)) {
      return { allowed: false, reason: 'Manager PIN required for enrolled workstation' }
    }

    // Authorized
    this.terminalId = normalizedTarget
    this.enrolledTerminalId = normalizedTarget
    return { allowed: true, reason: 'Authorized by manager' }
  }
}

/**
 * Receipt Template Synchronization Simulator matching ReceiptModal.vue
 */
class ReceiptTemplateSimulator {
  template: Record<string, any>

  constructor(initialSettings: Record<string, any> = {}) {
    this.template = {
      store_name: 'DEFAULT STORE',
      phone: '+855 23 000 000',
      address: 'Phnom Penh, Cambodia',
      paper_width: '80mm',
      show_item_sku: true,
      footer_message: 'THANK YOU',
      return_policy: 'No refunds',
      ...initialSettings,
    }
  }

  syncRemoteSettings(remoteSettings: Record<string, any>): void {
    this.template = {
      ...this.template,
      ...remoteSettings,
    }
  }

  formatReceiptHeader(): { storeName: string; phone: string; address: string; taxId?: string } {
    return {
      storeName: this.template.store_name,
      phone: this.template.phone,
      address: this.template.address,
      taxId: this.template.tax_id,
    }
  }

  formatReceiptFooter(): { message: string; policy: string; wifi?: string } {
    return {
      message: this.template.footer_message,
      policy: this.template.return_policy,
      wifi: this.template.wifi_info,
    }
  }
}

describe('POS Station Device Enrollment & Manager PIN Lock Suite (Task 1.4)', () => {
  let station: StationEnrollmentStateMachine

  beforeEach(() => {
    station = new StationEnrollmentStateMachine('POS-01', '5566')
  })

  it('allows free terminal switching when station enrollment lock is disabled', () => {
    assert.strictEqual(station.deviceLockEnabled, false)
    assert.strictEqual(station.terminalId, 'POS-01')

    const res = station.attemptSwitchTerminal('POS-02')
    assert.strictEqual(res.allowed, true)
    assert.strictEqual(station.terminalId, 'POS-02')
  })

  it('enrolling workstation locks it to the physical register', () => {
    station.enroll('POS-01')
    assert.strictEqual(station.deviceLockEnabled, true)
    assert.strictEqual(station.enrolledTerminalId, 'POS-01')

    // Switching without PIN must be blocked
    const resNoPin = station.attemptSwitchTerminal('POS-02')
    assert.strictEqual(resNoPin.allowed, false)
    assert.strictEqual(station.terminalId, 'POS-01')
    assert.match(resNoPin.reason, /Manager PIN required/)

    // Switching with invalid PIN must be blocked
    const resBadPin = station.attemptSwitchTerminal('POS-02', '0000')
    assert.strictEqual(resBadPin.allowed, false)
    assert.strictEqual(station.terminalId, 'POS-01')

    // Switching with valid PIN succeeds and updates enrolled register
    const resGoodPin = station.attemptSwitchTerminal('POS-02', '5566')
    assert.strictEqual(resGoodPin.allowed, true)
    assert.strictEqual(station.terminalId, 'POS-02')
    assert.strictEqual(station.enrolledTerminalId, 'POS-02')
  })

  it('unlocks workstation cleanly when manager supplies valid PIN', () => {
    station.enroll('POS-01')
    assert.strictEqual(station.deviceLockEnabled, true)

    // Failed unlock
    const badUnlock = station.unlock('wrong')
    assert.strictEqual(badUnlock, false)
    assert.strictEqual(station.deviceLockEnabled, true)

    // Successful unlock
    const goodUnlock = station.unlock('5566')
    assert.strictEqual(goodUnlock, true)
    assert.strictEqual(station.deviceLockEnabled, false)

    // Terminal can now be switched freely without PIN
    const res = station.attemptSwitchTerminal('POS-03')
    assert.strictEqual(res.allowed, true)
    assert.strictEqual(station.terminalId, 'POS-03')
  })
})

describe('Synchronized Receipt Template Pipeline (Task 3.2 -> Cashier Front)', () => {
  it('applies remote admin receipt template customizations over defaults', () => {
    const receiptEngine = new ReceiptTemplateSimulator({
      store_name: 'DEFAULT CLOTHING STORE',
    })

    const initialHeader = receiptEngine.formatReceiptHeader()
    assert.strictEqual(initialHeader.storeName, 'DEFAULT CLOTHING STORE')

    // Admin updates receipt template on server
    const remoteAdminPayload = {
      store_name: 'VANNAK BOUTIQUE BKK1',
      phone: '+855 23 999 888',
      address: '#88 Street 51, BKK1, Phnom Penh',
      tax_id: 'K001-888999777',
      paper_width: '80mm',
      footer_message: 'THANK YOU FOR SHOPPING AT VANNAK BOUTIQUE!',
      return_policy: 'Exchanges accepted within 7 days with tag and receipt.',
      wifi_info: 'Wi-Fi: Vannak_BKK1 | Key: pass2026',
    }

    receiptEngine.syncRemoteSettings(remoteAdminPayload)

    const updatedHeader = receiptEngine.formatReceiptHeader()
    assert.strictEqual(updatedHeader.storeName, 'VANNAK BOUTIQUE BKK1')
    assert.strictEqual(updatedHeader.phone, '+855 23 999 888')
    assert.strictEqual(updatedHeader.taxId, 'K001-888999777')

    const updatedFooter = receiptEngine.formatReceiptFooter()
    assert.strictEqual(updatedFooter.message, 'THANK YOU FOR SHOPPING AT VANNAK BOUTIQUE!')
    assert.strictEqual(updatedFooter.policy, 'Exchanges accepted within 7 days with tag and receipt.')
    assert.strictEqual(updatedFooter.wifi, 'Wi-Fi: Vannak_BKK1 | Key: pass2026')
  })
})

