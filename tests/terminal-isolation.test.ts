import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Storage Key resolution matching cashier_front/app/stores/pos.ts
 */
function getTerminalStorageKey(terminalCode?: string | null): string {
  const code = (terminalCode && terminalCode.trim()) ? terminalCode.trim().toUpperCase() : 'POS-01'
  return `pos_session_${code}`
}

/**
 * In-memory Mock LocalStorage
 */
class MockStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

/**
 * Pure POS Terminal Cart Session Manager matching usePosStore logic
 */
class PosSessionManager {
  terminalCode: string
  terminalId: string | null
  cart: Array<{ variantId: string; name: string; quantity: number; unitPrice: number }> = []
  storage: MockStorage

  constructor(terminalCode: string, storage: MockStorage, terminalId: string | null = null) {
    this.terminalCode = (terminalCode && terminalCode.trim()) ? terminalCode.trim().toUpperCase() : 'POS-01'
    this.terminalId = terminalId
    this.storage = storage
    this.loadFromStorage()
  }

  get storageKey(): string {
    return getTerminalStorageKey(this.terminalCode)
  }

  addItem(variantId: string, name: string, unitPrice: number, quantity: number = 1): void {
    const existing = this.cart.find(i => i.variantId === variantId)
    if (existing) {
      existing.quantity += quantity
    } else {
      this.cart.push({ variantId, name, quantity, unitPrice })
    }
    this.persist()
  }

  removeItem(variantId: string): void {
    this.cart = this.cart.filter(i => i.variantId !== variantId)
    this.persist()
  }

  clearCart(): void {
    this.cart = []
    this.persist()
  }

  persist(): void {
    this.storage.setItem(this.storageKey, JSON.stringify({
      terminalCode: this.terminalCode,
      terminalId: this.terminalId,
      cart: this.cart,
      timestamp: Date.now(),
    }))
  }

  loadFromStorage(): void {
    const raw = this.storage.getItem(this.storageKey)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (Array.isArray(data.cart)) {
        this.cart = data.cart
      }
      if (data.terminalId) {
        this.terminalId = data.terminalId
      }
    } catch {}
  }

  switchTerminal(newCode: string, newId: string | null = null): void {
    this.persist() // Save current terminal state first
    this.terminalCode = newCode.trim().toUpperCase()
    this.terminalId = newId
    this.cart = []
    this.loadFromStorage() // Load targeted terminal state
  }

  generateSalePayload(branchId: string, warehouseId: string) {
    return {
      branch_id: branchId,
      warehouse_id: warehouseId,
      terminal_id: this.terminalId || undefined,
      terminal_code: this.terminalCode,
      items: this.cart.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    }
  }
}

