/**
 * Composable for managing ABA PayWay eCommerce Checkout modal (checkout2-0.js).
 * Supports Credit/Debit Cards (Visa, Mastercard, JCB, UPI).
 */
import { ref } from 'vue'

export function useAbaCheckout() {
  const isModalOpen = ref(false)
  const isFormPreparing = ref(false)
  const checkoutError = ref<string | null>(null)
  let domObserver: MutationObserver | null = null

  /**
   * Helper to resolve the AbaPayway instance from global/script scope.
   */
  function getAbaPaywayInstance(): any {
    if (typeof window === 'undefined') return null
    if ((window as any).AbaPayway) return (window as any).AbaPayway
    try {
      const instance = (new Function('return typeof AbaPayway !== "undefined" ? AbaPayway : null')())
      if (instance) {
        ;(window as any).AbaPayway = instance
        return instance
      }
    } catch {}
    return null
  }

  /**
   * Ensure checkout2-0.js and its sub-scripts (checkout.prod.js) are loaded.
   */
  async function ensureAbaScript(): Promise<void> {
    if (typeof window === 'undefined') return
    if (getAbaPaywayInstance()) return

    // Inject checkout2-0.js if missing
    if (!document.querySelector('script[src*="checkout2-0.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://checkout.payway.com.kh/plugins/checkout2-0.js?hide-close=2'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    // checkout2-0.js loads checkout.prod.js with a 1s delay; poll until ready
    return new Promise((resolve) => {
      const start = Date.now()
      const timer = setInterval(() => {
        if (getAbaPaywayInstance() || Date.now() - start > 6000) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  }

  function attachDomObserver() {
    if (typeof window === 'undefined') return
    if (domObserver) {
      domObserver.disconnect()
      domObserver = null
    }

    const container = document.getElementById('aba-checkout')
    if (!container) return

    domObserver = new MutationObserver(() => {
      const hasChildren = container.children.length > 0
      const isVisible = container.style.display !== 'none'
      if ((!hasChildren || !isVisible) && isModalOpen.value) {
        dismissCheckout()
      }
    })

    domObserver.observe(container, {
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
  }

  /**
   * Injects or updates the hidden form and triggers AbaPayway.checkout().
   */
  async function launchCheckout(payload: {
    action_url: string
    form_data: Record<string, string>
  }): Promise<boolean> {
    if (typeof window === 'undefined') return false

    isFormPreparing.value = true
    checkoutError.value = null

    try {
      await ensureAbaScript()

      // Find or create hidden form
      let form = document.getElementById('aba_merchant_request') as HTMLFormElement | null
      if (!form) {
        form = document.createElement('form')
        form.id = 'aba_merchant_request'
        form.method = 'POST'
        form.target = 'aba_webservice'
        form.style.display = 'none'
        document.body.appendChild(form)
      } else {
        form.innerHTML = ''
      }

      form.action = payload.action_url

      // Populate input fields
      for (const [key, value] of Object.entries(payload.form_data)) {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        }
      }

      // Ensure container #aba-checkout exists for ABA modal injection
      let container = document.getElementById('aba-checkout')
      if (!container) {
        container = document.createElement('div')
        container.id = 'aba-checkout'
        document.body.appendChild(container)
      }

      // Trigger checkout
      const aba = getAbaPaywayInstance()
      if (aba && typeof aba.checkout === 'function') {
        aba.checkout()
        isModalOpen.value = true
        // Listen for close/removal in DOM
        setTimeout(() => {
          attachDomObserver()
        }, 500)
        return true
      } else {
        // Fallback: Submit form in popup window if plugin instance fails to mount
        window.open('', 'aba_webservice', 'width=450,height=650,resizable=yes,scrollbars=yes')
        form.submit()
        isModalOpen.value = true
        return true
      }
    } catch (err: any) {
      checkoutError.value = err?.message || 'Failed to open ABA Checkout'
      return false
    } finally {
      isFormPreparing.value = false
    }
  }

  function dismissCheckout() {
    isModalOpen.value = false
    if (domObserver) {
      domObserver.disconnect()
      domObserver = null
    }

    if (typeof document === 'undefined') return

    const aba = getAbaPaywayInstance()
    if (aba && typeof aba.closeCheckoutByContinueUrl === 'function') {
      try {
        aba.closeCheckoutByContinueUrl()
      } catch {}
    }

    const abaContainer = document.getElementById('aba-checkout')
    if (abaContainer) {
      abaContainer.classList.remove('aba-checkout-desktop')
      abaContainer.innerHTML = ''
      abaContainer.style.display = 'none'
    }

    document.body.style.overflowY = 'visible'
  }

  return {
    isModalOpen,
    isFormPreparing,
    checkoutError,
    launchCheckout,
    dismissCheckout,
  }
}
