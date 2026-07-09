const onlineConnections = new Map()

export const markUserConnected = (userId = '') => {
  const current = Number(onlineConnections.get(String(userId)) || 0)
  onlineConnections.set(String(userId), current + 1) // onlineConnections map me userId ko key bana ke uski value ko increment kar rahe he, taki pata chale ki kitne connections hai us user ke (multiple tabs ya devices se connect ho sakta hai)
}

export const markUserDisconnected = (userId = '') => {
  const key = String(userId)
  const current = Number(onlineConnections.get(key) || 0)
  if (current <= 1) {
    onlineConnections.delete(key)
    return
  }

  onlineConnections.set(key, current - 1)
}

export const isUserOnline = (userId = '') => Number(onlineConnections.get(String(userId)) || 0) > 0
