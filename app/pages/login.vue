<template>
  <div class="flex min-h-dvh bg-brand-900">
    <div class="hidden md:flex flex-col justify-center w-[380px] min-w-[380px] bg-white/[0.05] border-r border-white/[0.08] p-8 lg:p-12">
      <div class="flex flex-col gap-6">
        <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            v-if="brand.logo_dark_url || brand.logo_url"
            :src="brand.logo_dark_url || brand.logo_url"
            :alt="displayName"
            class="max-w-full max-h-full object-contain p-1"
          />
          <UIcon v-else name="i-heroicons-computer-desktop" class="w-6 h-6 text-white" />
        </div>
        <div>
          <div class="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1 font-khmer">{{ displayNameKh || displayName }}</div>
          <div v-if="displayNameKh && displayName !== displayNameKh" class="text-xs font-semibold text-white/65 mt-0.5">
            {{ displayName }}
          </div>
        </div>
        <p class="text-sm text-white/50 leading-relaxed max-w-[52ch]">
          {{ brand.tagline || 'Point of Sale system for cashiers. Fast, reliable checkout with barcode & QR scanning.' }}
        </p>
        <div class="flex flex-col gap-2.5 mt-2">
          <div v-for="feat in features" :key="feat" class="flex items-center gap-2.5 text-xs lg:text-sm text-white/70">
            <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 text-white" />
            {{ feat }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div class="w-full max-w-[360px] flex flex-col gap-6">
        <!-- Mobile Brand Header (visible below 768px) -->
        <div class="flex md:hidden items-center gap-3 pb-3 border-b border-white/10">
          <div class="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              v-if="brand.logo_dark_url || brand.logo_url"
              :src="brand.logo_dark_url || brand.logo_url"
              :alt="displayName"
              class="max-w-full max-h-full object-contain p-1"
            />
            <UIcon v-else name="i-heroicons-computer-desktop" class="w-5 h-5 text-white" />
          </div>
          <div class="min-w-0">
            <div class="text-sm font-bold text-white font-khmer truncate">{{ displayNameKh || displayName }}</div>
            <div class="text-[11px] text-white/55 truncate">{{ displayName }} • POS Terminal</div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Cashier Sign In</h1>
          <p class="text-xs sm:text-sm text-white/55">Enter your cashier username, verified phone, or Telegram account.</p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-1.5 relative">
            <label class="text-xs font-semibold text-white/70 tracking-wide" for="username">Username or Verified Phone</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="h-11 w-full border border-white/15 rounded-md px-3 text-sm text-white bg-white/[0.08] outline-none placeholder:text-white/30 focus:border-white/40 focus:bg-white/[0.12] transition-colors"
              placeholder="cashier or +85569382165"
              autocomplete="username"
              autofocus
              required
            />
          </div>

          <div class="flex flex-col gap-1.5 relative">
            <label class="text-xs font-semibold text-white/70 tracking-wide" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="h-11 w-full border border-white/15 rounded-md px-3 text-sm text-white bg-white/[0.08] outline-none placeholder:text-white/30 focus:border-white/40 focus:bg-white/[0.12] transition-colors"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="absolute right-2.5 bottom-2.5 text-white/40 hover:text-white/80 transition-colors p-1 flex items-center justify-center cursor-pointer"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <UIcon v-if="!showPassword" name="i-heroicons-eye" class="w-4 h-4" />
              <UIcon v-else name="i-heroicons-eye-slash" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="errorMsg" class="flex items-center gap-2 p-2.5 sm:px-3 bg-red-500/20 border border-white/15 rounded-md text-xs sm:text-sm text-red-200">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 shrink-0" />
            <span>{{ errorMsg }}</span>
          </div>

          <button
            type="submit"
            class="h-11 w-full bg-white text-brand-900 font-bold text-sm sm:text-base rounded-md flex items-center justify-center gap-2 mt-1 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            {{ loading ? 'Opening POS...' : 'Open POS' }}
          </button>
        </form>

        <div class="flex items-center gap-2.5 text-[11px] text-white/40 uppercase tracking-wider before:flex-1 before:h-px before:bg-white/15 after:flex-1 after:h-px after:bg-white/15">
          <span>or</span>
        </div>

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="h-10 w-full bg-white/[0.08] text-white border border-white/20 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors cursor-pointer disabled:opacity-50"
            :disabled="loading || appChallengeActive"
            @click="startTelegramAppLogin"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            <span>{{ appChallengeActive ? 'Waiting for Telegram App...' : 'Open in Telegram App' }}</span>
          </button>

          <div v-if="appChallengeActive" class="p-2.5 border border-white/20 rounded-md bg-white/[0.06] flex flex-col gap-2">
            <div class="flex items-center gap-2 text-xs text-white/90">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ appChallengeMessage || 'Confirm login in your Telegram App (@clothing_store_kvm_bot)...' }}</span>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <a
                v-if="appChallengeWebUrl"
                :href="appChallengeWebUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 h-8.5 px-3 bg-white/[0.08] text-white border border-white/20 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-white/[0.14] transition-colors no-underline"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                <span>Open in Telegram</span>
              </a>
              <button
                type="button"
                class="h-8.5 px-3 bg-white/[0.08] text-white border border-white/20 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-white/[0.14] transition-colors cursor-pointer"
                @click="cancelTelegramAppLogin"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        <p class="text-xs text-white/35 text-center mt-2 m-0">
          For cashier accounts only. Contact your manager if you need access.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['guest'] })

const authStore = useAuthStore()
const router = useRouter()
const { brand, displayName, displayNameKh, loadBrand } = useBrand()

useHead({
  title: computed(() => `Cashier Sign In — ${displayName.value || 'POS Terminal'}`),
})

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const appChallengeActive = ref(false)
const appChallengeMessage = ref('')
const appChallengeWebUrl = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const features = [
  'Unified 1D barcode & 2D QR code scanning',
  'Multi-payment checkout (Cash, Card, KHQR)',
  'Hold & resume customer orders',
  'Thermal receipt & product sticker printing',
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
  loadBrand()
  if (typeof window !== 'undefined') {
    const redirectedPayload = extractTelegramRedirectPayload()
    if (redirectedPayload) {
      await handleTelegramAuthCallback(redirectedPayload)
    }
  }
})
</script>
