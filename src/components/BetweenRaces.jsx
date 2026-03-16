import { motion } from 'framer-motion'

const CIRCUIT_FLAGS = {
  australia:'🇦🇺', china:'🇨🇳', japan:'🇯🇵', miami:'🇺🇸', montreal:'🇨🇦',
  monaco:'🇲🇨', barcelona:'🇪🇸', red_bull_ring:'🇦🇹', silverstone:'🇬🇧',
  spa:'🇧🇪', hungaroring:'🇭🇺', zandvoort:'🇳🇱', monza:'🇮🇹', madrid:'🇪🇸',
  baku:'🇦🇿', singapore:'🇸🇬', austin:'🇺🇸', mexico_city:'🇲🇽',
  interlagos:'🇧🇷', las_vegas:'🇺🇸', losail:'🇶🇦', yas_marina:'🇦🇪', albert_park:'🇦🇺', shanghai:'🇨🇳',
}

function Podium({ results = [] }) {
  const top3 = results.slice(0, 3)
  const medals = ['🥇','🥈','🥉']
  return (
    <div style={{ padding: '10px 14px' }}>
      {top3.map((r, i) => (
        <motion.div key={r.driver}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 20 }}>{medals[i]}</span>
          <div style={{ width: 3, height: 32, background: r.team_color, borderRadius: 2 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Rajdhani',sans-serif" }}>{r.full_name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.team}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: i === 0 ? '#FFD700' : 'rgba(255,255,255,0.7)' }}>
              {r.time || r.pts + ' pts'}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function FullResults({ results = [] }) {
  return (
    <div style={{ padding: '0 0 8px' }}>
      {results.map((r, i) => (
        <div key={r.driver} style={{
          display: 'grid', gridTemplateColumns: '28px 3px 1fr 40px',
          gap: 8, alignItems: 'center',
          padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: i < 3 ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>{r.pos}</span>
          <div style={{ width: 3, height: 24, background: r.team_color, borderRadius: 2 }}/>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Rajdhani',sans-serif" }}>{r.driver}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>{r.team?.split(' ')[0]}</span>
          </div>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: '#FFD700', textAlign: 'right' }}>{r.points}pts</span>
        </div>
      ))}
    </div>
  )
}

function NextRaceCard({ nextRace, daysUntil }) {
  if (!nextRace) return null
  const flag = CIRCUIT_FLAGS[nextRace.circuit] || '🏁'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ margin: '0 14px 14px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#E8002D', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase' }}>Next Race</span>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11 }}>Round {nextRace.round}</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 36 }}>{flag}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Rajdhani',sans-serif" }}>{nextRace.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{nextRace.circuit_name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {new Date(nextRace.race_date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long' })}
            {nextRace.sprint && <span style={{ marginLeft: 8, background: '#FF9800', color: '#000', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>SPRINT</span>}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 32, fontWeight: 700, color: '#E8002D', lineHeight: 1 }}>{daysUntil}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>days</div>
        </div>
      </div>
    </motion.div>
  )
}

function Standings({ drivers = [], constructors = [] }) {
  return (
    <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 200px' }}>
        <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', padding: '5px 14px', background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          Drivers
        </div>
        {drivers.slice(0, 10).map((d, i) => (
          <div key={d.driver} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, width: 18, color: i < 3 ? '#FFD700' : 'rgba(255,255,255,0.4)' }}>{d.pos}</span>
            <div style={{ width: 3, height: 20, background: d.team_color, borderRadius: 2 }}/>
            <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Rajdhani',sans-serif", flex: 1 }}>{d.driver}</span>
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, color: '#FFD700' }}>{d.pts}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: '1 1 180px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', padding: '5px 14px', background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          Constructors
        </div>
        {constructors.map((c, i) => {
          const max = constructors[0]?.pts || 1
          return (
            <div key={c.team} style={{ padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, width: 18, color: 'rgba(255,255,255,0.4)' }}>{c.pos}</span>
                <div style={{ width: 3, height: 16, background: c.color, borderRadius: 2 }}/>
                <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "'Rajdhani',sans-serif", flex: 1 }}>{c.team.split(' ')[0]}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: '#FFD700' }}>{c.pts}</span>
              </div>
              <div style={{ height: 2, background: '#1e1e1e', borderRadius: 1, overflow: 'hidden', marginLeft: 26 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(c.pts/max)*100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                  style={{ height: '100%', background: c.color, borderRadius: 1 }}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Calendar({ calendar = [], lastRound = 0 }) {
  return (
    <div style={{ padding: '0 0 40px' }}>
      {calendar.map((race, i) => {
        const done = race.round <= lastRound
        const next = race.round === lastRound + 1
        return (
          <div key={race.round} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            opacity: done ? 0.45 : 1,
            background: next ? 'rgba(232,0,45,0.07)' : 'transparent',
          }}>
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 20 }}>{race.round}</span>
            <span style={{ fontSize: 16 }}>{CIRCUIT_FLAGS[race.circuit] || '🏁'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Rajdhani',sans-serif" }}>
                {race.name.replace(' Grand Prix', ' GP')}
                {race.sprint && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, background: '#FF9800', color: '#000', padding: '1px 4px', borderRadius: 2 }}>S</span>}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{race.city}</div>
            </div>
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              {new Date(race.race_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
            </span>
            {done && <span style={{ fontSize: 11 }}>✓</span>}
            {next && <span style={{ color: '#E8002D', fontSize: 11 }}>▶</span>}
          </div>
        )
      })}
    </div>
  )
}

const SH = ({ children }) => (
  <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', padding: '5px 14px', background: '#141414', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    {children}
  </div>
)

export default function BetweenRaces({ raceState }) {
  const lastRace   = raceState?.last_race
  const nextRace   = raceState?.next_race
  const daysUntil  = raceState?.days_until_next
  const standings  = raceState?.standings || []
  const constructors = raceState?.constructors || []
  const calendar   = raceState?.calendar || []
  const lastRound  = lastRace?.round || 0
  const [tab, setTab] = window._btTabs || ['results', () => {}]

  const TABS = [
    { id: 'results',    label: 'Last Race' },
    { id: 'standings',  label: 'Standings' },
    { id: 'calendar',   label: 'Calendar'  },
  ]

  const [activeTab, setActiveTab] = window.React.useState('results')

  return (
    <div>
      {/* Next race hero */}
      <div style={{ padding: '14px 14px 0' }}>
        <NextRaceCard nextRace={nextRace} daysUntil={daysUntil}/>
      </div>

      {/* Last race header */}
      {lastRace && (
        <div style={{ margin: '0 14px 12px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Last Race · Round {lastRace.round}</div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Rajdhani',sans-serif" }}>{lastRace.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{lastRace.date} · {lastRace.circuit_name}</div>
          </div>
          {lastRace.fastest_lap && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#c47fe8', textTransform: 'uppercase', letterSpacing: '1px' }}>Fastest Lap</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, color: '#c47fe8' }}>{lastRace.fastest_lap.driver}</div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{lastRace.fastest_lap.time}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '9px 16px',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
            fontFamily: "'Rajdhani',sans-serif",
            color: activeTab === t.id ? '#E8002D' : 'rgba(255,255,255,0.38)',
            borderBottom: activeTab === t.id ? '2px solid #E8002D' : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'color 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'results' && lastRace && (
        <>
          <SH>Podium</SH>
          <Podium results={lastRace.podium || lastRace.results}/>
          <SH>Full Results</SH>
          <FullResults results={lastRace.results || []}/>
        </>
      )}
      {activeTab === 'standings' && (
        <Standings drivers={standings} constructors={constructors}/>
      )}
      {activeTab === 'calendar' && (
        <>
          <SH>2026 Season · 22 Rounds</SH>
          <Calendar calendar={calendar} lastRound={lastRound}/>
        </>
      )}
    </div>
  )
}
