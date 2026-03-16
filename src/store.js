import { create } from 'zustand'

const getApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  return ''
}

const getWsUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }
  return 'ws://localhost:8000/ws'
}

let ws = null
let pingTimer = null
let reconnectTimer = null

export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  raceState:       null,
  connected:       false,
  selectedDriver:  null,
  driverInsights:  null,
  loadingInsights: false,
  activeTab:       'race',

  // ── Actions ────────────────────────────────────────────────────────────────
  setTab: (t) => set({ activeTab: t }),

  setSelectedDriver: (code) => {
    if (get().selectedDriver === code) {
      set({ selectedDriver: null, driverInsights: null })
    } else {
      set({ selectedDriver: code, driverInsights: null })
      get().fetchInsights(code)
    }
  },

  fetchInsights: async (code) => {
    set({ loadingInsights: true })
    try {
      const r = await fetch(`${getApiUrl()}/api/driver/${code}/insights`)
      const data = await r.json()
      set({ driverInsights: data, loadingInsights: false })
    } catch {
      set({ loadingInsights: false })
    }
  },

  // ── WebSocket ──────────────────────────────────────────────────────────────
  connectWS: () => {
    if (ws && ws.readyState === WebSocket.OPEN) return
    if (ws) { try { ws.close() } catch {} }

    try {
      ws = new WebSocket(getWsUrl())
    } catch (e) {
      console.error('WS connect failed:', e)
      reconnectTimer = setTimeout(() => get().connectWS(), 5000)
      return
    }

    ws.onopen = () => {
      set({ connected: true })
      clearInterval(pingTimer)
      pingTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.send('ping')
      }, 25000)
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'race_update') {
          set({ raceState: msg.data })
          const sel = get().selectedDriver
          if (sel) get().fetchInsights(sel)
        }
      } catch {}
    }

    ws.onerror  = () => set({ connected: false })

    ws.onclose = () => {
      set({ connected: false })
      clearInterval(pingTimer)
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => get().connectWS(), 4000)
    }
  },

  disconnectWS: () => {
    clearInterval(pingTimer)
    clearTimeout(reconnectTimer)
    try { ws?.close() } catch {}
    set({ connected: false })
  },
}))
