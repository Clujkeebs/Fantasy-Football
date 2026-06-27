export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'
export type InjuryRisk = 'Low' | 'Medium' | 'High'
export type PlayerStatus = 'Active' | 'Q' | 'D' | 'IR' | 'Out'
export type Upside = 'Low' | 'Medium' | 'High' | 'Ceiling'
export type ScoringFormat = 'ppr' | 'halfppr' | 'standard'

export interface Player {
  id: string
  name: string
  team: string
  position: Position
  age: number
  bye: number
  rank: number
  posRank: number
  tier: number
  adp: number
  projPts: number
  vbd: number
  tradeValue: number
  injuryRisk: InjuryRisk
  upside: Upside
  status: PlayerStatus
  notes: string
  targetShare?: number
  rushShare?: number
  snapPct?: number
  scheduleRating: number
  playoffRating: number
  drafted: boolean
  onMyTeam: boolean
}

export interface LeagueSettings {
  name: string
  size: number
  scoringFormat: ScoringFormat
  playoffWeeks: number[]
  faabBudget: number
  currentWeek: number
}

export interface TradeAnalysis {
  givingValue: number
  gettingValue: number
  diff: number
  verdict: 'WIN' | 'FAIR' | 'LOSE'
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  reasoning: string[]
}

export interface WaiverTarget {
  player: Player
  reason: string
  faabBid: number
  priority: 'Must Add' | 'High' | 'Medium' | 'Speculative'
}

export const POSITION_COLORS: Record<Position, string> = {
  QB: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  RB: 'bg-green-500/20 text-green-300 border-green-500/30',
  WR: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  TE: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  K: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  DST: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export const TIER_LABELS: Record<number, string> = {
  1: 'Elite',
  2: 'Great',
  3: 'Good',
  4: 'Depth',
  5: 'Streamer',
}
