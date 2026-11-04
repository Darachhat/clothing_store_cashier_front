import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCustomerDisplayUrl,
  getDisplayPresenceStorageKey,
  isDisplayPresenceFresh,
} from '../app/composables/useCustomerDisplaySync.ts'

describe('customer display presence', () => {
  const now = 1_000_000

  it('treats a recent beacon as online', () => {
    assert.equal(isDisplayPresenceFresh(JSON.stringify({ timestamp: now - 3000 }), now), true)
  })

  it('treats a stale, missing or malformed beacon as offline', () => {
    assert.equal(isDisplayPresenceFresh(JSON.stringify({ timestamp: now - 60_000 }), now), false)
    assert.equal(isDisplayPresenceFresh(null, now), false)
    assert.equal(isDisplayPresenceFresh('not-json', now), false)
    assert.equal(isDisplayPresenceFresh(JSON.stringify({}), now), false)
  })

  it('scopes presence keys and URLs per terminal', () => {
    assert.notEqual(getDisplayPresenceStorageKey('POS-01'), getDisplayPresenceStorageKey('POS-02'))
    assert.equal(buildCustomerDisplayUrl('pos-02'), '/pos/customer-display?terminal=POS-02')
  })
})

