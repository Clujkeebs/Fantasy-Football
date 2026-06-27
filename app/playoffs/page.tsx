'use client'

import { useState, useEffect, useMemo } from 'react'
import { Trophy, TrendingUp, Calendar, Star, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ALL_PLAYERS } from '@/lib/players'
import { POSITION_COLORS } from '@/lib/types'
import { getScheduleLabel, getScheduleColor } from '@/lib/scoring'
import { getMyTeamIds, getLeagueSettings } from '@/lib/storage'
import type { Player } from '@/lib/types'

function PlayoffProbability({ score }: { score: number }) {
  const pct = Math.min(99, Math.max(1, Math.round(score)))
  const color = pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'
  const ring = pct >= 70 ? 'border-green-500' : pct >= 50 ? 'border-yellow-500' : 'border-red-500'
  return (
    <div className={`w-28 h-28 rounded-full border-4 ${ring} flex flex-col items-center justify-center`}>
      <div className={`text-3xl font-black ${color}`}>{pct}%</div>
      <div className="text-slate-500 text-xs">playoff</div>
    </div>
  )
}

const PLAYOFF_WEEKS = [15, 16, 17]
const SEASON_WEEKS = Array.from({ length: 14 }, (_, i) => i + 1)

function getBestPlayoffPlayers(players: Player[]): Player[] {
  return players
    .filter(p => p.position !== 'K' && p.position !== 'DST')
    .sort((a, b) => b.playoffRating - a.playoffRating)
    .slice(0, 10)
}

function getWorstPlayoffPlayers(players: Player[]): Player[] {
  return ALL_PLAYERS
    .filter(p => p.position !== 'K' && p.position !== 'DST')
    .filter(p => players.find(mp => mp.id === p.id))
    .sort((a, b) => a.playoffRating - b.playoffRating)
    .slice(0, 5)
}

