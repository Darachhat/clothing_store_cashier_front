// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  experimental: {
    appManifest: false,
  },

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  tailwindcss: {
    configPath: '~/tailwind.config.ts',
    exposeConfig: false,
  },

  app: {
    head: {
      title: 'POS Terminal — Clothing Store',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Inter+Tight:wght@400;500;600;700&family=Kantumruy+Pro:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap',
        },
      ],
      script: [
        {
          src: 'https://checkout.payway.com.kh/plugins/checkout2-0.js?hide-close=2',
          defer: true,
        },
      ],
    },
  },

  runtimeConfig: {
    apiBase:     process.env.NUXT_API_BASE     || 'http://backend:8000',
    // X-System-Authorization value injected server-side; never sent to browser
    apiBaseAuth: process.env.NUXT_API_BASE_AUTH || '',
    public: {
      apiBase:     process.env.NUXT_PUBLIC_API_BASE     || '/api/proxy',
      backendBase: process.env.NUXT_PUBLIC_BACKEND_BASE || 'http://localhost:8000',
      appName:     process.env.NUXT_PUBLIC_APP_NAME     || 'Clothing Store — POS',
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  ui: {
    global: true,
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['~/assets/css/main.css'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  nitro: {
    preset: process.env.NITRO_PRESET || (process.env.CF_PAGES ? 'cloudflare_pages' : 'cloudflare-module'),
    compatibilityDate: '2024-11-01',
  },

  routeRules: {
    '/pos': { ssr: false },
    '/pos/scanner': { ssr: false },
    '/pos/customer-display': { ssr: false },
    '/scanner': { redirect: '/pos/scanner' },
    '/settings': { ssr: false },
    // @ts-expect-error: 'proxy' is valid at runtime but not in the RouteRules type definition
    '/uploads/**': { proxy: `${process.env.NUXT_API_BASE || 'http://backend:8000'}/uploads/**` },
  },
})
