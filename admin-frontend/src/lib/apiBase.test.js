import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildApiUrlFromBase,
  getApiRuntimeConfig,
  resolveAssetUrlFromBase,
} from './apiBase.js'

test('admin production runtime defaults to a same-origin /api base', () => {
  const runtimeConfig = getApiRuntimeConfig({ DEV: false })

  assert.equal(runtimeConfig.apiBaseUrl, '/api')
  assert.equal(
    buildApiUrlFromBase(runtimeConfig.apiBaseUrl, '/api/admin/auth/login', runtimeConfig),
    '/api/admin/auth/login',
  )
  assert.equal(
    buildApiUrlFromBase(runtimeConfig.apiBaseUrl, '/api/faqs/admin', runtimeConfig),
    '/api/faqs/admin',
  )
})

test('admin asset URLs stay outside the /api prefix', () => {
  const runtimeConfig = getApiRuntimeConfig({ DEV: false, VITE_API_BASE_URL: '/api' })

  assert.equal(
    resolveAssetUrlFromBase(runtimeConfig.assetBaseUrl, '/uploads/hall-of-fame/example.webp'),
    '/uploads/hall-of-fame/example.webp',
  )
})

test('admin absolute API origins remain supported for legacy deployments', () => {
  const runtimeConfig = getApiRuntimeConfig({
    DEV: false,
    VITE_API_BASE_URL: 'https://example.com/api',
  })

  assert.equal(
    buildApiUrlFromBase(runtimeConfig.apiBaseUrl, '/api/admin/auth/me', runtimeConfig),
    'https://example.com/api/admin/auth/me',
  )
  assert.equal(
    resolveAssetUrlFromBase(runtimeConfig.assetBaseUrl, '/uploads/example.webp'),
    'https://example.com/uploads/example.webp',
  )
})
