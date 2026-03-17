import { useEffect, useRef, useState } from 'react'
import { fetchCircuitPath, DEFAULT_CIRCUIT } from './circuits'

const API = import.meta.env?.VITE_API_URL || 'https://f1-app-production.up.railway.app'

// 3 seconds per lap — feels like a proper replay
const SECONDS_PER_LAP = 3

const DRIVERS_2026 = [
  { code:'RUS', full_name:'George Russell',    team:'Mercedes',        team_color:'#27F4D2' },
  { code:'ANT', full_name:'Kimi Antonelli',     team:'Mercedes',        team_color:'#27F4D2' },
  { code:'HAM', full_name:'Lewis Hamilton',     team:'Ferrari',         team_color:'#E8002D' },
  { code:'LEC', full_name:'Charles Leclerc',    team:'Ferrari',         team_color:'#E8002D' },
  { code:'VER', full_name:'Max Verstappen',     team:'Red Bull Racing', team_color:'#3671C6' },
  { code:'TSU', full_name:'Yuki Tsunoda',       team:'Red Bull Racing', team_color:'#3671C6' },
  { code:'NOR', full_name:'Lando Norris',       team:'McLaren',         team_color:'#FF8000' },
  { code:'PIA', full_name:'Oscar Piastri',      team:'McLaren',         team_color:'#FF8000' },
  { code:'ALO', full_name:'Fernando Alonso',    team:'Aston Martin',    team_color:'#358C75' },
  { code:'STR', full_name:'Lance Stroll',       team:'Aston Martin',    team_color:'#358C75' },
  { code:'GAS', full_name:'Pierre Gasly',       team:'Alpine',          team_color:'#0093CC' },
  { code:'DOO', full_name:'Jack Doohan',        team:'Alpine',          team_color:'#0093CC' },
  { code:'ALB', full_name:'Alexander Albon',    team:'Williams',        team_color:'#005AFF' },
  { code:'SAI', full_name:'Carlos Sainz',       team:'Williams',        team_color:'#005AFF' },
  { code:'OCO', full_name:'Esteban Ocon',       team:'Haas',            team_color:'#B6BABD' },
  { code:'BEA', full_name:'Oliver Bearman',     team:'Haas',            team_color:'#B6BABD' },
  { code:'HAD', full_name:'Isack Hadjar',       team:'Racing Bulls',    team_color:'#5E8FAA' },
  { code:'LAW', full_name:'Liam Lawson',        team:'Racing Bulls',    team_color:'#5E8FAA' },
  { code:'HUL', full_name:'Nico Hulkenberg',    team:'Audi',            team_color:'#C6C6C6' },
  { code:'BOR', full_name:'Gabriel Bortoleto',  team:'Audi',            team_color:'#C6C6C6' },
  { code:'COL', full_name:'Franco Colapinto',   team:'GM Andretti',     team_color:'#E6003A' },
  { code:'OWA', full_name:'Jak Crawford',       team:'GM Andretti',     team_color:'#E6003A' },
]
const DRIVER_MAP = Object.fromEntries(DRIVERS_2026.map(d => [d.code, d]))

/**
 * Build synthetic lap-by-lap positions for all 22 drivers across all laps.
 * Uses final race results as the settled order, with realistic early-lap chaos.
 */
function buildSyntheticLaps(results, totalLaps) {
  // Build final order: race results first, then remaining 2026 drivers
  const resultMap = {}
  ;(results || []).forEach(r => { resultMap[r.driver] = r })

  const finalOrder = []
  ;(results || []).forEach(r => {
    finalOrder.push({ ...DRIVER_MAP[r.driver], ...r, driver: r.driver })
  })
  DRIVERS_2026.forEach(d => {
    if (!finalOrder.find(f => f.driver === d.code || f.code === d.code)) {
      finalOrder.push({ ...d, driver: d.code, position: finalOrder.length + 1, points: 0 })
    }
  })

  const laps = {}
  for (let lap = 1; lap <= totalLaps; lap++) {
    const progress = Math.min(lap / 15, 1) // chaos settles by lap 15
    laps[lap] = finalOrder.map((d, i) => {
      let pos = i + 1
      if (lap <= 15) {
        // Diminishing chaos as race settles
        const chaos = Math.sin(lap * 2.7 + i * 1.9) * (3 * (1 - progress))
        pos = Math.max(1, Math.min(finalOrder.length, Math.round(pos + chaos)))
      }
      return {
        driver:     d.driver || d.code,
        position:   pos,
        team_color: d.team_color || '#888',
        full_name:  d.full_name || d.driver,
        team:       d.team || '',
      }
    })
    // Fix duplicate positions
    laps[lap].sort((a, b) => a.position - b.position)
    laps[lap] = laps[lap].map((d, i) => ({ ...d, position: i + 1 }))
  }
  return laps
}

