import process from 'node:process'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function normalizeBasePath(basePath: string) {
  if (basePath === '/') {
    return '/'
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function resolveBase() {
  const explicitBase = process.env.VITE_BASE_PATH
  if (explicitBase) {
    return normalizeBasePath(explicitBase)
  }

  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (
    process.env.GITHUB_ACTIONS === 'true' &&
    repository &&
    !repository.toLowerCase().endsWith('.github.io')
  ) {
    return `/${repository}/`
  }

  return '/'
}

export default defineConfig({
  base: resolveBase(),
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})