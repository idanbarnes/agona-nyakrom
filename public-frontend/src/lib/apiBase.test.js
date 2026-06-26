import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildApiUrlFromBase,
  getApiRuntimeConfig,
  resolveAssetUrlFromBase,
} from './apiBase.js'

test('production runtime defaults to a same-origin /api base', () => {
  const runtimeConfig = getApiRuntimeConfig({ DEV: false })

  assert.equal(runtimeConfig.apiBaseUrl, '/api')
  assert.equal(
    buildApiUrlFromBase(runtimeConfig.apiBaseUrl, '/api/public/homepage', runtimeConfig),
    '/api/public/homepage',
  )
  assert.equal(
    resolveAssetUrlFromBase(runtimeConfig.assetBaseUrl, '/uploads/news/example.webp'),
    '/uploads/news/example.webp',
  )
})

test('explicit absolute API origins still avoid duplicating /api', () => {
  const runtimeConfig = getApiRuntimeConfig({
    DEV: false,
    VITE_API_BASE_URL: 'http://localhost:5000/api',
  })

  assert.equal(
    buildApiUrlFromBase(runtimeConfig.apiBaseUrl, '/api/public/news', runtimeConfig),
    'http://localhost:5000/api/public/news',
  )
  assert.equal(
    resolveAssetUrlFromBase(runtimeConfig.assetBaseUrl, '/uploads/news/example.webp'),
    'http://localhost:5000/uploads/news/example.webp',
  )
})

test('development runtime preserves proxy-friendly relative requests', () => {
  const runtimeConfig = getApiRuntimeConfig({ DEV: true })

  assert.equal(runtimeConfig.apiBaseUrl, '')
  assert.equal(
    buildApiUrlFromBase(runtimeConfig.apiBaseUrl, '/api/public/homepage', runtimeConfig),
    '/api/public/homepage',
  )
  assert.equal(
    resolveAssetUrlFromBase(runtimeConfig.assetBaseUrl, '/uploads/news/example.webp'),
    'http://localhost:5000/uploads/news/example.webp',
  )
})

test('loopback frontend upload assets resolve to the backend asset origin', () => {
  const previousWindow = globalThis.window
  globalThis.window = {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
      port: '5174',
    },
  }

  try {
    assert.equal(
      resolveAssetUrlFromBase('', '/uploads/hall-of-fame/example.webp'),
      'http://localhost:5000/uploads/hall-of-fame/example.webp',
    )
    assert.equal(
      resolveAssetUrlFromBase(
        '',
        'http://localhost:5174/uploads/hall-of-fame/example.webp',
      ),
      'http://localhost:5000/uploads/hall-of-fame/example.webp',
    )
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})

test('loopback upload assets prefer the backend origin over a stale frontend asset base', () => {
  const previousWindow = globalThis.window
  globalThis.window = {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
      port: '5174',
    },
  }

  try {
    assert.equal(
      resolveAssetUrlFromBase(
        'http://localhost:5174',
        'http://localhost:5174/uploads/hall-of-fame/example.webp',
      ),
      'http://localhost:5000/uploads/hall-of-fame/example.webp',
    )
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})
