'use client'

import { useState, useMemo } from 'react'
import { Search, X, ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ALL_PLAYERS } from '@/lib/players'
import { POSITION_COLORS } from '@/lib/types'
import { analyzeTrade } from '@/lib/scoring'
import type { Player } from '@/lib/types'

function PlayerSearch({
  label,
  selected,
  onAdd,
  onRemove,
}: {
  label: string
  selected: Player[]
  onAdd: (p: Player) => void
  onRemove: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return ALL_PLAYERS.filter(
      p => !selected.find(s => s.id === p.id) &&
        (p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [query, selected])

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-slate-300 font-semibold text-sm mb-3 uppercase tracking-wide">{label}</h3>
      <div className="space-y-2 mb-3 min-h-[80px]">
        {selected.length === 0 ? (
          <div className="text-slate-500 text-sm py-4 text-center border border-dashed border-slate-700 rounded-lg">
            Search and add players
          </div>
        ) : (
          selected.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                  {p.position}
                </span>
                <span className="text-white text-sm">{p.name}</span>
                <span className="text-slate-400 text-xs">{p.team}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xs font-medium">{p.tradeValue}</span>
                <button onClick={() => onRemove(p.id)} className="text-slate-500 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search players to add..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500"
        />
      </div>
      {results.length > 0 && (
        <div className="mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl z-10">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onAdd(p); setQuery('') }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                  {p.position}
                </span>
                <span className="text-white text-sm">{p.name}</span>
                <span className="text-slate-400 text-xs">{p.team}</span>
              </div>
              <span className="text-green-400 text-xs">{p.tradeValue}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const GRADE_STYLES: Record<string, string> = {
  A: 'text-green-400 bg-green-900/40 border-green-600',
  B: 'text-lime-400 bg-lime-900/40 border-lime-600',
  C: 'text-yellow-400 bg-yellow-900/40 border-yellow-600',
  D: 'text-orange-400 bg-orange-900/40 border-orange-600',
  F: 'text-red-400 bg-red-900/40 border-red-600',
}

export default function TradesPage() {
  const [giving, setGiving] = useState<Player[]>([])
  const [getting, setGetting] = useState<Player[]>([])

  const analysis = useMemo(() => {
    if (giving.length === 0 && getting.length === 0) return null
    return analyzeTrade(giving, getting)
  }, [giving, getting])

  const addGiving = (p: Player) => setGiving(prev => [...prev, p])
  const removeGiving = (id: string) => setGiving(prev => prev.filter(p => p.id !== id))
  const addGetting = (p: Player) => setGetting(prev => [...prev, p])
  const removeGetting = (id: string) => setGetting(prev => prev.filter(p => p.id !== id))

  const reset = () => { setGiving([]); setGetting([]) }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Analyzer</h1>
          <p className="text-slate-400 text-sm">Calculate trade value using positional scarcity</p>
        </div>
        {(giving.length > 0 || getting.length > 0) && (
          <button onClick={reset} className="text-sm text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-lg">
            Clear All
          </button>
        )}
      </div>

      {/* Trade Builder */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <PlayerSearch label="You Give Away" selected={giving} onAdd={addGiving} onRemove={removeGiving} />
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <ArrowLeftRight size={18} className="text-slate-300" />
            </div>
          </div>
          <PlayerSearch label="You Receive" selected={getting} onAdd={addGetting} onRemove={removeGetting} />
        </div>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="space-y-4">
          {/* Grade card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shrink-0 ${GRADE_STYLES[analysis.grade]}`}>
                <span className="text-4xl font-black">{analysis.grade}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {analysis.verdict === 'WIN' ? (
                    <TrendingUp size={20} className="text-green-400" />
                  ) : analysis.verdict === 'LOSE' ? (
                    <TrendingDown size={20} className="text-red-400" />
                  ) : (
                    <Minus size={20} className="text-yellow-400" />
                  )}
                  <span className={`text-xl font-bold ${
                    analysis.verdict === 'WIN' ? 'text-green-400' :
                    analysis.verdict === 'LOSE' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {analysis.verdict === 'WIN' ? 'You Win This Trade' :
                     analysis.verdict === 'LOSE' ? 'You Lose This Trade' : 'Fair Trade'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  Grade: <strong className={GRADE_STYLES[analysis.grade].split(' ')[0]}>{analysis.grade}</strong>
                  {' '}— Value difference: <strong className={analysis.diff >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {analysis.diff > 0 ? '+' : ''}{analysis.diff} points
                  </strong>
                </p>
              </div>
            </div>

            {/* Value bars */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Giving Away</span>
                  <span className="text-red-400 font-medium">{analysis.givingValue}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, (analysis.givingValue / Math.max(analysis.givingValue, analysis.gettingValue, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Receiving</span>
                  <span className="text-green-400 font-medium">{analysis.gettingValue}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (analysis.gettingValue / Math.max(analysis.givingValue, analysis.gettingValue, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          {analysis.reasoning.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Analysis</h3>
              <ul className="space-y-2">
                {analysis.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-green-400 shrink-0">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Player value breakdown */}
          {(giving.length > 0 || getting.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Player Value Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-800">
                      <th className="text-left pb-2">Player</th>
                      <th className="text-left pb-2">Team</th>
                      <th className="text-right pb-2">Proj Pts</th>
                      <th className="text-right pb-2">Playoff Sch</th>
                      <th className="text-right pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giving.map(p => (
                      <tr key={p.id} className="border-b border-slate-800/50">
                        <td className="py-2 flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>{p.position}</span>
                          <span className="text-red-300">{p.name}</span>
                        </td>
                        <td className="py-2 text-slate-400">{p.team}</td>
                        <td className="py-2 text-right text-slate-300">{p.projPts}</td>
                        <td className={`py-2 text-right ${p.playoffRating >= 7 ? 'text-green-400' : p.playoffRating >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {p.playoffRating}/10
                        </td>
                        <td className="py-2 text-right text-red-400 font-medium">{p.tradeValue}</td>
                      </tr>
                    ))}
                    {getting.map(p => (
                      <tr key={p.id} className="border-b border-slate-800/50">
                        <td className="py-2 flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>{p.position}</span>
                          <span className="text-green-300">{p.name}</span>
                        </td>
                        <td className="py-2 text-slate-400">{p.team}</td>
                        <td className="py-2 text-right text-slate-300">{p.projPts}</td>
                        <td className={`py-2 text-right ${p.playoffRating >= 7 ? 'text-green-400' : p.playoffRating >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {p.playoffRating}/10
                        </td>
                        <td className="py-2 text-right text-green-400 font-medium">{p.tradeValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!analysis && (
        <div className="text-center py-16">
          <ArrowLeftRight size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">Add players to both sides to analyze the trade</p>
          <p className="text-slate-600 text-sm mt-2">Search by name or team above</p>
        </div>
      )}

      {/* Trade value reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 text-sm">Trade Value Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { range: '90–100', label: 'Untouchable', color: 'text-amber-400' },
            { range: '70–89', label: 'Elite Starter', color: 'text-green-400' },
            { range: '50–69', label: 'Solid Starter', color: 'text-lime-400' },
            { range: '30–49', label: 'Depth Piece', color: 'text-yellow-400' },
            { range: '0–29', label: 'Waiver Wire', color: 'text-slate-400' },
          ].map(({ range, label, color }) => (
            <div key={range} className="bg-slate-800 rounded-lg p-2 text-center">
              <div className={`font-bold ${color}`}>{range}</div>
              <div className="text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
