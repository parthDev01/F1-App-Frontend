import { useEffect, useRef, useState } from 'react'
import { fetchCircuitPath, DEFAULT_CIRCUIT } from './circuits'

const GAP_FRACTION = {
  VER:0.000, HAM:0.048, LEC:0.080, PER:0.140, SAI:0.179,
  RUS:0.217, NOR:0.261, PIA:0.312, ALO:0.361, STR:0.431,
  ANT:0.028, GAS:0.195, TSU:0.342, ALB:0.388, OCO:0.415,
  HUL:0.452, BEA:0.468, HAD:0.482, LAW:0.495, BOR:0.510,
  DOO:0.522, COL:0.535, OWA:0.548,
}

export default function TrackMap({ drivers = [], selected, onSelectDriver, circuit = 'shanghai' }) {
  const pathRef = useRef(null)
  const animRef = useRef(null)
  const posRef  = useRef({})

  const [svgPath,   setSvgPath]   = useState(null)
  const [viewBox,   setViewBox]   = useState('0 0 500 500')
  const [isLoading, setIsLoading] = useState(true)
  const [dots,      setDots]      = useState([])

  // Fetch SVG from CDN when circuit changes
  useEffect(() => {
    setIsLoading(true)
    setSvgPath(null)
    posRef.current = {}

    fetchCircuitPath(circuit).then(result => {
      if (result) {
        setSvgPath(result.path)
        setViewBox(result.viewBox)
      } else {
        setSvgPath(DEFAULT_CIRCUIT.path)
        setViewBox(DEFAULT_CIRCUIT.viewBox)
      }
      setIsLoading(false)
    })
  }, [circuit])

  // Seed driver positions
  useEffect(() => {
    if (!drivers.length || !svgPath) return
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
  }, [drivers, svgPath])

  // Animation loop
  useEffect(() => {
    if (!svgPath || !pathRef.current) return
    const SPD = 1 / (92 * 0.55) / 60
    let last = 0

    const step = (ts) => {
      if (!pathRef.current) return
      const tl = pathRef.current.getTotalLength()
      if (!tl) { animRef.current = requestAnimationFrame(step); return }
      if (last) {
        const dt = Math.min(ts - last, 100)
        Object.keys(posRef.current).forEach(c => {
          posRef.current[c] = (posRef.current[c] + SPD * dt) % 1
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

  const dMap = Object.fromEntries(drivers.map(d => [d.driver_code, d]))

  return (
    <div style={{ background:'#111', padding:'6px 4px 4px', display:'flex', justifyContent:'center' }}>
      {isLoading ? (
        <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)', fontSize:11, fontFamily:"'Share Tech Mono'" }}>
          Loading circuit...
        </div>
      ) : (
        <svg width="100%" viewBox={viewBox} style={{ maxWidth:320 }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="cb"/>
              <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <path d={svgPath} fill="none" stroke="#000"   strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>
          <path d={svgPath} fill="none" stroke="#2a2a2a" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round"/>
          <path d={svgPath} fill="none" stroke="#383838" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round"/>
          <path ref={pathRef} d={svgPath} fill="none" stroke="none" strokeWidth={0}/>
          {[...dots]
            .sort((a,b) => (dMap[b.code]?.position||20) - (dMap[a.code]?.position||20))
            .map(({ code, x, y }) => {
              const d = dMap[code]
              if (!d) return null
              const isSel  = selected === code
              const isTop3 = d.position <= 3
              const color  = d.team_color || '#888'
              return (
                <g key={code} style={{ cursor:'pointer' }} onClick={() => onSelectDriver(code)}>
                  {isSel && (
                    <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={2} opacity={0.4}>
                      <animate attributeName="r" values="10;18;10" dur="1.8s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".5;0;.5" dur="1.8s" repeatCount="indefinite"/>
                    </circle>
                  )}
                  <circle cx={x} cy={y}
                    r={isSel ? 12 : isTop3 ? 10 : 7}
                    fill={color}
                    stroke={isSel ? '#fff' : 'rgba(0,0,0,0.7)'}
                    strokeWidth={isSel ? 2 : 1.5}
                    filter={isSel ? 'url(#glow)' : undefined}
                  />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                    fontFamily="'Share Tech Mono'"
                    fontSize={isTop3||isSel ? 10 : 8}
                    fontWeight={700} fill="#fff" style={{ pointerEvents:'none' }}>
                    {d.position}
                  </text>
                </g>
              )
            })}
        </svg>
      )}
    </div>
  )
}
