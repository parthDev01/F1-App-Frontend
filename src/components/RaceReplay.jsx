import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchCircuitPath, DEFAULT_CIRCUIT } from './circuits'

const API = import.meta.env?.VITE_API_URL || 'https://f1-app-production.up.railway.app'
const LAP_MS = 900

const DRIVERS_2026 = [
  { code:'RUS', full_name:'George Russell',    team:'Mercedes',        team_color:'#27F4D2' },
  { code:'ANT', full_name:'Kimi Antonelli',    team:'Mercedes',        team_color:'#27F4D2' },
  { code:'HAM', full_name:'Lewis Hamilton',    team:'Ferrari',         team_color:'#E8002D' },
  { code:'LEC', full_name:'Charles Leclerc',   team:'Ferrari',         team_color:'#E8002D' },
  { code:'VER', full_name:'Max Verstappen',    team:'Red Bull Racing', team_color:'#3671C6' },
  { code:'TSU', full_name:'Yuki Tsunoda',      team:'Red Bull Racing', team_color:'#3671C6' },
  { code:'NOR', full_name:'Lando Norris',      team:'McLaren',         team_color:'#FF8000' },
  { code:'PIA', full_name:'Oscar Piastri',     team:'McLaren',         team_color:'#FF8000' },
  { code:'ALO', full_name:'Fernando Alonso',   team:'Aston Martin',    team_color:'#358C75' },
  { code:'STR', full_name:'Lance Stroll',      team:'Aston Martin',    team_color:'#358C75' },
  { code:'GAS', full_name:'Pierre Gasly',      team:'Alpine',          team_color:'#0093CC' },
  { code:'DOO', full_name:'Jack Doohan',       team:'Alpine',          team_color:'#0093CC' },
  { code:'ALB', full_name:'Alexander Albon',   team:'Williams',        team_color:'#005AFF' },
  { code:'SAI', full_name:'Carlos Sainz',      team:'Williams',        team_color:'#005AFF' },
  { code:'OCO', full_name:'Esteban Ocon',      team:'Haas',            team_color:'#B6BABD' },
  { code:'BEA', full_name:'Oliver Bearman',    team:'Haas',            team_color:'#B6BABD' },
  { code:'HAD', full_name:'Isack Hadjar',      team:'Racing Bulls',    team_color:'#5E8FAA' },
  { code:'LAW', full_name:'Liam Lawson',       team:'Racing Bulls',    team_color:'#5E8FAA' },
  { code:'HUL', full_name:'Nico Hulkenberg',   team:'Audi',            team_color:'#C6C6C6' },
  { code:'BOR', full_name:'Gabriel Bortoleto', team:'Audi',            team_color:'#C6C6C6' },
  { code:'COL', full_name:'Franco Colapinto',  team:'GM Andretti',     team_color:'#E6003A' },
  { code:'OWA', full_name:'Jak Crawford',      team:'GM Andretti',     team_color:'#E6003A' },
]
const DRIVER_MAP = Object.fromEntries(DRIVERS_2026.map(d => [d.code, d]))

function buildSyntheticLaps(results, totalLaps) {
  const resultMap = {}
  ;(results || []).forEach(r => { resultMap[r.driver] = r })
  const finalOrder = []
  ;(results || []).forEach(r => { finalOrder.push({ ...DRIVER_MAP[r.driver], ...r }) })
  DRIVERS_2026.forEach(d => {
    if (!finalOrder.find(f => f.code === d.code || f.driver === d.code))
      finalOrder.push({ ...d, driver: d.code, position: finalOrder.length + 1, points: 0 })
  })
  const laps = {}
  for (let lap = 1; lap <= totalLaps; lap++) {
    const progress = lap / totalLaps
    laps[lap] = finalOrder.map((d, i) => {
      let pos = i + 1
      if (lap <= 10) {
        const noise = Math.sin(lap * 3.1 + i * 2.3) * 2
        pos = Math.max(1, Math.min(finalOrder.length, Math.round(pos + noise * (1 - progress * 3))))
      }
      return { driver: d.driver || d.code, position: pos, team_color: d.team_color || '#888', full_name: d.full_name, team: d.team }
    })
    laps[lap].sort((a,b) => a.position - b.position)
    laps[lap] = laps[lap].map((d,i) => ({ ...d, position: i+1 }))
  }
  return laps
}