describe('Multi-POS Terminal Management & Cart Isolation', () => {
  it('Storage key generation normalizes terminal codes and scopes keys', () => {
    assert.equal(getTerminalStorageKey('POS-01'), 'pos_session_POS-01')
    assert.equal(getTerminalStorageKey('pos-02'), 'pos_session_POS-02')
    assert.equal(getTerminalStorageKey(' reg-03 '), 'pos_session_REG-03')
    assert.equal(getTerminalStorageKey(''), 'pos_session_POS-01')
    assert.equal(getTerminalStorageKey(null), 'pos_session_POS-01')
    assert.equal(getTerminalStorageKey(undefined), 'pos_session_POS-01')
  })

  it('Terminal 1 and Terminal 2 carts are strictly isolated in storage', () => {
    const storage = new MockStorage()

    // Station 1: POS-01
    const pos1 = new PosSessionManager('POS-01', storage, 'uuid-terminal-1')
    pos1.addItem('var-a1', 'Linen Shirt M', 24.50, 2)

    // Station 2: POS-02
    const pos2 = new PosSessionManager('POS-02', storage, 'uuid-terminal-2')
    pos2.addItem('var-b2', 'Denim Jeans 32', 39.00, 1)

    // Verify Station 1 state
    assert.equal(pos1.cart.length, 1)
    assert.equal(pos1.cart[0]?.variantId, 'var-a1')
    assert.equal(pos1.cart[0]?.quantity, 2)

    // Verify Station 2 state
    assert.equal(pos2.cart.length, 1)
    assert.equal(pos2.cart[0]?.variantId, 'var-b2')
    assert.equal(pos2.cart[0]?.quantity, 1)

    // Verify independent keys in storage
    const pos1Stored = JSON.parse(storage.getItem('pos_session_POS-01')!)
    const pos2Stored = JSON.parse(storage.getItem('pos_session_POS-02')!)

    assert.equal(pos1Stored.cart[0].variantId, 'var-a1')
    assert.equal(pos2Stored.cart[0].variantId, 'var-b2')
    assert.notEqual(pos1Stored.cart[0].variantId, pos2Stored.cart[0].variantId)
  })

  it('Switching terminals preserves previous terminal state and loads target terminal state', () => {
    const storage = new MockStorage()

    const session = new PosSessionManager('POS-01', storage, 'uuid-term-1')
    session.addItem('var-shirt', 'Oxford Shirt', 25.00, 1)

    // Switch to POS-02
    session.switchTerminal('POS-02', 'uuid-term-2')
    assert.equal(session.terminalCode, 'POS-02')
    assert.equal(session.terminalId, 'uuid-term-2')
    assert.equal(session.cart.length, 0, 'New terminal starts with its own empty cart')

    // Add item to POS-02
    session.addItem('var-shoes', 'Leather Boots', 85.00, 1)
    assert.equal(session.cart.length, 1)
    assert.equal(session.cart[0]?.variantId, 'var-shoes')

    // Switch back to POS-01
    session.switchTerminal('POS-01', 'uuid-term-1')
    assert.equal(session.terminalCode, 'POS-01')
    assert.equal(session.terminalId, 'uuid-term-1')
    assert.equal(session.cart.length, 1)
    assert.equal(session.cart[0]?.variantId, 'var-shirt', 'POS-01 cart was preserved and restored')

    // Switch back to POS-02 again
    session.switchTerminal('POS-02', 'uuid-term-2')
    assert.equal(session.cart.length, 1)
    assert.equal(session.cart[0]?.variantId, 'var-shoes', 'POS-02 cart was preserved and restored')
  })

  it('Sale payload accurately attaches active terminal_id and terminal_code', () => {
    const storage = new MockStorage()

    const pos1 = new PosSessionManager('POS-01', storage, 'uuid-station-1')
    pos1.addItem('var-dress', 'Silk Summer Dress', 45.00, 1)

    const sale1 = pos1.generateSalePayload('branch-uuid-1', 'wh-uuid-1')
    assert.equal(sale1.terminal_id, 'uuid-station-1')
    assert.equal(sale1.terminal_code, 'POS-01')
    assert.equal(sale1.items.length, 1)
    assert.equal(sale1.items[0]?.variant_id, 'var-dress')

    const pos2 = new PosSessionManager('POS-02', storage, 'uuid-station-2')
    pos2.addItem('var-hat', 'Straw Sun Hat', 15.00, 3)

    const sale2 = pos2.generateSalePayload('branch-uuid-1', 'wh-uuid-1')
    assert.equal(sale2.terminal_id, 'uuid-station-2')
    assert.equal(sale2.terminal_code, 'POS-02')
    assert.equal(sale2.items.length, 1)
    assert.equal(sale2.items[0]?.variant_id, 'var-hat')
    assert.equal(sale2.items[0]?.quantity, 3)
  })

  it('Concurrent terminal operations do not corrupt or cross-contaminate carts', () => {
    const storage = new MockStorage()

    const registerA = new PosSessionManager('POS-01', storage, 'uuid-1')
    const registerB = new PosSessionManager('POS-02', storage, 'uuid-2')

    // Concurrent operations simulating two cashiers ringing items simultaneously
    registerA.addItem('item-1', 'Item 1', 10)
    registerB.addItem('item-2', 'Item 2', 20)
    registerA.addItem('item-3', 'Item 3', 30)
    registerB.addItem('item-4', 'Item 4', 40)
    registerA.removeItem('item-1')

    assert.equal(registerA.cart.length, 1)
    assert.equal(registerA.cart[0]?.variantId, 'item-3')

    assert.equal(registerB.cart.length, 2)
    assert.equal(registerB.cart[0]?.variantId, 'item-2')
    assert.equal(registerB.cart[1]?.variantId, 'item-4')

    // Ensure raw storage snapshots remain discrete
    const rawA = JSON.parse(storage.getItem('pos_session_POS-01')!)
    const rawB = JSON.parse(storage.getItem('pos_session_POS-02')!)

    assert.equal(rawA.cart.length, 1)
    assert.equal(rawB.cart.length, 2)
  })
})

