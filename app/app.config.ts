export default defineAppConfig({
  ui: {
    colors: {
      // @ts-expect-error: @nuxt/ui v2 type doesn't expose 'primary'/'neutral' in string[]
      primary: 'green',
      neutral: 'slate',
    },
  },
})
