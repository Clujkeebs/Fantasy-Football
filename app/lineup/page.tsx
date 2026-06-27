'use client'

import { useState, useEffect, useMemo } from 'react'
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { ALL_PLAYERS } from '@/lib/players'
import { POSITION_COLORS } from '@/lib/types'
import { getScheduleColor } from '@/lib/scoring'
import { getMyTeamIds, getLeagueSettings } from '@/lib/storage'
import type { Player } from '@/lib/types'

function getStartRecommendation(p: Player, week: number): { start: boolean; reason: string; confidence: number } {
  let score = 0
  const reasons: string[] = []

  if (p.scheduleRating >= 8) { score += 30; reasons.push('elite matchup this week') }
  else if (p.scheduleRating >= 6) { score += 15; reasons.push('favorable matchup') }
  else if (p.scheduleRating <= 3) { score -= 25; reasons.push('brutal matchup') }

  if (p.vbd > 150) { score += 40; reasons.push('elite VBD floor') }
  else if (p.vbd > 80) { score += 25 }
  else if (p.vbd > 40) { score += 10 }

  if (p.upside === 'Ceiling') { score += 20; reasons.push('ceiling upside') }
  else if (p.upside === 'High') score += 10

  if (p.injuryRisk === 'High') { score -= 20; reasons.push('injury concern') }
  if (p.status === 'Q') { score -= 15; reasons.push('questionable status') }
  if (p.status === 'D' || p.status === 'IR' || p.status === 'Out') {
    return { start: false, reason: 'Player is OUT — find a replacement immediately', confidence: 100 }
  }

  if (p.tier === 1) { score += 30 }
  else if (p.tier === 2) { score += 15 }
  else if (p.tier >= 4) { score -= 10 }

  if (p.bye === week) {
    return { start: false, reason: 'ON BYE — must sit this week', confidence: 100 }
  }

  const start = score >= 20
  const mainReason = reasons.length > 0 ? reasons[0] : (start ? 'solid overall metrics' : 'tough matchup or limited upside')
  const confidence = Math.min(95, Math.max(5, 50 + score))

  return { start, reason: mainReason, confidence }
}

export default function LineupPage() {
  const [myRoster, setMyRoster] = useState<Player[]>([])
  const [allPlayers] = useState(ALL_PLAYERS)
  const [week, setWeek] = useState(1)
  const [starters, setStarters] = useState<Set<string>>(new Set())

  useEffect(() => {
    const ids = getMyTeamIds()
    const settings = getLeagueSettings()
    setWeek(settings.currentWeek)
    if (ids.size > 0) {
      setMyRoster(ALL_PLAYERS.filter(p => ids.has(p.id)))
    }
  }, [])

  const recommendations = useMemo(() => {
    return myRoster.map(p => ({
      ...p,
      rec: getStartRecommendation(p, week),
    })).sort((a, b) => {
      if (a.rec.start !== b.rec.start) return a.rec.start ? -1 : 1
      return b.rec.confidence - a.rec.confidence
    })
  }, [myRoster, week])

  const recommendedStarters = recommendations.filter(p => p.rec.start)
  const recommendedBench = recommendations.filter(p => !p.rec.start)

  const toggleStarter = (id: string) => {
    setStarters(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sampleRoster = allPlayers
    .filter(p => [
      'josh-allen', 'saquon-barkley', 'jahmyr-gibbs', 'justin-jefferson',
      'amon-ra-st-brown', 'brock-bowers', 'kyren-williams', 'breece-hall',
      'dk-metcalf', 'tee-higgins', 'david-montgomery',
    ].includes(p.id))

  const displayRoster = myRoster.length > 0 ? recommendations : sampleRoster.map(p => ({
    ...p,
    rec: getStartRecommendation(p, week),
  })).sort((a, b) => a.rec.start === b.rec.start ? b.rec.confidence - a.rec.confidence : a.rec.start ? -1 : 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Lineup Optimizer</h1>
          <p className="text-slate-400 text-sm">
            {myRoster.length > 0 ? 'Your roster from the draft board' : 'Sample roster — add players on the Draft Board'}
          </p>
        </div>
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
      </div>

      {/* Start/Sit Overview */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-4">
          <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
            <CheckCircle size={16} /> Start These
          </h3>
          <div className="space-y-1">
            {displayRoster.filter(p => p.rec.start).map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>{p.position}</span>
                <span className="text-white">{p.name}</span>
                <span className="text-slate-500 text-xs">{p.team}</span>
              </div>
            ))}
            {displayRoster.filter(p => p.rec.start).length === 0 && (
              <p className="text-slate-500 text-sm">No clear starts identified</p>
            )}
          </div>
        </div>
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Consider Benching
          </h3>
          <div className="space-y-1">
            {displayRoster.filter(p => !p.rec.start).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>{p.position}</span>
                <span className="text-white">{p.name}</span>
                <span className="text-slate-500 text-xs">{p.rec.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Roster Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users size={16} className="text-green-400" /> Week {week} Lineup Decisions
          </h2>
        </div>
        <div className="divide-y divide-slate-800/50">
          {displayRoster.map(p => {
            const rec = p.rec
            const isStarter = starters.has(p.id)
            const autoStart = rec.start

            return (
              <div key={p.id} className="px-4 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${autoStart ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                          {p.position}
                        </span>
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-slate-400 text-sm">{p.team}</span>
                        {p.bye === week && (
                          <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded border border-red-800/50">ON BYE</span>
                        )}
                        {p.status === 'Q' && (
                          <span className="bg-yellow-900/40 text-yellow-400 text-xs px-2 py-0.5 rounded border border-yellow-800/50">Q</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        <span className={autoStart ? 'text-green-400' : 'text-red-400'}>
                          {autoStart ? '▲ START' : '▼ SIT'}
                        </span>
                        {' '}— {rec.reason} · {rec.confidence}% confident
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-sm">{p.projPts}</div>
                      <div className="text-slate-500 text-xs">proj season</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold text-sm ${getScheduleColor(p.scheduleRating)}`}>{p.scheduleRating}/10</div>
                      <div className="text-slate-500 text-xs">matchup</div>
                    </div>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Confidence</span>
                        <span className={autoStart ? 'text-green-400' : 'text-red-400'}>{rec.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${autoStart ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${rec.confidence}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStarter(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isStarter
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {isStarter ? 'Starting' : 'Start?'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Start/Sit Tips */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" /> Start/Sit Principles
        </h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-300">
          {[
            'Always start your studs — tier 1 players start regardless of matchup.',
            'Schedule strength matters most for tier 3-4 players on the bubble.',
            'Never start a player who is listed as Doubtful or Out.',
            'Check weather reports for outdoor games on Sunday morning.',
            'A great matchup (Sch 8+) can make a tier 3 player a flex start.',
            'Avoid double-dipping on same bye week — stagger your roster.',
            'TD-dependent players (low reception floors) have more variance.',
            'Elite target share (20%+) creates a safe PPR floor regardless of matchup.',
          ].map((tip, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-green-400 font-bold shrink-0">✓</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
