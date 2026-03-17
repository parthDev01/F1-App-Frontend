import { create } from 'zustand'

// Read env vars baked in at build time, or derive from current URL
const getApiUrl = () => {
  const env = import.meta.env?.VITE_API_URL
  if (env && env !== 'undefined') return env
  // If not set, assume backend is at the well-known Railway URL
  return 'https://f1-app-production.up.railway.app'
}

const getWsUrl = () => {
  const env = import.meta.env?.VITE_WS_URL
  if (env && env !== 'undefined') return env
  // Derive from API URL
  return getApiUrl().replace('https://', 'wss://').replace('http://', 'ws://') + '/ws'
}

let ws = null
let pingTimer = null
let reconnectTimer = null
let pollTimer = null

export const useStore = create((set, get) => ({
  raceState:       null,
  connected:       false,
  selectedDriver:  null,
  driverInsights:  null,
  loadingInsights: false,
  activeTab:       'race',

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

  // REST fallback — always works even when WS fails
  fetchRaceState: async () => {
    try {
      const r = await fetch(`${getApiUrl()}/api/race`)
      if (!r.ok) return
      const data = await r.json()
      set({ raceState: data })
    } catch (e) {
      console.warn('REST fetch failed:', e)
    }
  },

  // Start polling REST every 8s as a fallback
  startPolling: () => {
    clearInterval(pollTimer)
    get().fetchRaceState() // immediate first fetch
    pollTimer = setInterval(() => get().fetchRaceState(), 8000)
  },

  stopPolling: () => clearInterval(pollTimer),

  connectWS: () => {
    // Always start REST polling as baseline — works regardless of WS
    get().startPolling()

    if (ws && ws.readyState === WebSocket.OPEN) return
    if (ws) { try { ws.close() } catch {} }

    try {
      ws = new WebSocket(getWsUrl())
    } catch (e) {
      console.warn('WS connect failed, using REST polling:', e)
      return
    }

    ws.onopen = () => {
      set({ connected: true })
      get().stopPolling() // WS is working, stop polling
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

    ws.onerror = () => {
      set({ connected: false })
      get().startPolling() // WS failed, fall back to polling
    }

    ws.onclose = () => {
      set({ connected: false })
      clearInterval(pingTimer)
      get().startPolling() // WS closed, fall back to polling
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => get().connectWS(), 8000)
    }
  },

  disconnectWS: () => {
    clearInterval(pingTimer)
    clearTimeout(reconnectTimer)
    clearInterval(pollTimer)
    try { ws?.close() } catch {}
    set({ connected: false })
  },
}))