export default function PlayoffsPage() {
  const [myRoster, setMyRoster] = useState<Player[]>([])
  const [week, setWeek] = useState(1)
  const [record, setRecord] = useState({ wins: 0, losses: 0 })
  const [pointsFor, setPointsFor] = useState(0)

  useEffect(() => {
    const ids = getMyTeamIds()
    const settings = getLeagueSettings()
    setWeek(settings.currentWeek)
    if (ids.size > 0) {
      setMyRoster(ALL_PLAYERS.filter(p => ids.has(p.id)))
    }
  }, [])

  const sampleRoster = ALL_PLAYERS.filter(p => [
    'josh-allen', 'saquon-barkley', 'jahmyr-gibbs', 'justin-jefferson',
    'amon-ra-st-brown', 'brock-bowers', 'kyren-williams', 'breece-hall',
    'dk-metcalf', 'tee-higgins',
  ].includes(p.id))

  const displayRoster = myRoster.length > 0 ? myRoster : sampleRoster

  const avgPlayoffRating = displayRoster.length > 0
    ? displayRoster.reduce((s, p) => s + p.playoffRating, 0) / displayRoster.length
    : 0

  const avgSeasonRating = displayRoster.length > 0
    ? displayRoster.reduce((s, p) => s + p.scheduleRating, 0) / displayRoster.length
    : 0

  const wins = record.wins
  const losses = record.losses
  const winPct = wins + losses > 0 ? wins / (wins + losses) : 0.5

  const playoffScore = (
    winPct * 40 +
    (avgPlayoffRating / 10) * 35 +
    Math.min(displayRoster.length / 15, 1) * 25
  ) * 100 / 100

  const bestForPlayoffs = getBestPlayoffPlayers(ALL_PLAYERS).slice(0, 8)
  const worstForPlayoffs = getWorstPlayoffPlayers(displayRoster)

  const scheduleData = ALL_PLAYERS
    .filter(p => p.position !== 'K' && p.position !== 'DST' && p.rank <= 30)
    .sort((a, b) => b.playoffRating - a.playoffRating)
    .slice(0, 10)
    .map(p => ({
      name: p.name.split(' ').pop()!,
      rating: p.playoffRating,
      pts: p.projPts,
    }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Playoff Tracker</h1>
        <p className="text-slate-400 text-sm">Schedule analysis for weeks 15-17 · win the $400</p>
      </div>

      {/* My Record Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Target size={16} className="text-green-400" /> My Season Record
        </h2>
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Wins</label>
            <input
              type="number" min={0} max={17} value={wins}
              onChange={e => setRecord(r => ({ ...r, wins: Number(e.target.value) }))}
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-center text-lg font-bold"
            />
          </div>
          <div className="text-slate-500 text-2xl font-light pb-2">–</div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Losses</label>
            <input
              type="number" min={0} max={17} value={losses}
              onChange={e => setRecord(r => ({ ...r, losses: Number(e.target.value) }))}
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-center text-lg font-bold"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Current Week</label>
            <select
              value={week}
              onChange={e => setWeek(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {Array.from({ length: 17 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Playoff Probability */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" /> Championship Outlook
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <PlayoffProbability score={playoffScore} />
          <div className="flex-1 grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold ${getScheduleColor(avgPlayoffRating)}`}>
                {avgPlayoffRating.toFixed(1)}/10
              </div>
              <div className="text-slate-400 text-xs mt-1">Avg Playoff Schedule</div>
              <div className={`text-xs mt-1 ${getScheduleColor(avgPlayoffRating)}`}>
                {getScheduleLabel(avgPlayoffRating)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold ${getScheduleColor(avgSeasonRating)}`}>
                {avgSeasonRating.toFixed(1)}/10
              </div>
              <div className="text-slate-400 text-xs mt-1">Season Schedule</div>
              <div className={`text-xs mt-1 ${getScheduleColor(avgSeasonRating)}`}>
                {getScheduleLabel(avgSeasonRating)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{wins}-{losses}</div>
              <div className="text-slate-400 text-xs mt-1">Current Record</div>
              <div className={`text-xs mt-1 ${winPct >= 0.6 ? 'text-green-400' : winPct >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {(winPct * 100).toFixed(0)}% win rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playoff Schedule Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-blue-400" /> Best Playoff Schedules (Top 30 Players)
        </h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scheduleData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f8fafc' }}
                formatter={(v) => [`${v}/10`, 'Playoff Rating']}
              />
              <Bar dataKey="rating" radius={[4, 4, 0, 0]}>
                {scheduleData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.rating >= 8 ? '#22c55e' : entry.rating >= 6 ? '#eab308' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best Playoff Targets to Draft/Trade For */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Star size={16} className="text-amber-400" /> Best Players for Weeks 15-17
          <span className="text-slate-500 text-xs font-normal">(target in trades/waiver)</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {bestForPlayoffs.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-mono text-sm w-4">{i + 1}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                  {p.position}
                </span>
                <div>
                  <div className="text-white text-sm font-medium">{p.name}</div>
                  <div className="text-slate-500 text-xs">{p.team} · Bye Wk {p.bye}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${getScheduleColor(p.playoffRating)}`}>
                  {p.playoffRating}/10
                </div>
                <div className="text-slate-500 text-xs">{getScheduleLabel(p.playoffRating)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avoid in Playoffs */}
      {worstForPlayoffs.length > 0 && (
        <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-5">
          <h2 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="rotate-180" /> Sell High Before Playoffs
          </h2>
          <div className="space-y-2">
            {worstForPlayoffs.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                    {p.position}
                  </span>
                  <div>
                    <div className="text-white text-sm">{p.name}</div>
                    <div className="text-slate-500 text-xs">{p.team}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold text-sm">{p.playoffRating}/10</div>
                  <div className="text-slate-500 text-xs">playoff sch</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs mt-3">
            Trade these players before the deadline (Week 10-12) to get max value while they still look good.
          </p>
        </div>
      )}

      {/* Strategy Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">Playoff Strategy Blueprint</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-300">
          {[
            { week: 'Draft', tip: 'Identify WK 15-17 schedules during draft. Avoid teams playing elite defenses in playoffs.' },
            { week: 'Wks 1-4', tip: 'Build your record. Start safe players with floor over upside. Win percentage matters.' },
            { week: 'Wks 5-8', tip: 'Assess your playoff schedule. Target players via trade who have green playoff matchups.' },
            { week: 'Wks 9-11', tip: 'Trade deadline window. Sell players with tough playoff schedules. Buy playoff-schedule kings.' },
            { week: 'Wks 12-14', tip: 'Get healthy roster for playoffs. Stash injured players who return by Week 15.' },
            { week: 'Wks 15-17', tip: 'Maximize playoff schedule advantage. Start every player with a 7+ playoff rating.' },
          ].map(({ week: w, tip }) => (
            <div key={w} className="flex gap-3">
              <div className="bg-green-900/30 text-green-400 text-xs font-bold px-2 py-1 rounded shrink-0 h-fit">
                {w}
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
