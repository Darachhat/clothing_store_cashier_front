<template>
  <div class="login-root">
    <div class="login-brand">
      <div class="login-brand__inner">
        <div class="login-brand__logo">
          <UIcon name="i-heroicons-computer-desktop" class="w-6 h-6 text-white" />
        </div>
        <div class="login-brand__name">POS Terminal</div>
        <p class="login-brand__tagline">Point of Sale system for cashiers. Fast, reliable checkout with barcode scanning.</p>
        <div class="login-brand__features">
          <div v-for="feat in features" :key="feat" class="login-brand__feature">
            <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 text-white" />
            {{ feat }}
          </div>
        </div>
      </div>
    </div>

    <div class="login-form-panel">
      <div class="login-form-wrap">
        <div class="login-form-header">
          <h1 class="login-form-title">Cashier Sign In</h1>
          <p class="login-form-subtitle">Enter your cashier username, verified phone, or Telegram account.</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="login-field">
            <label class="login-label" for="username">Username or Verified Phone</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="login-input"
              placeholder="cashier or +85569382165"
              autocomplete="username"
              autofocus
              required
            />
          </div>

          <div class="login-field">
            <label class="login-label" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="login-input"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button type="button" class="login-pw-toggle" @click="showPassword = !showPassword">
              <UIcon v-if="!showPassword" name="i-heroicons-eye" class="w-4 h-4" />
              <UIcon v-else name="i-heroicons-eye-slash" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="errorMsg" class="login-error">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 flex-shrink-0" />
            {{ errorMsg }}
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="login-btn__spinner w-4 h-4" />
            {{ loading ? 'Opening POS...' : 'Open POS' }}
          </button>
        </form>

        <div class="login-divider">
          <span>or</span>
        </div>

        <div class="telegram-login-section">
          <button
            type="button"
            class="login-tg-btn"
            :disabled="loading || appChallengeActive"
            @click="startTelegramAppLogin"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            <span>{{ appChallengeActive ? 'Waiting for Telegram App...' : 'Log in with Telegram App' }}</span>
          </button>

          <div v-if="appChallengeActive" class="telegram-payload-card">
            <div class="flex items-center gap-2 text-xs text-white/90">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 login-btn__spinner" />
              <span>{{ appChallengeMessage || 'Confirm login in your Telegram App (@clothing_store_kvm_bot)...' }}</span>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <a
                v-if="appChallengeWebUrl"
                :href="appChallengeWebUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="login-tg-btn"
                style="text-decoration: none; height: 34px; font-size: 12px;"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                <span>Open in Telegram</span>
              </a>
              <button
                type="button"
                class="login-tg-btn"
                style="height: 34px; font-size: 12px;"
                @click="cancelTelegramAppLogin"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        <p class="login-footer-note">
          For cashier accounts only. Contact your manager if you need access.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['guest'] })
useHead({ title: 'Cashier Sign In — POS Terminal' })

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const telegramBotId = ref<string>('8453886789')
const appChallengeActive = ref(false)
const appChallengeMessage = ref('')
const appChallengeWebUrl = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const features = [
  'Barcode & QR code scanning',
  'Multi-payment checkout',
  'Hold & resume orders',
  'Receipt printing',
]

async function verifyPortalRolesAndRedirect() {
  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['CASHIER', 'ADMIN'].includes(r))) {
    await authStore.logout()
    errorMsg.value = 'This POS terminal is for Cashier accounts only.'
    return
  }
  await router.push('/pos')
}

async function handleLogin() {
  errorMsg.value = ''
  if (!form.username.trim() || !form.password) {
    errorMsg.value = 'Please enter both username/phone and password.'
    return
  }
  loading.value = true
  try {
    await authStore.login(form.username.trim(), form.password)
    await verifyPortalRolesAndRedirect()
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string } }
    errorMsg.value = error?.data?.detail || 'Invalid username or password.'
  } finally {
    loading.value = false
  }
}

async function handleTelegramAuthCallback(userPayload: Record<string, unknown>) {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.loginWithTelegram(userPayload)
    await verifyPortalRolesAndRedirect()
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string } }
    errorMsg.value = error?.data?.detail || 'Telegram authentication failed.'
  } finally {
    loading.value = false
  }
}

function extractTelegramRedirectPayload(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  if (hash.includes('tgAuthResult=')) {
    try {
      const encoded = hash.split('tgAuthResult=')[1]?.split('&')[0] || ''
      const normalizedBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalizedBase64 + '='.repeat((4 - (normalizedBase64.length % 4)) % 4)
      const parsed = JSON.parse(atob(padded))
      if (parsed && parsed.id && parsed.hash) {
        window.history.replaceState({}, document.title, window.location.pathname)
        return parsed
      }
    } catch {}
  }
  const params = new URLSearchParams(window.location.search)
  if (params.get('id') && params.get('hash') && params.get('auth_date')) {
    const payload: Record<string, unknown> = {
      id: Number(params.get('id')) || params.get('id'),
      auth_date: Number(params.get('auth_date')),
      hash: params.get('hash'),
    }
    if (params.get('first_name')) payload.first_name = params.get('first_name')
    if (params.get('last_name')) payload.last_name = params.get('last_name')
    if (params.get('username')) payload.username = params.get('username')
    if (params.get('photo_url')) payload.photo_url = params.get('photo_url')
    window.history.replaceState({}, document.title, window.location.pathname)
    return payload
  }
  return null
}

