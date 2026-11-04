#!/usr/bin/env node
/**
 * Automatic Cloudflare Cache Purge on Build / Commit Deploy
 *
 * Runs automatically after `nuxt build` via the `postbuild` script in package.json.
 * To enable automatic cache purging on Cloudflare Workers Builds or CI/CD, set:
 *   - CF_ZONE_ID (or CLOUDFLARE_ZONE_ID): Your kimvannak.store Zone ID from Cloudflare Dashboard overview
 *   - CF_API_TOKEN (or CLOUDFLARE_API_TOKEN): API Token with "Zone -> Cache Purge -> Purge" permission
 *   - CF_PURGE_HOSTS (optional): Comma-separated hostnames to purge selectively (e.g. "cashier.kimvannak.store"),
 *     otherwise defaults to `{ "purge_everything": true }`.
 */

const zoneId = (process.env.CF_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID || '').trim()
const apiToken = (
  process.env.CF_API_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN ||
  process.env.CF_PURGE_TOKEN ||
  ''
).trim()
const purgeHostsRaw = (process.env.CF_PURGE_HOSTS || '').trim()

async function purgeCloudflareCache() {
  if (!zoneId || !apiToken) {
    console.log(
      '[cf-purge] Skipping automatic Cloudflare cache purge (CF_ZONE_ID / CF_API_TOKEN not set in build env).'
    )
    return
  }

  const hosts = purgeHostsRaw
    ? purgeHostsRaw
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : []

  const payload = hosts.length > 0 ? { hosts } : { purge_everything: true }
  const modeLabel = hosts.length > 0 ? `hosts: ${hosts.join(', ')}` : 'purge_everything: true'

  console.log(`[cf-purge] Purging Cloudflare cache for zone ${zoneId} (${modeLabel})...`)

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json().catch(() => null)

    if (response.ok && result?.success) {
      console.log('[cf-purge] Successfully purged Cloudflare cache!')
    } else {
      console.warn(
        `[cf-purge] Cloudflare cache purge returned HTTP ${response.status}:`,
        JSON.stringify(result?.errors || result || {})
      )
    }
  } catch (err) {
    console.warn('[cf-purge] Failed to reach Cloudflare Purge API (non-fatal):', err?.message || err)
  }
}

purgeCloudflareCache()

