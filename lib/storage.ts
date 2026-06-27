'use client'

import type { LeagueSettings, ScoringFormat } from './types'

const KEYS = {
  LEAGUE: 'ff_league',
  DRAFTED: 'ff_drafted',
  MY_TEAM: 'ff_myteam',
  WEEK: 'ff_week',
  FAAB: 'ff_faab',
}

export const DEFAULT_LEAGUE: LeagueSettings = {
  name: "Samuel's League",
  size: 12,
  scoringFormat: 'ppr',
  playoffWeeks: [15, 16, 17],
  faabBudget: 100,
  currentWeek: 1,
}

export function getLeagueSettings(): LeagueSettings {
  if (typeof window === 'undefined') return DEFAULT_LEAGUE
  try {
    const stored = localStorage.getItem(KEYS.LEAGUE)
    return stored ? { ...DEFAULT_LEAGUE, ...JSON.parse(stored) } : DEFAULT_LEAGUE
  } catch {
    return DEFAULT_LEAGUE
  }
}

export function saveLeagueSettings(settings: LeagueSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.LEAGUE, JSON.stringify(settings))
}

export function getDraftedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(KEYS.DRAFTED)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

export function saveDraftedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.DRAFTED, JSON.stringify(Array.from(ids)))
}

export function getMyTeamIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(KEYS.MY_TEAM)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

export function saveMyTeamIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.MY_TEAM, JSON.stringify(Array.from(ids)))
}

export function getCurrentWeek(): number {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem(KEYS.WEEK) ?? '1', 10)
}

export function saveCurrentWeek(week: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.WEEK, String(week))
}

export function getRemainingFaab(): number {
  if (typeof window === 'undefined') return 100
  return parseInt(localStorage.getItem(KEYS.FAAB) ?? '100', 10)
}

export function saveRemainingFaab(amount: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.FAAB, String(amount))
}

export function resetDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.DRAFTED)
  localStorage.removeItem(KEYS.MY_TEAM)
}
