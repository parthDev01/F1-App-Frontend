import { useEffect, useRef, useState } from 'react'
import { CIRCUITS, DEFAULT_CIRCUIT } from './circuits'

// Gap fractions around the circuit (leader at 0, each driver offset by their gap)
const GAP_FRACTION = {
  VER:0.000, HAM:0.048, LEC:0.080, PER:0.140, SAI:0.179,
  RUS:0.217, NOR:0.261, PIA:0.312, ALO:0.361, STR:0.431,
  ANT:0.028, GAS:0.195, TSU:0.342, ALB:0.388, OCO:0.415,
  HUL:0.452, MAG:0.468, BOT:0.482, ZHO:0.495, SAR:0.510,
  RIC:0.525, BEA:0.538,
}

export default function TrackMap({ drivers = [], selected, onSelectDriver, circuit = 'shanghai' }) {
  const pathRef    = useRef(null)
  const animRef    = useRef(null)
  const posRef     = useRef({})
  const [dots, setDots] = useState([])

  const cfg = CIRCUITS[circuit] || DEFAULT_CIRCUIT

  // Initialise driver positions
  useEffect(() => {
    if (!drivers.length) return
    const maxGap = Math.max(...drivers.map(d => d.gap_to_leader || 0), 60)
    drivers.forEach(d => {
      const code = d.driver_code
      if (posRef.current[code] === undefined) {
        const frac = GAP_FRACTION[code] !== undefined
          ? GAP_FRACTION[code]
          : (d.gap_to_leader || 0) / (maxGap + 30)
        posRef.current[code] = (0.55 - frac + 1) % 1
      }
    })
  }, [drivers])

  // Animate
  useEffect(() => {
    if (!pathRef.current) return
    const SPD = 1 / (92 * 0.55) / 60
    let last = 0

    const step = (ts) => {
      if (!pathRef.current) return
      const tl = pathRef.current.getTotalLength()
      if (last) {
        const dt = Math.min(ts - last, 100)
        Object.keys(posRef.current).forEach(code => {
          posRef.current[code] = (posRef.current[code] + SPD * dt) % 1
        })
      }
      last = ts
      const newDots = Object.entries(posRef.current).map(([code, frac]) => {
        const pt = pathRef.current.getPointAtLength(frac * tl)
        return { code, x: pt.x, y: pt.y }
      })
      setDots(newDots)
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [circuit])

  const driverMap = Object.fromEntries(drivers.map(d => [d.driver_code, d]))

  return (
    <div style={{ background:'#111', padding:'6px 4px 4px', display:'flex', justifyContent:'center' }}>
      <svg width="100%" viewBox={cfg.viewBox} style={{ maxWidth: 320 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Track shadow */}
        <path d={cfg.path} fill="none" stroke="#000" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>
        {/* Track surface */}
        <path d={cfg.path} fill="none" stroke="#2e2e2e" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"/>
        {/* Sector colors */}
        {(cfg.sectors || []).map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={2.5} opacity={0.4} strokeLinecap="round"/>
        ))}
        {/* DRS zones */}
        {(cfg.drs || []).map((drs, i) => (
          <line key={i} x1={drs.x1} y1={drs.y1} x2={drs.x2} y2={drs.y2}
            stroke="#00C853" strokeWidth={2.5} strokeDasharray="5 3" opacity={0.6}/>
        ))}
        {/* S/F line */}
        {cfg.sf && <line x1={cfg.sf.x1} y1={cfg.sf.y1} x2={cfg.sf.x2} y2={cfg.sf.y2}
          stroke="rgba(255,255,255,0.7)" strokeWidth={2.5}/>}
        {/* Corner labels */}
        {(cfg.corners || []).map((c, i) => (
          <text key={i} x={c.x} y={c.y} fontFamily="'Share Tech Mono'" fontSize={8} fill="rgba(255,255,255,0.25)">{c.label}</text>
        ))}
        {/* Circuit name */}
        {cfg.name_pos && (
          <text x={cfg.name_pos.x} y={cfg.name_pos.y}
            fontFamily="'Rajdhani'" fontSize={10} fill="rgba(255,255,255,0.07)"
            textAnchor="middle" fontWeight={700} letterSpacing={3}>{cfg.name}</text>
        )}
        {/* Hidden path for animation */}
        <path ref={pathRef} d={cfg.path} fill="none" stroke="none" strokeWidth={0}/>

        {/* Driver dots */}
        {[...dots]
          .sort((a,b) => (driverMap[b.code]?.position||20) - (driverMap[a.code]?.position||20))
          .map(({ code, x, y }) => {
            const d = driverMap[code]
            if (!d) return null
            const isSel  = selected === code
            const isTop3 = d.position <= 3
            const color  = d.team_color || '#888'
            return (
              <g key={code} style={{ cursor:'pointer' }} onClick={() => onSelectDriver(code)}>
                {isSel && (
                  <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4}>
                    <animate attributeName="r" values="8;14;8" dur="1.8s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values=".5;0;.5" dur="1.8s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle cx={x} cy={y}
                  r={isSel ? 9 : isTop3 ? 7.5 : 5.5}
                  fill={color}
                  stroke={isSel ? '#fff' : 'rgba(0,0,0,0.7)'}
                  strokeWidth={isSel ? 1.5 : 1}
                  filter={isSel ? 'url(#glow)' : undefined}
                />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontFamily="'Share Tech Mono'" fontSize={isTop3||isSel?7.5:6.5}
                  fontWeight={700} fill="#fff" style={{ pointerEvents:'none' }}>
                  {d.position}
                </text>
              </g>
            )
          })}
      </svg>
    </div>
  )
}
