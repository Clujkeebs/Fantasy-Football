'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, RotateCcw, Star, Check, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { ALL_PLAYERS, DRAFT_TIPS } from '@/lib/players'
import { POSITION_COLORS, TIER_LABELS } from '@/lib/types'
import type { Player, Position } from '@/lib/types'
import {
  getDraftedIds,
  saveDraftedIds,
  getMyTeamIds,
  saveMyTeamIds,
  getLeagueSettings,
} from '@/lib/storage'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const
type PosFilter = typeof POSITIONS[number]

function TierBadge({ tier }: { tier: number }) {
  const colors = ['', 'bg-amber-500/20 text-amber-300', 'bg-green-500/20 text-green-300',
    'bg-blue-500/20 text-blue-300', 'bg-slate-500/20 text-slate-300', 'bg-rose-500/20 text-rose-300']
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[tier] || colors[5]}`}>
      T{tier} {TIER_LABELS[tier]}
    </span>
  )
}

function InjuryBadge({ risk }: { risk: Player['injuryRisk'] }) {
  if (risk === 'Low') return null
  return (
    <span className={`text-xs px-1 rounded ${risk === 'High' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
      {risk === 'High' ? '⚠ High' : '~ Med'}
    </span>
  )
}

export default function DraftPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [draftedIds, setDraftedIds] = useState<Set<string>>(new Set())
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<PosFilter>('ALL')
  const [showDrafted, setShowDrafted] = useState(false)
  const [pickNum, setPickNum] = useState(1)
  const [leagueSize, setLeagueSize] = useState(12)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    const ids = getDraftedIds()
    const mine = getMyTeamIds()
    const settings = getLeagueSettings()
    setDraftedIds(ids)
    setMyTeamIds(mine)
    setPickNum(ids.size + 1)
    setLeagueSize(settings.size)
    setPlayers(ALL_PLAYERS)
    const t = setInterval(() => setTipIdx(i => (i + 1) % DRAFT_TIPS.length), 8000)
    return () => clearInterval(t)
  }, [])

  const toggle = (id: string, type: 'drafted' | 'mine') => {
    if (type === 'drafted') {
      const next = new Set(draftedIds)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      setDraftedIds(next)
      saveDraftedIds(next)
      setPickNum(next.size + 1)
    } else {
      const next = new Set(myTeamIds)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      setMyTeamIds(next)
      saveMyTeamIds(next)
      if (!draftedIds.has(id)) {
        const d = new Set(draftedIds)
        d.add(id)
        setDraftedIds(d)
        saveDraftedIds(d)
        setPickNum(d.size + 1)
      }
    }
  }

  const reset = () => {
    const empty = new Set<string>()
    setDraftedIds(empty)
    setMyTeamIds(empty)
    saveDraftedIds(empty)
    saveMyTeamIds(empty)
    setPickNum(1)
  }

  const myRound = Math.ceil(pickNum / leagueSize)
  const myPick = ((pickNum - 1) % leagueSize) + 1

  const filtered = useMemo(() => {
    return players
      .filter(p => posFilter === 'ALL' || p.position === posFilter)
      .filter(p => showDrafted || !draftedIds.has(p.id))
      .filter(p => {
        const q = search.toLowerCase()
        return !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      })
      .sort((a, b) => a.rank - b.rank)
  }, [players, posFilter, showDrafted, draftedIds, search])

  const myRoster = players.filter(p => myTeamIds.has(p.id))

  const bestAvailable = players
    .filter(p => !draftedIds.has(p.id))
    .sort((a, b) => b.vbd - a.vbd)[0]

  const positionNeeds = (() => {
    const have = myRoster.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const needs = []
    if ((have.QB || 0) < 1) needs.push('QB')
    if ((have.RB || 0) < 2) needs.push('RB')
    if ((have.WR || 0) < 2) needs.push('WR')
    if ((have.TE || 0) < 1) needs.push('TE')
    return needs
  })()

  return (
    <div className="flex h-full flex-col lg:flex-row gap-0">
      {/* Main board */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Draft Board</h1>
            <p className="text-slate-400 text-sm">Pick #{pickNum} · Round {myRound}, Pick {myPick}</p>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={showDrafted} onChange={e => setShowDrafted(e.target.checked)}
                className="accent-green-500" />
              Show drafted
            </label>
            <button onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Tip bar */}
        <div className="bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2 mb-4 text-xs text-green-300">
          <span className="text-green-500 font-semibold">Tip: </span>{DRAFT_TIPS[tipIdx]}
        </div>

        {/* Best Available recommendation */}
        {bestAvailable && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 mb-4">
            <div className="text-amber-400 text-xs font-semibold uppercase mb-1">Best Available (VBD)</div>
            <div className="flex items-center gap-3">
              <span className={`text-sm px-2 py-0.5 rounded border font-medium ${POSITION_COLORS[bestAvailable.position]}`}>
                {bestAvailable.position}
              </span>
              <span className="text-white font-bold">{bestAvailable.name}</span>
              <span className="text-slate-400 text-sm">{bestAvailable.team}</span>
              <span className="text-amber-400 text-sm font-medium">VBD: {bestAvailable.vbd}</span>
              {positionNeeds.length > 0 && !positionNeeds.includes(bestAvailable.position) && (
                <span className="text-orange-400 text-xs">Consider: {positionNeeds[0]}</span>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  posFilter === pos
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                )}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Player table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 px-3 py-2 text-xs text-slate-500 border-b border-slate-800 font-medium">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-1 hidden sm:block">Bye</div>
            <div className="col-span-1">ADP</div>
            <div className="col-span-1">Proj</div>
            <div className="col-span-1 hidden sm:block">VBD</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {filtered.map(p => {
              const isDrafted = draftedIds.has(p.id)
              const isMine = myTeamIds.has(p.id)
              const expanded = expandedId === p.id
              return (
                <div key={p.id}>
                  <div
                    className={clsx(
                      'grid grid-cols-12 px-3 py-2.5 hover:bg-slate-800/40 transition-colors cursor-pointer',
                      isDrafted && 'opacity-40'
                    )}
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                  >
                    <div className="col-span-1 text-slate-500 text-xs font-mono">{p.rank}</div>
                    <div className="col-span-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                          {p.position}
                        </span>
                        {isMine && <Star size={12} className="text-amber-400 fill-amber-400" />}
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        <span className="text-slate-500 text-xs">{p.team}</span>
                        <InjuryBadge risk={p.injuryRisk} />
                      </div>
                    </div>
                    <div className="col-span-1 hidden sm:flex items-center text-slate-400 text-xs">
                      {p.bye === 0 ? 'FA' : `Wk ${p.bye}`}
                    </div>
                    <div className="col-span-1 flex items-center text-slate-300 text-xs">{p.adp.toFixed(1)}</div>
                    <div className="col-span-1 flex items-center text-green-400 text-xs font-medium">{p.projPts}</div>
                    <div className="col-span-1 hidden sm:flex items-center text-amber-400 text-xs">{p.vbd}</div>
                    <div className="col-span-2 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggle(p.id, 'mine')}
                        title="Add to my team"
                        className={clsx(
                          'p-1.5 rounded-lg text-xs transition-colors',
                          isMine ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                        )}
                      >
                        <Star size={13} />
                      </button>
                      <button
                        onClick={() => toggle(p.id, 'drafted')}
                        title={isDrafted ? 'Undraft' : 'Mark drafted'}
                        className={clsx(
                          'p-1.5 rounded-lg text-xs transition-colors',
                          isDrafted ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                        )}
                      >
                        <Check size={13} />
                      </button>
                      {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                    </div>
                  </div>
                  {expanded && (
                    <div className="px-4 pb-3 bg-slate-800/30 border-t border-slate-800/50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Tier</div>
                          <TierBadge tier={p.tier} />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Trade Value</div>
                          <div className="text-green-400 font-medium text-sm">{p.tradeValue}/100</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Schedule</div>
                          <div className={`text-sm font-medium ${p.scheduleRating >= 7 ? 'text-green-400' : p.scheduleRating >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {p.scheduleRating}/10
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Playoff Schedule</div>
                          <div className={`text-sm font-medium ${p.playoffRating >= 7 ? 'text-green-400' : p.playoffRating >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {p.playoffRating}/10
                          </div>
                        </div>
                        {p.targetShare && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Target Share</div>
                            <div className="text-blue-400 text-sm">{p.targetShare}%</div>
                          </div>
                        )}
                        {p.rushShare && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Rush Share</div>
                            <div className="text-green-400 text-sm">{p.rushShare}%</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Upside</div>
                          <div className={`text-sm ${p.upside === 'Ceiling' ? 'text-amber-400' : p.upside === 'High' ? 'text-green-400' : 'text-slate-400'}`}>
                            {p.upside}
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mt-3 leading-relaxed">{p.notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-500">No players match your filters.</div>
            )}
          </div>
        </div>
      </div>

      {/* My Team sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 overflow-y-auto scrollbar-thin">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Star size={16} className="text-amber-400 fill-amber-400" /> My Team ({myRoster.length})
        </h2>
        {myRoster.length === 0 ? (
          <p className="text-slate-500 text-sm">Star players to add them to your team</p>
        ) : (
          <div className="space-y-2">
            {['QB', 'RB', 'WR', 'TE', 'K', 'DST'].map(pos => {
              const posPlayers = myRoster.filter(p => p.position === pos)
              if (posPlayers.length === 0) return null
              return (
                <div key={pos}>
                  <div className="text-xs text-slate-500 font-medium mb-1">{pos}</div>
                  {posPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <span className="text-white text-sm">{p.name}</span>
                      <span className="text-slate-500 text-xs">{p.team}</span>
                    </div>
                  ))}
                </div>
              )
            })}
            {positionNeeds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-xs text-orange-400 font-medium mb-2">Still need:</div>
                <div className="flex flex-wrap gap-1">
                  {positionNeeds.map(p => (
                    <span key={p} className="bg-orange-900/30 text-orange-400 text-xs px-2 py-0.5 rounded">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