export default function RaceReplay({ lastRace }) {
  const svgRef        = useRef(null)   // the hidden <path> used for getTotalLength
  const animRef       = useRef(null)
  const startTimeRef  = useRef(null)
  const totalLenRef   = useRef(0)
  const lapsDataRef   = useRef({})

  const [svgPath,     setSvgPath]     = useState(null)
  const [viewBox,     setViewBox]     = useState('0 0 500 500')
  const [totalLaps,   setTotalLaps]   = useState(56)
  const [currentLap,  setCurrentLap]  = useState(1)
  const [lapOrder,    setLapOrder]    = useState([])   // sorted order for current lap
  const [dots,        setDots]        = useState([])
  const [ready,       setReady]       = useState(false)
  const [hasLiveData, setHasLiveData] = useState(false)

  const circuit = lastRace?.circuit || 'shanghai'

  // Step 1: Fetch SVG path from CDN
  useEffect(() => {
    setReady(false)
    setSvgPath(null)
    fetchCircuitPath(circuit).then(result => {
      if (result) { setSvgPath(result.path); setViewBox(result.viewBox) }
      else        { setSvgPath(DEFAULT_CIRCUIT.path); setViewBox(DEFAULT_CIRCUIT.viewBox) }
    })
  }, [circuit])

  // Step 2: Fetch lap data from API
  useEffect(() => {
    if (!lastRace) return
    fetch(`${API}/api/last-race/replay`)
      .then(r => r.json())
      .then(data => {
        const total = data.total_laps || lastRace?.total_laps || 56
        setTotalLaps(total)
        setHasLiveData(data.has_live_data)

        // Use live data only if it covers the full race (at least 90% of laps)
        const liveLaps  = data.laps ? Object.keys(data.laps).length : 0
        const useLive   = data.has_live_data && liveLaps >= Math.round(total * 0.9)
        setHasLiveData(useLive)

        let lapMap = useLive ? data.laps : buildSyntheticLaps(lastRace?.results, total)

        // Ensure keys are integers
        const norm = {}
        Object.entries(lapMap).forEach(([k, v]) => { norm[parseInt(k)] = v })

        // If live data is sparse, fill gaps with synthetic
        if (Object.keys(norm).length < total) {
          const synthetic = buildSyntheticLaps(lastRace?.results, total)
          Object.entries(synthetic).forEach(([k, v]) => {
            if (!norm[parseInt(k)]) norm[parseInt(k)] = v
          })
        }

        lapsDataRef.current = norm
        // Set initial lap order from lap 1
        const lap1 = norm[1] || []
        const enriched = enrichDrivers(lap1)
        setLapOrder(enriched)
      })
      .catch(() => {
        const total = lastRace?.total_laps || 56
        const synthetic = buildSyntheticLaps(lastRace?.results, total)
        lapsDataRef.current = synthetic
        setTotalLaps(total)
        setLapOrder(enrichDrivers(synthetic[1] || []))
      })
  }, [lastRace?.round])

  // Step 3: Once both SVG path and lap data are ready, start animation
  useEffect(() => {
    if (svgPath && Object.keys(lapsDataRef.current).length > 0) {
      setReady(true)
    }
  }, [svgPath, lapOrder])

  function enrichDrivers(lapDrivers) {
    const all = lapDrivers.map(d => ({
      ...d,
      team_color: d.team_color || DRIVER_MAP[d.driver]?.team_color || '#888',
      full_name:  d.full_name  || DRIVER_MAP[d.driver]?.full_name  || d.driver,
    }))
    // Ensure all 22 drivers present
    DRIVERS_2026.forEach(d => {
      if (!all.find(x => x.driver === d.code)) {
        all.push({ driver:d.code, position:all.length+1, team_color:d.team_color, full_name:d.full_name, team:d.team })
      }
    })
    return all
  }

  /**
   * Core animation: each driver moves continuously around the track.
   * 
   * Position on track = (lapFraction + positionOffset) % 1
   * where lapFraction goes 0→1 over SECONDS_PER_LAP seconds,
   * and positionOffset staggers each driver behind the leader.
   * 
   * Every SECONDS_PER_LAP seconds = 1 lap completed → update lap counter + order.
   */
  useEffect(() => {
    if (!ready || !svgRef.current) return

    totalLenRef.current = svgRef.current.getTotalLength()
    if (!totalLenRef.current) return

    startTimeRef.current = performance.now()
    const lapMs   = SECONDS_PER_LAP * 1000
    const laps    = lapsDataRef.current
    const lapKeys = Object.keys(laps).map(Number).sort((a, b) => a - b)
    const total   = totalLaps

    let prevLapIdx = -1

    const frame = (now) => {
      const elapsed   = now - startTimeRef.current
      // Which "cycle" of the race are we on (loops after full race)
      const totalMs   = total * lapMs
      const cycleMs   = elapsed % totalMs
      const lapFloat  = cycleMs / lapMs          // 0 → total (float laps completed)
      const lapFrac   = (lapFloat % 1)           // 0→1 within current lap
      const lapIdx    = Math.floor(lapFloat) % total  // 0-based lap index in race
      const lapNum    = lapKeys[lapIdx] ?? (lapIdx + 1)

      // Update lap counter and running order when lap changes
      if (lapIdx !== prevLapIdx) {
        prevLapIdx = lapIdx
        setCurrentLap(lapNum)
        const lapDrivers = laps[lapNum] || laps[lapKeys[lapIdx % lapKeys.length]] || []
        setLapOrder(enrichDrivers(lapDrivers))
      }

      // Get current lap order for positioning
      const lapDrivers = laps[lapNum] || laps[lapKeys[lapIdx % lapKeys.length]] || []
      const order = enrichDrivers(lapDrivers)

      // Compute dot positions:
      // Leader (pos 1) is at lapFrac around the track.
      // Each subsequent car is spaced 0.025 fracs behind.
      const GAP_PER_POS = 0.025
      const leaderFrac = lapFrac

      const newDots = order.map((d, i) => {
        const frac = ((leaderFrac - i * GAP_PER_POS) + 10) % 1
        const dist = frac * totalLenRef.current
        const pt   = svgRef.current.getPointAtLength(dist)
        return { code: d.driver, x: pt.x, y: pt.y, pos: i + 1 }
      })

      setDots(newDots)
      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, [ready, totalLaps])

  if (!lastRace) return null

  return (
    <div style={{ margin:'10px 14px 4px', background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.35)' }}>
            Race Replay · {lastRace.name}
          </div>
          <div style={{ fontSize:10, color:hasLiveData?'#4CAF50':'rgba(255,255,255,0.35)', marginTop:1, fontFamily:"'Share Tech Mono'" }}>
            {hasLiveData ? '● Live lap data' : '● Simulated positions'}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'Share Tech Mono'", fontSize:26, fontWeight:700, color:'#fff', lineHeight:1 }}>
            {String(currentLap).padStart(2,'0')}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'rgba(255,255,255,0.35)' }}>
            / {totalLaps} LAPS
          </div>
        </div>
      </div>

      {/* Track SVG */}
      {!svgPath ? (
        <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:12, fontFamily:"'Share Tech Mono'" }}>
          Loading circuit...
        </div>
      ) : (
        <div style={{ padding:'8px 4px', display:'flex', justifyContent:'center', position:'relative' }}>
          <svg width="100%" viewBox={viewBox} style={{ maxWidth:340 }}>
            <defs>
              <filter id="rg">
                <feGaussianBlur stdDeviation="1.5" result="cb"/>
                <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Track layers */}
            <path d={svgPath} fill="none" stroke="#000"    strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" opacity={0.6}/>
            <path d={svgPath} fill="none" stroke="#252525" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round"/>
            <path d={svgPath} fill="none" stroke="#333"    strokeWidth={16} strokeLinecap="round" strokeLinejoin="round"/>

            {/* Hidden path for animation measurements */}
            <path ref={svgRef} d={svgPath} fill="none" stroke="none" strokeWidth={0}/>

            {/* Loading overlay */}
            {!ready && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                fontFamily="'Share Tech Mono'" fontSize={12} fill="rgba(255,255,255,0.3)">
                Loading...
              </text>
            )}

            {/* Driver dots — render back-of-grid first so P1 is on top */}
            {[...dots]
              .sort((a, b) => b.pos - a.pos)
              .map(({ code, x, y, pos }) => {
                const meta   = DRIVER_MAP[code] || lapOrder.find(d => d.driver === code) || {}
                const color  = meta.team_color || '#888'
                const isTop3 = pos <= 3
                const isTop10 = pos <= 10
                return (
                  <g key={code}>
                    {isTop3 && (
                      <circle cx={x} cy={y} r={9} fill="none" stroke={color} strokeWidth={1} opacity={0.25}/>
                    )}
                    <circle
                      cx={x} cy={y}
                      r={isTop3 ? 6.5 : isTop10 ? 5 : 3.5}
                      fill={color}
                      stroke="rgba(0,0,0,0.75)"
                      strokeWidth={0.75}
                      filter={isTop3 ? 'url(#rg)' : undefined}
                    />
                    {isTop10 && (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                        fontFamily="'Share Tech Mono'"
                        fontSize={isTop3 ? 6.5 : 5}
                        fontWeight={700} fill="#fff"
                        style={{ pointerEvents:'none' }}>
                        {pos}
                      </text>
                    )}
                  </g>
                )
              })}
          </svg>
        </div>
      )}

      {/* Running order */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'6px 10px 10px' }}>
        <div style={{ fontSize:8, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.25)', marginBottom:5 }}>
          Running Order
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
          {lapOrder.map((d, i) => (
            <div key={d.driver} style={{ display:'flex', alignItems:'center', gap:3, minWidth:58 }}>
              <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'rgba(255,255,255,0.28)', minWidth:16, textAlign:'right' }}>{i+1}.</span>
              <div style={{ width:2, height:12, background:d.team_color||'#888', borderRadius:1, flexShrink:0 }}/>
              <span style={{ fontFamily:"'Share Tech Mono'", fontSize:10, fontWeight:700, color:d.team_color||'#ccc' }}>{d.driver}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
