import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { getSupabaseClient } from '../../../core/database/client/supabaseClient.js'

const PRESENCE_CHANNEL = 'imortal0800:portal-presence'
const PRESENCE_STORAGE_KEY = 'imortal0800.presence-id'

const CommunityPresenceContext = createContext({
  connected: false,
  onlineCount: null,
  xatCount: null,
})

function createPresenceId() {
  try {
    const stored = window.localStorage.getItem(PRESENCE_STORAGE_KEY)
    if (stored) return stored

    const value = typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `imortal-${Date.now()}-${Math.random().toString(36).slice(2)}`

    window.localStorage.setItem(PRESENCE_STORAGE_KEY, value)
    return value
  } catch {
    return `imortal-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function getPresenceArea(pathname = '/') {
  return pathname === '/chat' || pathname.startsWith('/chat/')
    ? 'xat'
    : 'site'
}

function summarizePresence(channel) {
  const state = channel.presenceState()
  const entries = Object.values(state || {})

  return {
    onlineCount: entries.length,
    xatCount: entries.filter((presences) =>
      Array.isArray(presences) && presences.some((presence) => presence?.area === 'xat')
    ).length,
  }
}

export function CommunityPresenceProvider({ pathname, children }) {
  const pathnameRef = useRef(pathname)
  const channelRef = useRef(null)
  const [state, setState] = useState({
    connected: false,
    onlineCount: null,
    xatCount: null,
  })

  useEffect(() => {
    pathnameRef.current = pathname

    const channel = channelRef.current
    if (!channel || !state.connected) return

    channel.track({
      area: getPresenceArea(pathname),
      online_at: new Date().toISOString(),
    }).catch(() => {})
  }, [pathname, state.connected])

  useEffect(() => {
    const client = getSupabaseClient()

    if (!client || typeof window === 'undefined') {
      setState({
        connected: false,
        onlineCount: null,
        xatCount: null,
      })
      return undefined
    }

    const presenceKey = createPresenceId()
    const channel = client.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    })

    channelRef.current = channel

    const syncState = () => {
      const summary = summarizePresence(channel)
      setState((current) => ({
        ...current,
        ...summary,
      }))
    }

    channel
      .on('presence', { event: 'sync' }, syncState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setState((current) => ({ ...current, connected: true }))

          try {
            await channel.track({
              area: getPresenceArea(pathnameRef.current),
              online_at: new Date().toISOString(),
            })
          } catch {
            setState((current) => ({ ...current, connected: false }))
          }
          return
        }

        if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          setState({
            connected: false,
            onlineCount: null,
            xatCount: null,
          })
        }
      })

    return () => {
      channelRef.current = null
      channel.untrack().catch(() => {})
      client.removeChannel(channel)
    }
  }, [])

  return (
    <CommunityPresenceContext.Provider value={state}>
      {children}
    </CommunityPresenceContext.Provider>
  )
}

export function useCommunityPresence() {
  return useContext(CommunityPresenceContext)
}
