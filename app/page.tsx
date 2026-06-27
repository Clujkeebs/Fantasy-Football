'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trophy,
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import { ALL_PLAYERS, DRAFT_TIPS, WAIVER_TIPS } from '@/lib/players'
import { POSITION_COLORS } from '@/lib/types'
import { getLeagueSettings, getMyTeamIds, saveLeagueSettings, DEFAULT_LEAGUE } from '@/lib/storage'
import type { LeagueSettings } from '@/lib/types'

const QUICK_LINKS = [
  { href: '/draft', label: 'Draft Board', desc: 'VBD rankings + live draft tracking', color: 'from-purple-600 to-purple-800', icon: '📋' },
  { href: '/trades', label: 'Trade Analyzer', desc: 'Calculate every trade instantly', color: 'from-blue-600 to-blue-800', icon: '🔄' },
  { href: '/waiver', label: 'Waiver Wire', desc: 'Best pickups this week', color: 'from-green-600 to-green-800', icon: '🔍' },
  { href: '/lineup', label: 'Lineup Optimizer', desc: 'Start/Sit decisions', color: 'from-orange-600 to-orange-800', icon: '📊' },
  { href: '/playoffs', label: 'Playoff Tracker', desc: 'Schedule strength + probability', color: 'from-rose-600 to-rose-800', icon: '🏆' },
]

export default function Dashboard() {
  const [settings, setSettings] = useState<LeagueSettings>(DEFAULT_LEAGUE)
  const [myTeamCount, setMyTeamCount] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [leagueName, setLeagueName] = useState('')
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    const s = getLeagueSettings()
    setSettings(s)
    setLeagueName(s.name)
    const ids = getMyTeamIds()
    setMyTeamCount(ids.size)
    const interval = setInterval(() => setTipIndex(i => (i + 1) % DRAFT_TIPS.length), 6000)
    return () => clearInterval(interval)
  }, [])

  const topPlayers = ALL_PLAYERS.filter(p => p.rank <= 10).slice(0, 6)

  const saveLeagueName = () => {
    const updated = { ...settings, name: leagueName }
    saveLeagueSettings(updated)
    setSettings(updated)
    setEditingName(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Samuel&apos;s Command Center</p>
          <div className="flex items-center gap-2 mb-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  value={leagueName}
                  onChange={e => setLeagueName(e.target.value)}
                  onBlur={saveLeagueName}
                  onKeyDown={e => e.key === 'Enter' && saveLeagueName()}
                  autoFocus
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-lg font-bold text-white"
                />
              </div>
            ) : (
              <h1
                className="text-2xl font-bold text-white cursor-pointer hover:text-green-400 transition-colors"
                onClick={() => setEditingName(true)}
                title="Click to edit league name"
              >
                {settings.name}
              </h1>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            {settings.size}-team {settings.scoringFormat.toUpperCase()} • {myTeamCount} players on roster
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-green-500/20 border border-amber-500/30 rounded-xl px-4 py-2">
          <Trophy className="text-amber-400" size={20} />
          <span className="text-amber-400 font-bold text-lg">$400</span>
          <span className="text-slate-400 text-sm">prize</span>
        </div>
      </div>

      {/* Daily Strategy Tip */}
      <div className="bg-gradient-to-r from-green-900/30 to-slate-900/30 border border-green-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="text-green-400 mt-0.5 shrink-0" size={18} />
          <div>
            <div className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">Strategy Tip</div>
            <p className="text-slate-200 text-sm leading-relaxed">{DRAFT_TIPS[tipIndex]}</p>
          </div>
        </div>
      </div>

      {/* League Setup */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Target size={16} className="text-green-400" /> League Settings
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Teams', value: settings.size, options: [8, 10, 12, 14] as number[] },
          ].map(({ label, value, options }) => (
            <div key={label}>
              <label className="text-slate-400 text-xs mb-1 block">{label}</label>
              <select
                value={value}
                onChange={e => {
                  const updated = { ...settings, size: Number(e.target.value) }
                  setSettings(updated)
                  saveLeagueSettings(updated)
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {options.map(o => <option key={o} value={o}>{o} Teams</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Scoring</label>
            <select
              value={settings.scoringFormat}
              onChange={e => {
                const updated = { ...settings, scoringFormat: e.target.value as LeagueSettings['scoringFormat'] }
                setSettings(updated)
                saveLeagueSettings(updated)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="ppr">PPR</option>
              <option value="halfppr">Half PPR</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">FAAB Budget ($)</label>
            <input
              type="number"
              value={settings.faabBudget}
              onChange={e => {
                const updated = { ...settings, faabBudget: Number(e.target.value) }
                setSettings(updated)
                saveLeagueSettings(updated)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              min={0}
              max={9999}
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Current Week</label>
            <select
              value={settings.currentWeek}
              onChange={e => {
                const updated = { ...settings, currentWeek: Number(e.target.value) }
                setSettings(updated)
                saveLeagueSettings(updated)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {Array.from({ length: 17 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Zap size={16} className="text-amber-400" /> Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ href, label, desc, color, icon }) => (
            <Link
              key={href}
              href={href}
              className={`group bg-gradient-to-br ${color} rounded-xl p-4 hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-white font-semibold">{label}</div>
                  <div className="text-white/70 text-xs mt-1">{desc}</div>
                </div>
                <ChevronRight className="text-white/50 group-hover:text-white transition-colors mt-1" size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Players Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" /> Top Overall Rankings
          </h2>
          <Link href="/draft" className="text-green-400 text-sm hover:text-green-300">
            Full Board →
          </Link>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-slate-500 border-b border-slate-800 font-medium">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2">ADP</div>
            <div className="col-span-2">Proj</div>
            <div className="col-span-2">VBD</div>
          </div>
          {topPlayers.map(p => (
            <div key={p.id} className="grid grid-cols-12 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <div className="col-span-1 text-slate-400 font-mono text-sm">{p.rank}</div>
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${POSITION_COLORS[p.position]}`}>
                    {p.position}
                  </span>
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  <span className="text-slate-500 text-xs">{p.team}</span>
                </div>
              </div>
              <div className="col-span-2 text-slate-300 text-sm">{p.adp.toFixed(1)}</div>
              <div className="col-span-2 text-green-400 text-sm font-medium">{p.projPts}</div>
              <div className="col-span-2 text-amber-400 text-sm">{p.vbd}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Waiver reminders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-400" /> Waiver Wire Reminders
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {WAIVER_TIPS.slice(0, 4).map((tip, i) => (
            <div key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
