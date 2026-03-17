import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchCircuitPath, DEFAULT_CIRCUIT } from './circuits'
import RaceReplay from './RaceReplay'

const API = import.meta.env?.VITE_API_URL || 'https://f1-app-production.up.railway.app'

const FLAGS = {
  albert_park:'🇦🇺', shanghai:'🇨🇳', suzuka:'🇯🇵', miami:'🇺🇸', montreal:'🇨🇦',
  monaco:'🇲🇨', barcelona:'🇪🇸', red_bull_ring:'🇦🇹', silverstone:'🇬🇧',
  spa:'🇧🇪', hungaroring:'🇭🇺', zandvoort:'🇳🇱', monza:'🇮🇹', madrid:'🇪🇸',
  baku:'🇦🇿', singapore:'🇸🇬', austin:'🇺🇸', mexico_city:'🇲🇽',
  interlagos:'🇧🇷', las_vegas:'🇺🇸', losail:'🇶🇦', yas_marina:'🇦🇪',
}

const SH = ({children}) => (
  <div style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',padding:'5px 14px',background:'#141414',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
    {children}
  </div>
)

// ── Driver result card (expandable) ──────────────────────────────────────────
function DriverCard({driver, isExpanded, onToggle}) {
  if (!driver) return null
  return (
    <div>
      <div onClick={onToggle} style={{display:'grid',gridTemplateColumns:'28px 3px 36px 1fr 24px 50px',alignItems:'center',gap:8,padding:'8px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.04)',background:isExpanded?'rgba(255,255,255,0.04)':'transparent',transition:'background 0.15s'}}>
        <span style={{fontFamily:"'Share Tech Mono'",fontSize:13,color:driver.pos<=3?'#FFD700':'rgba(255,255,255,0.5)',textAlign:'center'}}>{driver.pos}</span>
        <div style={{width:3,height:28,background:driver.team_color||'#888',borderRadius:2}}/>
        <span style={{fontFamily:"'Share Tech Mono'",fontSize:11,fontWeight:700,color:driver.team_color||'#888'}}>{driver.driver}</span>
        <div>
          <div style={{fontWeight:700,fontSize:13,fontFamily:"'Rajdhani',sans-serif"}}>{driver.full_name}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.38)'}}>{driver.team}</div>
        </div>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',textAlign:'center'}}>{isExpanded?'▲':'▼'}</span>
        <span style={{fontFamily:"'Share Tech Mono'",fontSize:11,color:'#FFD700',textAlign:'right'}}>{driver.points}pts</span>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}}
            style={{overflow:'hidden',background:'rgba(0,0,0,0.3)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                {label:'Time / Gap', value:driver.time||'—'},
                {label:'Grid',       value:driver.grid?`P${driver.grid}`:'—'},
                {label:'Laps',       value:driver.laps||'—'},
                {label:'Team',       value:driver.team||'—'},
                {label:'Nationality',value:driver.nationality||'—'},
                {label:'Status',     value:driver.status||'Finished'},
              ].map(({label,value})=>(
                <div key={label} style={{background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'7px 9px'}}>
                  <div style={{fontSize:8,textTransform:'uppercase',letterSpacing:'1px',color:'rgba(255,255,255,0.3)',marginBottom:3}}>{label}</div>
                  <div style={{fontFamily:"'Share Tech Mono'",fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Standings driver card (expandable) ───────────────────────────────────────
function StandingsCard({driver, maxPts, isExpanded, onToggle}) {
  const pct = Math.round((driver.pts/maxPts)*100)
  return (
    <div>
      <div onClick={onToggle} style={{display:'grid',gridTemplateColumns:'28px 3px 1fr 55px 28px',alignItems:'center',gap:8,padding:'8px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.04)',background:isExpanded?'rgba(255,255,255,0.04)':'transparent',transition:'background 0.15s'}}>
        <span style={{fontFamily:"'Share Tech Mono'",fontSize:14,color:driver.pos<=3?'#FFD700':'rgba(255,255,255,0.45)',textAlign:'center'}}>{driver.pos}</span>
        <div style={{width:3,height:32,background:driver.team_color,borderRadius:2}}/>
        <div>
          <div style={{fontWeight:700,fontSize:14,fontFamily:"'Rajdhani',sans-serif"}}>{driver.full_name}</div>
          <div style={{height:3,background:'#1e1e1e',borderRadius:2,overflow:'hidden',marginTop:4}}>
            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6}}
              style={{height:'100%',background:driver.team_color,borderRadius:2,opacity:.7}}/>
          </div>
        </div>
        <span style={{fontFamily:"'Share Tech Mono'",fontSize:14,color:'#FFD700',fontWeight:700,textAlign:'right'}}>{driver.pts}</span>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',textAlign:'center'}}>{isExpanded?'▲':'▼'}</span>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}}
            style={{overflow:'hidden',background:'rgba(0,0,0,0.3)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[
                {label:'Points',     value:driver.pts},
                {label:'Wins',       value:driver.wins||0},
                {label:'Team',       value:driver.team?.split(' ')[0]||'—'},
                {label:'Nationality',value:driver.nationality||'—'},
              ].map(({label,value})=>(
                <div key={label} style={{background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'7px 9px',textAlign:'center'}}>
                  <div style={{fontSize:8,textTransform:'uppercase',letterSpacing:'1px',color:'rgba(255,255,255,0.3)',marginBottom:3}}>{label}</div>
                  <div style={{fontFamily:"'Share Tech Mono'",fontSize:14,fontWeight:700,color:driver.team_color}}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Track detail full-screen panel ───────────────────────────────────────────
function TrackDetail({race, onClose}) {
  const [history, setHistory] = useState(null)
  const [svgPath, setSvgPath] = useState(null)
  const [vBox,    setVBox]    = useState('0 0 500 500')
  const flag = FLAGS[race.circuit] || '🏁'

  // Fetch circuit SVG
  useEffect(() => {
    fetchCircuitPath(race.circuit).then(result => {
      if (result) { setSvgPath(result.path); setVBox(result.viewBox) }
      else        { setSvgPath(DEFAULT_CIRCUIT.path); setVBox(DEFAULT_CIRCUIT.viewBox) }
    })
  }, [race.circuit])

  // Fetch track history (lap record + past winners) — FIXED: useEffect not useState
  useEffect(() => {
    fetch(`${API}/api/track/${race.circuit}`)
      .then(r => r.json())
      .then(d => setHistory(d.history))
      .catch(() => setHistory({}))
  }, [race.circuit])

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:100,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
      <div style={{maxWidth:560,margin:'0 auto',paddingBottom:40}}>

        {/* Header */}
        <div style={{background:'#E8002D',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:28}}>{flag}</span>
            <div>
              <div style={{fontWeight:700,fontSize:18,fontFamily:"'Rajdhani',sans-serif",letterSpacing:'0.5px'}}>{race.name.replace(' Grand Prix',' GP')}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.75)'}}>{race.circuit_name} · Round {race.round}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(0,0,0,0.3)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',padding:'6px 12px',borderRadius:6}}>✕</button>
        </div>

        {/* Date */}
        <div style={{padding:'10px 16px',background:'#1a1a1a',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:"'Share Tech Mono'"}}>
            {new Date(race.race_date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </div>
          {race.sprint && <span style={{fontSize:10,fontWeight:700,background:'#FF9800',color:'#000',padding:'2px 8px',borderRadius:3}}>SPRINT WEEKEND</span>}
        </div>

        {/* Circuit SVG */}
        <div style={{background:'#111',padding:'16px',display:'flex',justifyContent:'center',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          {!svgPath ? (
            <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.3)',fontSize:12,fontFamily:"'Share Tech Mono'"}}>
              Loading circuit...
            </div>
          ) : (
            <svg width="100%" viewBox={vBox} style={{maxWidth:340}}>
              <path d={svgPath} fill="none" stroke="#000"    strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>
              <path d={svgPath} fill="none" stroke="#2a2a2a" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round"/>
              <path d={svgPath} fill="none" stroke="#E8002D" strokeWidth={4}  strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>
            </svg>
          )}
        </div>

        {/* Lap record */}
        {history?.lap_record && (
          <>
            <SH>Lap Record</SH>
            <div style={{padding:'10px 14px',background:'rgba(196,127,232,0.08)',border:'1px solid rgba(196,127,232,0.2)',margin:'0 14px 12px',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,fontFamily:"'Rajdhani',sans-serif"}}>{history.lap_record.driver}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.45)'}}>{history.lap_record.team} · {history.lap_record.year}</div>
              </div>
              <div style={{fontFamily:"'Share Tech Mono'",fontSize:20,fontWeight:700,color:'#c47fe8'}}>{history.lap_record.time}</div>
            </div>
          </>
        )}

        {/* Recent winners */}
        {history?.past_winners?.length > 0 && (
          <>
            <SH>Recent Winners</SH>
            {history.past_winners.slice(0,5).map((w,i)=>{
              const colors = {Mercedes:'#27F4D2',Ferrari:'#E8002D',McLaren:'#FF8000','Red Bull':'#3671C6','Red Bull Racing':'#3671C6','Aston Martin':'#358C75'}
              const color  = colors[w.team] || '#888'
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontFamily:"'Share Tech Mono'",fontSize:12,color:'#FFD700',width:36}}>{w.year}</span>
                  <div style={{width:3,height:24,background:color,borderRadius:2}}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,fontFamily:"'Rajdhani',sans-serif"}}>{w.driver}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.38)'}}>{w.team}</div>
                  </div>
                  <span style={{fontSize:16}}>{['🥇','🥈','🥉','',''][i]||''}</span>
                </div>
              )
            })}
          </>
        )}

        {/* Loading state for history */}
        {history === null && (
          <div style={{padding:'20px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:12,fontFamily:"'Share Tech Mono'"}}>
            Loading track history...
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main BetweenRaces ─────────────────────────────────────────────────────────
export default function BetweenRaces({raceState}) {
  const [activeTab,      setActiveTab]      = useState('results')
  const [expandedDriver, setExpandedDriver] = useState(null)
  const [selectedTrack,  setSelectedTrack]  = useState(null)

  const lastRace     = raceState?.last_race
  const nextRace     = raceState?.next_race
  const daysUntil    = raceState?.days_until_next
  const standings    = raceState?.standings    || []
  const constructors = raceState?.constructors || []
  const calendar     = raceState?.calendar     || []
  const lastRound    = lastRace?.round || 0
  const maxPts       = standings[0]?.pts || 1

  const TABS = [
    {id:'results',   label:'Last Race'},
    {id:'standings', label:'Standings'},
    {id:'calendar',  label:'Calendar'},
  ]

  return (
    <div>
      <AnimatePresence>
        {selectedTrack && (
          <TrackDetail race={selectedTrack} onClose={() => setSelectedTrack(null)}/>
        )}
      </AnimatePresence>

      {/* Next race card */}
      {nextRace && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{margin:'14px 14px 0',background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
          <div style={{background:'#E8002D',padding:'7px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700,fontSize:12,letterSpacing:'1px',textTransform:'uppercase'}}>Next Race</span>
            <span style={{fontFamily:"'Share Tech Mono'",fontSize:11}}>Round {nextRace.round}</span>
          </div>
          <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:36}}>{FLAGS[nextRace.circuit]||'🏁'}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:18,fontFamily:"'Rajdhani',sans-serif"}}>{nextRace.name}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>{nextRace.circuit_name}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>
                {new Date(nextRace.race_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long'})}
                {nextRace.sprint && <span style={{marginLeft:8,background:'#FF9800',color:'#000',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3}}>SPRINT</span>}
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:"'Share Tech Mono'",fontSize:38,fontWeight:700,color:'#E8002D',lineHeight:1}}>{daysUntil}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.38)',textTransform:'uppercase',letterSpacing:'1px'}}>days</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Race Replay */}
      <RaceReplay lastRace={lastRace}/>

      {/* Last race summary */}
      {lastRace && (
        <div style={{margin:'10px 14px 12px',background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,0.35)',marginBottom:3}}>Last Race · Round {lastRace.round}</div>
            <div style={{fontWeight:700,fontSize:16,fontFamily:"'Rajdhani',sans-serif"}}>{lastRace.name}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{lastRace.date} · {lastRace.circuit_name}</div>
          </div>
          {lastRace.fastest_lap && (
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:9,color:'#c47fe8',textTransform:'uppercase',letterSpacing:'1px'}}>⚡ Fastest Lap</div>
              <div style={{fontFamily:"'Share Tech Mono'",fontSize:12,color:'#c47fe8'}}>{lastRace.fastest_lap.driver}</div>
              <div style={{fontFamily:"'Share Tech Mono'",fontSize:11,color:'rgba(255,255,255,0.4)'}}>{lastRace.fastest_lap.time}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',overflowX:'auto'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background:'none',border:'none',cursor:'pointer',padding:'9px 16px',
            fontSize:12,fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',
            fontFamily:"'Rajdhani',sans-serif",
            color:activeTab===t.id?'#E8002D':'rgba(255,255,255,0.38)',
            borderBottom:activeTab===t.id?'2px solid #E8002D':'2px solid transparent',
            whiteSpace:'nowrap',transition:'color 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* LAST RACE */}
      {activeTab === 'results' && lastRace && (
        <>
          <SH>Race Results — All Drivers</SH>
          {(lastRace.results||[]).map(d => (
            <DriverCard key={d.driver} driver={d}
              isExpanded={expandedDriver===`r-${d.driver}`}
              onToggle={() => setExpandedDriver(expandedDriver===`r-${d.driver}`?null:`r-${d.driver}`)}/>
          ))}
        </>
      )}

      {/* STANDINGS */}
      {activeTab === 'standings' && (
        <>
          <SH>Drivers Championship</SH>
          {standings.map(d => (
            <StandingsCard key={d.driver} driver={d} maxPts={maxPts}
              isExpanded={expandedDriver===`s-${d.driver}`}
              onToggle={() => setExpandedDriver(expandedDriver===`s-${d.driver}`?null:`s-${d.driver}`)}/>
          ))}
          <SH>Constructors Championship</SH>
          {constructors.map((c,i) => {
            const max = constructors[0]?.pts||1
            return (
              <div key={c.team} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <span style={{fontFamily:"'Share Tech Mono'",fontSize:13,width:20,color:'rgba(255,255,255,0.4)',textAlign:'center'}}>{c.pos}</span>
                <div style={{width:3,height:24,background:c.color,borderRadius:2}}/>
                <span style={{fontWeight:700,fontSize:14,fontFamily:"'Rajdhani',sans-serif",flex:1}}>{c.team}</span>
                <div style={{width:80,height:3,background:'#1e1e1e',borderRadius:2,overflow:'hidden',marginRight:8}}>
                  <motion.div initial={{width:0}} animate={{width:`${(c.pts/max)*100}%`}} transition={{duration:0.6,delay:i*0.05}}
                    style={{height:'100%',background:c.color,borderRadius:2,opacity:.75}}/>
                </div>
                <span style={{fontFamily:"'Share Tech Mono'",fontSize:13,color:'#FFD700',width:35,textAlign:'right'}}>{c.pts}</span>
              </div>
            )
          })}
        </>
      )}

      {/* CALENDAR */}
      {activeTab === 'calendar' && (
        <>
          <SH>2026 Season · 22 Rounds · Tap for circuit details</SH>
          {calendar.map((race,i) => {
            const done = race.round <= lastRound
            const next = race.round === lastRound + 1
            return (
              <motion.div key={race.round}
                initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                onClick={() => setSelectedTrack(race)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',opacity:done?0.45:1,background:next?'rgba(232,0,45,0.07)':'transparent',transition:'background 0.15s'}}>
                <span style={{fontFamily:"'Share Tech Mono'",fontSize:11,color:'rgba(255,255,255,0.28)',width:20,textAlign:'center'}}>{race.round}</span>
                <span style={{fontSize:18}}>{FLAGS[race.circuit]||'🏁'}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:"'Rajdhani',sans-serif"}}>
                    {race.name.replace(' Grand Prix',' GP')}
                    {race.sprint && <span style={{marginLeft:6,fontSize:9,fontWeight:700,background:'#FF9800',color:'#000',padding:'1px 5px',borderRadius:3}}>S</span>}
                  </div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.32)'}}>{race.city} · {race.circuit_name}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:"'Share Tech Mono'",fontSize:10,color:'rgba(255,255,255,0.32)'}}>
                    {new Date(race.race_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                  </div>
                  <div style={{fontSize:11,marginTop:2}}>{done?'✓':next?'▶':'›'}</div>
                </div>
              </motion.div>
            )
          })}
        </>
      )}

      <div style={{height:40}}/>
    </div>
  )
}
