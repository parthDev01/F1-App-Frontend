import { useEffect } from 'react'
import { useStore } from './store'
import TrackMap from './components/TrackMap'
import RaceOrder from './components/RaceOrder'
import DriverDrawer from './components/DriverDrawer'
import LapChart from './components/LapChart'
import TyreStrategy from './components/TyreStrategy'
import Standings from './components/Standings'
import BetweenRaces from './components/BetweenRaces'
import { WinProbabilityBar, IncidentGauges, LiveStats, PodiumProbability } from './components/WinProbability'
import * as React from 'react'

window.React = React

const SH = ({ children, right }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 12px', fontSize:9, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', background:'#141414', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
    <span>{children}</span>
    {right && <span style={{ fontSize:8 }}>{right}</span>}
  </div>
)

const LIVE_TABS = [
  { id:'race',      label:'Race'      },
  { id:'laptimes',  label:'Lap Times' },
  { id:'tyres',     label:'Tyres'     },
  { id:'standings', label:'Standings' },
]

function LoadingScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
      <div style={{ fontSize:48, fontWeight:700, letterSpacing:'6px', color:'#E8002D', fontFamily:"'Rajdhani',sans-serif" }}>F1</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'Share Tech Mono'" }}>
        Loading race data...
      </div>
      <div style={{ display:'flex', gap:6, marginTop:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#E8002D', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

export default function App() {
  const { raceState, connected, selectedDriver, driverInsights, loadingInsights, activeTab, setTab, setSelectedDriver, connectWS } = useStore()

  useEffect(() => { connectWS() }, [])

  // Loading state — no data yet
  if (!raceState) return (
    <div style={{ background:'#0c0c0c', color:'#fff', minHeight:'100dvh', fontFamily:"'Rajdhani',sans-serif" }}>
      <div style={{ background:'#E8002D', padding:'10px 14px', paddingTop:'max(10px,env(safe-area-inset-top))' }}>
        <span style={{ fontWeight:700, fontSize:22, letterSpacing:'3px' }}>F1</span>
      </div>
      <LoadingScreen/>
    </div>
  )

  const isLive    = raceState?.is_live === true
  const isBetween = !isLive

  const drivers = raceState?.drivers || []
  const sorted  = [...drivers].sort((a,b) => a.position - b.position)
  const fastestCode = sorted.reduce((best,d) => (!best || (d.best_lap_time && d.best_lap_time < (best.best_lap_time||999))) ? d : best, null)?.driver_code
  const selectedDriverObj = drivers.find(d => d.driver_code === selectedDriver)

  const nextRace   = raceState?.next_race
  const lastRace   = raceState?.last_race
  const status     = raceState?.race_status
  const seasonRound = status?.season_round ?? lastRace?.round ?? 0
  const totalRounds = status?.total_rounds ?? 22
  const daysUntil  = raceState?.days_until_next

  return (
    <div style={{ background:'#0c0c0c', color:'#fff', minHeight:'100dvh', fontFamily:"'Rajdhani',sans-serif", display:'flex', flexDirection:'column', maxWidth:900, margin:'0 auto' }}>

      {/* Top bar */}
      <div style={{ background:'#E8002D', padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, paddingTop:'max(8px,env(safe-area-inset-top))' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, fontSize:22, letterSpacing:'3px' }}>F1</span>
          <div>
            {isLive ? (
              <>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.9)', letterSpacing:'0.8px', textTransform:'uppercase', fontWeight:600 }}>
                  {raceState?.circuit_name || 'Live Race'} · Rd {seasonRound}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>
                  {raceState?.circuit} · {raceState?.total_laps} Laps · {raceState?.weather === 'wet' ? '🌧 Wet' : '☀ Dry'} · {raceState?.track_temp}°C
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.9)', letterSpacing:'0.8px', textTransform:'uppercase', fontWeight:600 }}>
                  F1 2026 Season · {seasonRound}/{totalRounds} Races
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>
                  {nextRace
                    ? `Next: ${nextRace.name?.replace(' Grand Prix',' GP')} in ${daysUntil} days`
                    : lastRace ? `Last: ${lastRace.name}` : 'Season 2026'}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isLive && raceState?.safety_car && (
            <span style={{ fontSize:9, background:'#FF9800', color:'#000', fontWeight:700, padding:'2px 7px', borderRadius:3 }}>SC</span>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', color:'#E8002D', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:3, letterSpacing:'1px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:connected?'#E8002D':'#888', animation:connected?'blink 1s infinite':'none' }}/>
            {isLive ? 'LIVE' : connected ? 'CONNECTED' : 'CONNECTED'}
          </div>
          {isLive && (
            <span style={{ fontFamily:"'Share Tech Mono'", fontSize:12, color:'rgba(255,255,255,0.8)' }}>
              Lap {raceState?.current_lap}/{raceState?.total_laps}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar — live only */}
      {isLive && (
        <div style={{ background:'#141414', padding:'4px 12px 3px', flexShrink:0 }}>
          <div style={{ height:3, background:'#222', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#E8002D', borderRadius:2, transition:'width 1s', width:`${Math.round((raceState.current_lap/raceState.total_laps)*100)}%` }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:2, fontSize:9, fontFamily:"'Share Tech Mono'", color:'rgba(255,255,255,0.25)' }}>
            <span>LAP {raceState.current_lap}</span>
            <span>{Math.round((raceState.current_lap/raceState.total_laps)*100)}%</span>
            <span>{raceState.total_laps - raceState.current_lap} LEFT</span>
          </div>
        </div>
      )}

      {/* Tabs — live only */}
      {isLive && (
        <div style={{ display:'flex', background:'#141414', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.07)', overflowX:'auto' }}>
          {LIVE_TABS.map(tab => (
            <button key={tab.id} onClick={() => setTab(tab.id)} style={{
              background:'none', border:'none', cursor:'pointer', padding:'10px 16px',
              fontSize:12, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase',
              fontFamily:"'Rajdhani',sans-serif",
              color: activeTab===tab.id ? '#E8002D' : 'rgba(255,255,255,0.38)',
              borderBottom: activeTab===tab.id ? '2px solid #E8002D' : '2px solid transparent',
              whiteSpace:'nowrap', transition:'color 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* BETWEEN RACES */}
        {isBetween && <BetweenRaces raceState={raceState}/>}

        {/* LIVE — RACE TAB */}
        {isLive && activeTab === 'race' && (
          <div style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', flexDirection:'row', flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 300px', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' }}>
                <SH right={<span style={{ color:'#4CAF50' }}>● GPS 3Hz</span>}>Live Track Position</SH>
                <TrackMap drivers={sorted} selected={selectedDriver} onSelectDriver={setSelectedDriver} circuit={raceState?.circuit || 'shanghai'}/>
                <SH right="TAP ROW FOR INSIGHTS">Race Order</SH>
                <RaceOrder drivers={sorted} selected={selectedDriver} onSelect={setSelectedDriver} fastestLapCode={fastestCode}/>
              </div>
              <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', overflowY:'auto', maxHeight:'80vh' }}>
                <SH>Race Win Probability</SH>
                <WinProbabilityBar drivers={sorted} selected={selectedDriver} onSelect={setSelectedDriver}/>
                <SH>Incident Probability</SH>
                <IncidentGauges probabilities={raceState?.incident_probability}/>
                <SH>Live Stats</SH>
                <LiveStats drivers={sorted} raceState={raceState}/>
                <SH>Podium Probability</SH>
                <PodiumProbability drivers={sorted} onSelect={setSelectedDriver}/>
              </div>
            </div>
            <DriverDrawer driver={selectedDriverObj} insights={driverInsights} loading={loadingInsights} onClose={() => setSelectedDriver(selectedDriver)}/>
          </div>
        )}

        {isLive && activeTab === 'laptimes'  && <><SH>Lap Time Chart</SH><LapChart drivers={sorted}/></>}
        {isLive && activeTab === 'tyres'     && <><SH>Tyre Strategy</SH><TyreStrategy drivers={sorted} currentLap={raceState?.current_lap||1}/></>}
        {isLive && activeTab === 'standings' && <Standings/>}
      </div>

      <div style={{ height:'env(safe-area-inset-bottom)', background:'#0c0c0c', flexShrink:0 }}/>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px;}
      `}</style>
    </div>
  )
}
