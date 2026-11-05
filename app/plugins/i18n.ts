export default defineNuxtPlugin(() => {
  const i18n = useAppTranslation()

  if (import.meta.client) {
    i18n.fetchTranslations().catch(() => {})
  }

  return {
    provide: {
      t: (key: string, fallback?: string) => i18n.t(key, fallback),
      locale: i18n.currentLocale,
      setLocale: (locale: string) => i18n.setLocale(locale as any),
    },
  }
})
