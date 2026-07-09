import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../utils/api'
import { getAuthToken } from '../utils/authStorage'

const getSocketBaseUrl = () => API_BASE_URL.replace(/\/api\/?$/, '')

const getUnreadTotal = (conversations = []) =>
  conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0)

export default function useChatUnreadCount(userId) {
  const [unreadCount, setUnreadCount] = useState(0)
  const fetchInFlightRef = useRef(false)

  const fetchUnreadCount = useCallback(async () => {
    const token = getAuthToken()
    if (!token || !userId || fetchInFlightRef.current) {
      if (!token || !userId) setUnreadCount(0)
      return
    }

    try {
      fetchInFlightRef.current = true
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) return

      const data = await response.json()
      const conversations = Array.isArray(data?.conversations) ? data.conversations : []
      setUnreadCount(getUnreadTotal(conversations))
    } catch (error) {
      console.error('Failed to fetch chat unread count:', error)
    } finally {
      fetchInFlightRef.current = false
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return undefined
    }

    fetchUnreadCount()

    const token = getAuthToken()
    if (!token) return undefined

    const socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ['polling', 'websocket']
    })

    socket.on('connect', fetchUnreadCount)
    socket.on('chat:conversation-updated', fetchUnreadCount)
    socket.on('chat:conversation-deleted', fetchUnreadCount)

    const onFocus = () => fetchUnreadCount()
    window.addEventListener('focus', onFocus)

    const interval = window.setInterval(fetchUnreadCount, 25000)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(interval)
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [userId, fetchUnreadCount])

  return unreadCount
}
