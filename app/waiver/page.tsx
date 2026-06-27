'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, DollarSign, TrendingUp, Zap } from 'lucide-react'
import { ALL_PLAYERS, WAIVER_TIPS } from '@/lib/players'
import { POSITION_COLORS } from '@/lib/types'
import { getFaabBid, getScheduleLabel, getScheduleColor } from '@/lib/scoring'
import { getLeagueSettings, getRemainingFaab } from '@/lib/storage'
import type { Player } from '@/lib/types'

const PRIORITIES = ['Must Add', 'High', 'Medium', 'Speculative'] as const
type Priority = typeof PRIORITIES[number]

function getPriority(p: Player, week: number): Priority {
  if (p.injuryRisk === 'Low' && p.upside === 'Ceiling' && p.vbd > 100) return 'Must Add'
  if (p.tier <= 2 || (p.vbd > 60 && p.status === 'Active')) return 'High'
  if (p.tier <= 3) return 'Medium'
  return 'Speculative'
}

function getWaiverReason(p: Player, week: number): string {
  if (p.position === 'RB' && p.rushShare && p.rushShare > 60) return `Bell-cow usage (${p.rushShare}% rush share) makes him must-start`
  if (p.position === 'WR' && p.targetShare && p.targetShare > 22) return `Elite ${p.targetShare}% target share in ${p.team} offense`
  if (p.position === 'TE' && p.targetShare && p.targetShare > 18) return `Dominant ${p.targetShare}% TE target share`
  if (p.upside === 'Ceiling') return 'Ceiling upside — can win you a week single-handedly'
  if (p.playoffRating >= 8) return `Elite playoff schedule (${p.playoffRating}/10) — hold for Wks 15-17`
  if (p.scheduleRating >= 8) return `Extremely favorable schedule rest of season`
  if (p.injuryRisk === 'Low' && p.tier <= 3) return 'Safe floor with solid upside in featured role'
  return `Consistent producer with ${p.team} offense providing opportunity`
}

const PRIORITY_COLORS: Record<Priority, string> = {
  'Must Add': 'bg-red-900/40 text-red-300 border-red-700/50',
  'High': 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  'Medium': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  'Speculative': 'bg-slate-700/40 text-slate-300 border-slate-600/50',
}