export default function RaceReplay({ lastRace }) {
  const pathRef       = useRef(null)
  const animRef       = useRef(null)
  const lapTimer      = useRef(null)
  const posRef        = useRef({})
  const targetRef     = useRef({})
  const lapsDataRef   = useRef({})
  const currentLapRef = useRef(1)

  const [svgPath,     setSvgPath]     = useState(null)
  const [viewBox,     setViewBox]     = useState('0 0 500 500')
  const [currentLap,  setCurrentLap]  = useState(1)
  const [totalLaps,   setTotalLaps]   = useState(56)
  const [dots,        setDots]        = useState([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [hasLiveData, setHasLiveData] = useState(false)
  const [lapOrder,    setLapOrder]    = useState([])

  const circuit = lastRace?.circuit || 'shanghai'

  // Fetch SVG from CDN
  useEffect(() => {
    fetchCircuitPath(circuit).then(result => {
      if (result) { setSvgPath(result.path); setViewBox(result.viewBox) }
      else        { setSvgPath(DEFAULT_CIRCUIT.path); setViewBox(DEFAULT_CIRCUIT.viewBox) }
    })
  }, [circuit])

  const seedPositions = useCallback((drivers) => {
    const total = drivers.length
    drivers.forEach((d, i) => {
      const frac = (i / total) * 0.88
      posRef.current[d.driver]    = frac
      targetRef.current[d.driver] = frac
    })
  }, [])

  // Fetch lap data
  useEffect(() => {
    if (!lastRace) return
    setIsLoading(true)
    fetch(`${API}/api/last-race/replay`)
      .then(r => r.json())
      .then(data => {
        const total = data.total_laps || lastRace?.total_laps || 56
        setTotalLaps(total)
        setHasLiveData(data.has_live_data)
        let lapMap = data.laps && Object.keys(data.laps).length > 0
          ? data.laps : buildSyntheticLaps(lastRace?.results, total)
        const norm = {}
        Object.entries(lapMap).forEach(([k,v]) => { norm[parseInt(k)] = v })
        lapsDataRef.current = norm
        const first = norm[1] || norm[Object.keys(norm).sort((a,b)=>a-b)[0]] || []
        const all = [...first]
        DRIVERS_2026.forEach(d => {
          if (!all.find(x => x.driver === d.code))
            all.push({ driver:d.code, position:all.length+1, team_color:d.team_color, full_name:d.full_name, team:d.team })
        })
        seedPositions(all)
        setLapOrder(all)
        setIsLoading(false)
      })
      .catch(() => {
        const total = lastRace?.total_laps || 56
        const synthetic = buildSyntheticLaps(lastRace?.results, total)
        lapsDataRef.current = synthetic
        setTotalLaps(total)
        const first = synthetic[1] || []
        seedPositions(first)
        setLapOrder(first)
        setIsLoading(false)
      })
  }, [lastRace?.round])

  const advanceLap = useCallback(() => {
    const laps = lapsDataRef.current
    const keys = Object.keys(laps).map(Number).sort((a,b)=>a-b)
    if (!keys.length) return
    const idx     = keys.indexOf(currentLapRef.current)
    const nextLap = idx >= keys.length - 1 ? keys[0] : keys[idx + 1]
    currentLapRef.current = nextLap
    setCurrentLap(nextLap)
    const lapDrivers = (laps[nextLap] || []).map(d => ({
      ...d,
      team_color: d.team_color || DRIVER_MAP[d.driver]?.team_color || '#888',
      full_name:  d.full_name  || DRIVER_MAP[d.driver]?.full_name  || d.driver,
    }))
    DRIVERS_2026.forEach(d => {
      if (!lapDrivers.find(x => x.driver === d.code))
        lapDrivers.push({ driver:d.code, position:lapDrivers.length+1, team_color:d.team_color, full_name:d.full_name, team:d.team })
    })
    setLapOrder(lapDrivers)
    const leaderFrac = posRef.current[lapDrivers[0]?.driver] ?? 0.55
    lapDrivers.forEach((d, i) => { targetRef.current[d.driver] = ((leaderFrac - i * 0.028) + 2) % 1 })
  }, [])

  useEffect(() => {
    if (isLoading) return
    const keys = Object.keys(lapsDataRef.current).map(Number).sort((a,b)=>a-b)
    if (keys.length) { currentLapRef.current = keys[0]; setCurrentLap(keys[0]) }
    lapTimer.current = setInterval(advanceLap, LAP_MS)
    return () => clearInterval(lapTimer.current)
  }, [isLoading, advanceLap])

  // Smooth animation
  useEffect(() => {
    if (!svgPath || !pathRef.current) return
    let last = 0
    const step = (ts) => {
      if (!pathRef.current) return
      const tl = pathRef.current.getTotalLength()
      if (!tl) { animRef.current = requestAnimationFrame(step); return }
      if (last) {
        const dt    = Math.min(ts - last, 80)
        const alpha = 1 - Math.pow(0.90, dt / 16)
        Object.keys(targetRef.current).forEach(code => {
          const cur = posRef.current[code] ?? targetRef.current[code]
          let diff  = targetRef.current[code] - cur
          if (diff < -0.5) diff += 1
          if (diff >  0.5) diff -= 1
          posRef.current[code] = ((cur + diff * alpha) + 1) % 1
        })
      }
      last = ts
      setDots(Object.entries(posRef.current).map(([code, frac]) => {
        const pt = pathRef.current.getPointAtLength(frac * tl)
        return { code, x: pt.x, y: pt.y }
      }))
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [svgPath])

  const driverMeta = { ...DRIVER_MAP }
  lapOrder.forEach(d => { if (d.driver) driverMeta[d.driver] = { ...driverMeta[d.driver], ...d, code: d.driver } })

  if (!lastRace) return null

  return (
    <div style={{ margin:'10px 14px 4px', background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.35)' }}>
            Race Replay · {lastRace.name}
          </div>
          <div style={{ fontSize:10, color: hasLiveData ? '#4CAF50' : 'rgba(255,255,255,0.35)', marginTop:1, fontFamily:"'Share Tech Mono'" }}>
            {hasLiveData ? '● Live lap data' : '● Simulated from results'}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'Share Tech Mono'", fontSize:26, fontWeight:700, color:'#fff', lineHeight:1 }}>
            {String(currentLap).padStart(2,'0')}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'rgba(255,255,255,0.35)' }}>/ {totalLaps} LAPS</div>
        </div>
      </div>

      {(isLoading || !svgPath) ? (
        <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:12, fontFamily:"'Share Tech Mono'" }}>
          Loading replay...
        </div>
      ) : (
        <div style={{ padding:'8px 4px', display:'flex', justifyContent:'center' }}>
          <svg width="100%" viewBox={viewBox} style={{ maxWidth:340 }}>
            <defs>
              <filter id="rg">
                <feGaussianBlur stdDeviation="1.5" result="cb"/>
                <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d={svgPath} fill="none" stroke="#000"    strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" opacity={0.6}/>
            <path d={svgPath} fill="none" stroke="#252525" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round"/>
            <path d={svgPath} fill="none" stroke="#333"    strokeWidth={16} strokeLinecap="round" strokeLinejoin="round"/>
            <path ref={pathRef} d={svgPath} fill="none" stroke="none" strokeWidth={0}/>
            {[...dots]
              .sort((a,b) => {
                const pa = lapOrder.findIndex(d => d.driver === a.code)
                const pb = lapOrder.findIndex(d => d.driver === b.code)
                return pb - pa
              })
              .map(({ code, x, y }) => {
                const meta   = driverMeta[code]
                if (!meta) return null
                const color  = meta.team_color || '#888'
                const posIdx = lapOrder.findIndex(d => d.driver === code)
                const posNum = posIdx + 1 || 22
                const isTop3 = posNum <= 3
                const isTop10 = posNum <= 10
                return (
                  <g key={code}>
                    {isTop3 && <circle cx={x} cy={y} r={9} fill="none" stroke={color} strokeWidth={1} opacity={0.3}/>}
                    <circle cx={x} cy={y}
                      r={isTop3 ? 6.5 : isTop10 ? 5 : 4}
                      fill={color} stroke="rgba(0,0,0,0.8)" strokeWidth={0.8}
                      filter={isTop3 ? 'url(#rg)' : undefined}
                    />
                    {isTop10 && (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                        fontFamily="'Share Tech Mono'" fontSize={isTop3 ? 6.5 : 5}
                        fontWeight={700} fill="#fff" style={{ pointerEvents:'none' }}>
                        {posNum}
                      </text>
                    )}
                  </g>
                )
              })}
          </svg>
        </div>
      )}

      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'6px 10px 10px' }}>
        <div style={{ fontSize:8, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.25)', marginBottom:5 }}>
          Running Order
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
          {lapOrder.map((d, i) => (
            <div key={d.driver} style={{ display:'flex', alignItems:'center', gap:3, minWidth:60 }}>
              <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'rgba(255,255,255,0.3)', minWidth:16, textAlign:'right' }}>{i+1}.</span>
              <div style={{ width:2, height:12, background:d.team_color||'#888', borderRadius:1, flexShrink:0 }}/>
              <span style={{ fontFamily:"'Share Tech Mono'", fontSize:10, fontWeight:700, color:d.team_color||'#ccc' }}>{d.driver}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
