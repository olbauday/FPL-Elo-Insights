import { useEffect, useMemo, useState } from 'react'
import './index.css'

type Position = 'Forward' | 'Midfielder' | 'Defender'

type Player = {
  id: string
  name: string
  team: string
  position: Position
  score: number
  price: string
  ownership: string
  form: number
  formPct: number // 0-100
  fixture: string
  difficulty: number // 1-5
  xgiPer90: number
  minutesRiskPct: number // 0, 100
  tag?: 'TOP PICK' | 'DIFFERENTIAL' | 'TEMPLATE'
  ownershipVsExpectedPct: number
}

const mockPlayers: Player[] = [
  {
    id: 'haaland', name: 'Haaland', team: 'MCI', position: 'Forward', score: 83.8,
    price: '£15.3m', ownership: '71.3%', form: 14.0, formPct: 95, fixture: 'vs BRE (H)', difficulty: 5,
    xgiPer90: 1.18, minutesRiskPct: 0, tag: 'TOP PICK', ownershipVsExpectedPct: 71
  },
  {
    id: 'luis-diaz', name: 'Luis Díaz', team: 'LIV', position: 'Midfielder', score: 74.3,
    price: '£7.9m', ownership: '29.1%', form: 12.0, formPct: 80, fixture: 'vs BOU (H)', difficulty: 3,
    xgiPer90: 0.83, minutesRiskPct: 100, tag: 'DIFFERENTIAL', ownershipVsExpectedPct: 29
  },
  {
    id: 'palmer', name: 'Palmer', team: 'CHE', position: 'Midfielder', score: 67.1,
    price: '£10.6m', ownership: '39.7%', form: 8.5, formPct: 57, fixture: 'vs WHU (A)', difficulty: 3,
    xgiPer90: 0.51, minutesRiskPct: 0, ownershipVsExpectedPct: 40
  },
  {
    id: 'watkins', name: 'Watkins', team: 'AVL', position: 'Forward', score: 62.2,
    price: '£9.0m', ownership: '28.8%', form: 6.5, formPct: 43, fixture: 'vs EVE (H)', difficulty: 3,
    xgiPer90: 0.82, minutesRiskPct: 0, ownershipVsExpectedPct: 29
  },
  {
    id: 'salah', name: 'M.Salah', team: 'LIV', position: 'Midfielder', score: 60.9,
    price: '£12.8m', ownership: '46.2%', form: 8.8, formPct: 59, fixture: 'vs BOU (H)', difficulty: 3,
    xgiPer90: 0.77, minutesRiskPct: 100, tag: 'TEMPLATE', ownershipVsExpectedPct: 46
  }
]

function Difficulty({ value }: { value: number }) {
  return (
    <div className="flex gap-[3px] mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${i < value ? 'bg-[#FF6A4D]' : 'bg-white/20'}`}
        />
      ))}
    </div>
  )
}

function Risk({ pct }: { pct: number }) {
  const color = pct >= 75 ? '#FF6A4D' : pct >= 25 ? '#F2C572' : '#02EBAE'
  const label = pct >= 75 ? 'High Risk' : pct >= 25 ? 'Medium Risk' : 'Low Risk'
  const dotClass = pct >= 75 ? 'bg-[#FF6A4D]' : pct >= 25 ? 'bg-[#F2C572]' : 'bg-[#02EBAE]'
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
      <span className="text-xs" style={{ color }}>{label}</span>
    </div>
  )
}

function StatChip({ text }: { text: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'TOP PICK': { bg: 'bg-[rgba(2,235,174,0.2)]', color: 'text-[#02EBAE]' },
    'DIFFERENTIAL': { bg: 'bg-[rgba(2,235,174,0.2)]', color: 'text-[#02EBAE]' },
    'TEMPLATE': { bg: 'bg-[rgba(2,235,174,0.2)]', color: 'text-[#02EBAE]' },
  }
  const style = map[text] ?? map['TOP PICK']
  return <div className={`px-2 py-1 rounded-xl text-[0.7rem] font-semibold text-center ${style.bg} ${style.color}`}>{text}</div>
}