export default function WaiverPage() {
  const [posFilter, setPosFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [week, setWeek] = useState(1)
  const [faabRemaining, setFaabRemaining] = useState(100)
  const [faabTotal, setFaabTotal] = useState(100)

  useEffect(() => {
    const s = getLeagueSettings()
    setWeek(s.currentWeek)
    setFaabTotal(s.faabBudget)
    setFaabRemaining(getRemainingFaab() || s.faabBudget)
  }, [])

  const waiverTargets = useMemo(() => {
    const candidates = ALL_PLAYERS
      .filter(p => p.tier >= 3)
      .filter(p => p.position !== 'DST' && p.position !== 'K')
      .filter(p => posFilter === 'ALL' || p.position === posFilter)
      .filter(p => {
        const q = search.toLowerCase()
        return !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      })
      .map(p => ({
        player: p,
        priority: getPriority(p, week),
        reason: getWaiverReason(p, week),
        faabBid: getFaabBid(p, faabRemaining, week),
      }))
      .filter(t => priorityFilter === 'ALL' || t.priority === priorityFilter)
      .sort((a, b) => {
        const pOrder = { 'Must Add': 0, 'High': 1, 'Medium': 2, 'Speculative': 3 }
        const pDiff = pOrder[a.priority] - pOrder[b.priority]
        if (pDiff !== 0) return pDiff
        return b.player.vbd - a.player.vbd
      })

    return candidates.slice(0, 50)
  }, [posFilter, search, priorityFilter, week, faabRemaining])

  const streamingDST = ALL_PLAYERS
    .filter(p => p.position === 'DST')
    .sort((a, b) => b.scheduleRating - a.scheduleRating)
    .slice(0, 5)

  const streamingK = ALL_PLAYERS
    .filter(p => p.position === 'K')
    .sort((a, b) => b.projPts - a.projPts)
    .slice(0, 3)

  const faabPct = Math.round((faabRemaining / faabTotal) * 100)
  const maxWeeklyBid = week <= 4 ? Math.round(faabRemaining * 0.1)
    : week <= 8 ? Math.round(faabRemaining * 0.3)
    : week <= 12 ? Math.round(faabRemaining * 0.5)
    : faabRemaining

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Waiver Wire</h1>
        <p className="text-slate-400 text-sm">Weekly targets ranked by priority and opportunity</p>
      </div>

      {/* FAAB Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-green-400" /> FAAB Budget
            </h2>
            <p className="text-slate-400 text-xs">Max single bid this week: <span className="text-amber-400 font-medium">${maxWeeklyBid}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-green-400 text-2xl font-bold">${faabRemaining}</div>
              <div className="text-slate-500 text-xs">of ${faabTotal} remaining ({faabPct}%)</div>
            </div>
            <input
              type="range"
              min={0}
              max={faabTotal}
              value={faabRemaining}
              onChange={e => setFaabRemaining(Number(e.target.value))}
              className="w-24 accent-green-500"
            />
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${faabPct > 50 ? 'bg-green-500' : faabPct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${faabPct}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Strategy: {week <= 4 ? 'Early season — spend conservatively (max 10% per player)' :
            week <= 8 ? 'Mid-early — 30% max is reasonable for impact players' :
            week <= 12 ? 'Mid-season — up to 50% for confirmed starters' :
            'Late season — spend to win, budget is less important'}
        </div>
      </div>

      {/* Week & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Week:</span>
          <select
            value={week}
            onChange={e => setWeek(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            {Array.from({ length: 17 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['ALL', 'QB', 'RB', 'WR', 'TE'].map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                posFilter === pos ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['ALL', ...PRIORITIES] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                priorityFilter === p ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Waiver Targets */}
      <div className="space-y-2">
        {waiverTargets.map(({ player: p, priority, reason, faabBid }, i) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-slate-500 font-mono text-sm w-6 text-right shrink-0 pt-0.5">{i + 1}</div>
                <div>
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                      {p.position}
                    </span>
                    <span className="text-white font-semibold">{p.name}</span>
                    <span className="text-slate-400 text-sm">{p.team}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[priority]}`}>
                      {priority}
                    </span>
                    {p.bye !== 0 && <span className="text-slate-500 text-xs">Bye Wk {p.bye}</span>}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 sm:text-right">
                <div>
                  <div className="text-green-400 font-bold">{p.projPts}</div>
                  <div className="text-slate-500 text-xs">proj pts</div>
                </div>
                <div>
                  <div className={`font-semibold ${getScheduleColor(p.playoffRating)}`}>
                    {p.playoffRating}/10
                  </div>
                  <div className="text-slate-500 text-xs">playoff sch</div>
                </div>
                <div className="bg-slate-800 rounded-lg px-3 py-2 text-center">
                  <div className="text-amber-400 font-bold text-sm">${faabBid}</div>
                  <div className="text-slate-500 text-xs">FAAB bid</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Streaming Section */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap size={16} className="text-blue-400" /> Stream DST This Week
            <span className="text-slate-500 text-xs font-normal">(never use FAAB)</span>
          </h3>
          <div className="space-y-2">
            {streamingDST.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm w-4">{i + 1}</span>
                  <span className="text-white text-sm">{p.name}</span>
                </div>
                <div className={`text-sm font-medium ${getScheduleColor(p.scheduleRating)}`}>
                  Sch: {getScheduleLabel(p.scheduleRating)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" /> Top Kickers
            <span className="text-slate-500 text-xs font-normal">(stream off waiver)</span>
          </h3>
          <div className="space-y-2">
            {streamingK.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm w-4">{i + 1}</span>
                  <span className="text-white text-sm">{p.name}</span>
                  <span className="text-slate-500 text-xs">{p.team}</span>
                </div>
                <span className="text-green-400 text-sm">{p.projPts} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 text-sm">Waiver Wire Strategy</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {WAIVER_TIPS.map((tip, i) => (
            <div key={i} className="flex gap-2 text-xs text-slate-300">
              <span className="text-green-400 font-bold shrink-0">✓</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