function cancelTelegramAppLogin() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  appChallengeActive.value = false
  appChallengeMessage.value = ''
  appChallengeWebUrl.value = ''
}

async function startTelegramAppLogin() {
  if (typeof window === 'undefined') return
  errorMsg.value = ''
  cancelTelegramAppLogin()
  try {
    const ch = await authStore.createTelegramAppChallenge()
    appChallengeActive.value = true
    appChallengeMessage.value = "Tap 'Start' in your Telegram App to sign in..."
    appChallengeWebUrl.value = ch.tg_web_url
    window.location.href = ch.tg_app_url

    pollTimer = setInterval(async () => {
      try {
        const res = await authStore.pollTelegramAppStatus(ch.challenge_token)
        if (res.message) appChallengeMessage.value = res.message
        if (res.status === 'APPROVED') {
          cancelTelegramAppLogin()
          await verifyPortalRolesAndRedirect()
        } else if (res.status === 'REJECTED' || res.status === 'EXPIRED') {
          const msg = res.message || 'Telegram login was declined or expired.'
          cancelTelegramAppLogin()
          errorMsg.value = msg
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.statusCode === 403) {
          cancelTelegramAppLogin()
          errorMsg.value = err?.data?.detail || 'Account is not authorized for this POS terminal.'
        }
      }
    }, 2000)
  } catch (err: any) {
    errorMsg.value = err?.data?.detail || 'Could not start Telegram App login.'
  }
}

onBeforeUnmount(() => {
  cancelTelegramAppLogin()
})

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const redirectedPayload = extractTelegramRedirectPayload()
    if (redirectedPayload) {
      await handleTelegramAuthCallback(redirectedPayload)
      return
    }
  }
  const tgConfig = await authStore.getTelegramConfig()
  if (tgConfig.bot_id) telegramBotId.value = tgConfig.bot_id
})
</script>

<style scoped>
.login-root { display: flex; min-height: 100dvh; background: var(--brand-900); }

.login-brand {
  display: none;
  width: 380px;
  min-width: 380px;
  background: rgba(255,255,255,0.05);
  border-right: 1px solid rgba(255,255,255,0.08);
  padding: var(--space-6) var(--space-4);
  flex-direction: column;
  justify-content: center;
}
@media (min-width: 768px) { .login-brand { display: flex; } }

.login-brand__inner { display: flex; flex-direction: column; gap: var(--space-3); }
.login-brand__logo { width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
.login-brand__name { font-size: 22px; font-weight: 700; color: white; letter-spacing: -0.02em; margin-top: 4px; }
.login-brand__tagline { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 52ch; }
.login-brand__features { display: flex; flex-direction: column; gap: 10px; margin-top: var(--space-1); }
.login-brand__feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.7); }

.login-form-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--space-4) var(--space-2); }
.login-form-wrap { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: var(--space-3); }
.login-form-header { display: flex; flex-direction: column; gap: 4px; }
.login-form-title { font-size: 22px; font-weight: 700; color: white; letter-spacing: -0.02em; }
.login-form-subtitle { font-size: 13px; color: rgba(255,255,255,0.55); }

.login-form { display: flex; flex-direction: column; gap: var(--space-2); }
.login-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
.login-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7); letter-spacing: 0.01em; max-width: none; }

.login-input {
  height: 44px; width: 100%;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-md);
  padding: 0 12px;
  font-family: var(--font-body); font-size: 15px;
  color: white; background: rgba(255,255,255,0.08); outline: none;
}
.login-input:focus { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.12); }
.login-input::placeholder { color: rgba(255,255,255,0.3); }

.login-pw-toggle { position: absolute; right: 10px; bottom: 12px; color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer; padding: 0; display: flex; }
.login-pw-toggle:hover { color: rgba(255,255,255,0.8); }

.login-error { display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: rgba(239,68,68,0.2); border-radius: var(--radius-md); font-size: 13px; color: #fca5a5; }

.login-btn {
  height: 44px; width: 100%;
  background: white; color: var(--brand-900);
  border: none; border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px;
}
.login-btn:hover:not(:disabled) { background: #f0f0f0; }
.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.login-btn__spinner { animation: spin 0.8s linear infinite; color: var(--brand-900); }

.login-divider { display: flex; align-items: center; gap: 10px; font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }
.login-divider::before, .login-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.15); }

.telegram-login-section { display: flex; flex-direction: column; gap: 8px; }
.telegram-widget-box { display: flex; justify-content: center; }
.login-tg-btn {
  height: 40px; width: 100%;
  background: rgba(255,255,255,0.08); color: white;
  border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 13px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.login-tg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.14); }
.telegram-payload-card {
  padding: 10px; border: 1px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-md); background: rgba(255,255,255,0.06);
  display: flex; flex-direction: column; gap: 8px;
}
.telegram-payload-hint { font-size: 11px; color: rgba(255,255,255,0.65); line-height: 1.4; }
.telegram-payload-textarea {
  width: 100%; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md);
  padding: 8px; font-family: monospace; font-size: 11px;
  color: white; background: rgba(0,0,0,0.2); outline: none; resize: vertical;
}

@keyframes spin { to { transform: rotate(360deg); } }
.login-footer-note { font-size: 12px; color: rgba(255,255,255,0.35); text-align: center; max-width: none; }
</style>