function PlayerCard({ p }: { p: Player }) {
  const [selected, setSelected] = useState(false)
  return (
    <div
      onClick={() => setSelected(s => !s)}
      className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 border border-white/10 overflow-hidden backdrop-blur-xl bg-white/10 hover:bg-white/15 hover:-translate-y-2 hover:shadow-2xl ${selected ? 'scale-[1.02] border-[#FF6A4D]' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #FF6A4D, #F2C572)' }} />
      {p.tag && (
        <div className="absolute top-5 right-5 flex flex-col gap-2">
          <StatChip text={p.tag} />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-bold">{p.name}</div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <div className="w-6 h-6 rounded-full bg-[#02EBAE] flex items-center justify-center text-[10px] font-bold text-[#211F29]">{p.team}</div>
        <div className="px-3 py-1 rounded-xl text-sm font-semibold bg-[rgba(242,197,114,0.2)] text-[#F2C572]">{p.position}</div>
      </div>

      <div className="text-center my-5">
        <div className="text-6xl font-black leading-none" style={{ background: 'linear-gradient(135deg, #02EBAE, #F2C572)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{p.score.toFixed(1)}</div>
        <div className="text-sm font-semibold text-[#B0BEC5] mt-1">Captain Score</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">Price</div>
          <div className="text-lg font-bold">{p.price}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">Ownership</div>
          <div className="text-lg font-bold">{p.ownership}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">Form</div>
          <div className="text-lg font-bold">{p.form.toFixed(1)}</div>
          <div className="w-full h-[6px] bg-white/10 rounded mt-2 overflow-hidden">
            <div className="h-full" style={{ width: `${p.formPct}%`, background: 'linear-gradient(90deg, #FF6A4D, #02EBAE)' }} />
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">Fixture</div>
          <div className="text-lg font-bold">{p.fixture}</div>
          <Difficulty value={p.difficulty} />
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">xGI/90</div>
          <div className="text-lg font-bold">{p.xgiPer90.toFixed(2)}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">Minutes Risk</div>
          <div className="text-lg font-bold">{p.minutesRiskPct}%</div>
          <Risk pct={p.minutesRiskPct} />
        </div>
        <div className="col-span-2 bg-white/5 rounded-xl p-3">
          <div className="text-xs text-[#B0BEC5] font-medium mb-1">Ownership vs Expected</div>
          <div className="w-full h-2 bg-white/10 rounded relative mt-2">
            <div className="h-full rounded" style={{ width: `${p.ownershipVsExpectedPct}%`, background: '#02EBAE' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Controls({ active, onChange, onSort }: { active: 'All' | Position; onChange: (v: 'All' | Position) => void; onSort: (s: 'Score' | 'Price') => void; }) {
  const btn = (label: string, activeBtn: boolean, onClick: () => void) => (
    <button
      className={`px-4 py-2 rounded-full font-semibold backdrop-blur-lg transition-all border-2 ${activeBtn ? 'bg-[#FF6A4D] border-[#FF6A4D]' : 'bg-white/10 border-[rgba(255,106,77,0.3)] hover:bg-[rgba(255,106,77,0.2)] hover:border-[#FF6A4D] hover:-translate-y-0.5'}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
  return (
    <div className="flex justify-center gap-3 mb-8 flex-wrap">
      {btn('All', active === 'All', () => onChange('All'))}
      {btn('Forwards', active === 'Forward', () => onChange('Forward'))}
      {btn('Midfielders', active === 'Midfielder', () => onChange('Midfielder'))}
      {btn('Defenders', active === 'Defender', () => onChange('Defender'))}
      {btn('Sort by Score', false, () => onSort('Score'))}
      {btn('Sort by Price', false, () => onSort('Price'))}
    </div>
  )
}

export default function App() {
  const [filter, setFilter] = useState<'All' | Position>('All')
  const [sort, setSort] = useState<'Score' | 'Price' | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())

  useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date().toLocaleTimeString()), 30000)
    return () => clearInterval(id)
  }, [])

  const players = useMemo(() => {
    let list = [...mockPlayers]
    if (filter !== 'All') list = list.filter(p => p.position === filter)
    if (sort === 'Score') list.sort((a, b) => b.score - a.score)
    if (sort === 'Price') list.sort((a, b) => parseFloat(b.price.slice(1)) - parseFloat(a.price.slice(1)))
    return list
  }, [filter, sort])

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold" style={{ background: 'linear-gradient(135deg, #FF6A4D, #F2C572)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Captaincy Showdown</h1>
        <p className="text-[#B0BEC5] font-medium mt-2">GW5 Captain Candidates • Last Updated: {lastUpdated}</p>
      </div>

      <Controls active={filter} onChange={setFilter} onSort={setSort} />

      <button className="fixed top-5 right-5 bg-[rgba(255,106,77,0.9)] hover:bg-[#FF6A4D] text-white px-5 py-3 rounded-full font-semibold backdrop-blur-lg transition-all hover:scale-105">Compare Mode</button>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: 1400, margin: '0 auto' }}>
        {players.map(p => (
          <PlayerCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}
