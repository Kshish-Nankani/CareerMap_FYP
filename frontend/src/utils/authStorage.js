const TOKEN_STORAGE_KEY = 'token'

export const getAuthToken = () => sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''

export const setAuthToken = (token) => {
  const normalizedToken = String(token || '').trim()
  if (!normalizedToken) return

  sessionStorage.setItem(TOKEN_STORAGE_KEY, normalizedToken)
  // Remove shared token to keep sessions independent per tab.
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const clearAuthToken = () => {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const migrateLegacyTokenToSession = () => {
  const sessionToken = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  if (sessionToken) return sessionToken

  const legacyToken = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!legacyToken) return ''

  sessionStorage.setItem(TOKEN_STORAGE_KEY, legacyToken)
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  return legacyToken
}
