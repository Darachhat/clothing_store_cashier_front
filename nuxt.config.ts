// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,
  spaLoadingTemplate: 'spa-loading-template.html',
  devtools: { enabled: true },

  experimental: {
    appManifest: false,
    payloadExtraction: false,
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  hooks: {
    'build:manifest': (manifest) => {
      for (const key in manifest) {
        manifest[key].prefetch = false
      }
    },
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
    },
  },

  runtimeConfig: {
    apiBase:     process.env.NUXT_API_BASE     || '',
    // X-System-Authorization value injected server-side; never sent to browser
    apiBaseAuth: process.env.NUXT_API_BASE_AUTH || '',
    public: {
      apiBase:     process.env.NUXT_PUBLIC_API_BASE     || '',
      backendBase: process.env.NUXT_PUBLIC_BACKEND_BASE || process.env.NUXT_API_BASE || '',
      appName:     process.env.NUXT_PUBLIC_APP_NAME     || '',
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
    cloudflare: {
      deployConfig: false,
    },
  } as any,

  routeRules: {
    '/': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/login': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/pos/**': {
      ssr: false,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/settings/**': {
      ssr: false,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    ...(process.env.NUXT_API_BASE
      ? { '/uploads/**': { proxy: `${process.env.NUXT_API_BASE}/uploads/**` } }
      : {}),
  } as any,
})
