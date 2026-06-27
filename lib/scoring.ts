import type { Player, ScoringFormat, TradeAnalysis } from './types'

export const QB_BASELINE_PPR = 292
export const RB_BASELINE_PPR = 92
export const WR_BASELINE_PPR = 110
export const TE_BASELINE_PPR = 118

export function calculateVBD(player: Player): number {
  const baselines: Record<string, number> = {
    QB: QB_BASELINE_PPR,
    RB: RB_BASELINE_PPR,
    WR: WR_BASELINE_PPR,
    TE: TE_BASELINE_PPR,
    K: 115,
    DST: 115,
  }
  return Math.max(0, player.projPts - (baselines[player.position] ?? 100))
}

export function adjustForFormat(projPts: number, position: string, format: ScoringFormat): number {
  if (format === 'ppr') return projPts
  const receptions = position === 'WR' ? 0.8 : position === 'TE' ? 0.7 : 0.3
  const deduction = position === 'QB' ? 0 : receptions * 17 * 5
  if (format === 'standard') return Math.round(projPts - deduction)
  return Math.round(projPts - deduction / 2)
}

export function analyzeTrade(giving: Player[], getting: Player[]): TradeAnalysis {
  const givingValue = giving.reduce((sum, p) => sum + p.tradeValue, 0)
  const gettingValue = getting.reduce((sum, p) => sum + p.tradeValue, 0)
  const diff = gettingValue - givingValue
  const pct = givingValue > 0 ? diff / givingValue : 0

  let verdict: TradeAnalysis['verdict']
  let grade: TradeAnalysis['grade']

  if (pct >= 0.15) { verdict = 'WIN'; grade = 'A' }
  else if (pct >= 0.05) { verdict = 'WIN'; grade = 'B' }
  else if (pct >= -0.05) { verdict = 'FAIR'; grade = 'C' }
  else if (pct >= -0.15) { verdict = 'LOSE'; grade = 'D' }
  else { verdict = 'LOSE'; grade = 'F' }

  const reasoning: string[] = []

  if (diff > 0) reasoning.push(`You gain ${diff} trade value points (${Math.round(pct * 100)}% return)`)
  if (diff < 0) reasoning.push(`You lose ${Math.abs(diff)} trade value points`)

  const givingPositions = giving.map(p => p.position)
  const gettingPositions = getting.map(p => p.position)

  if (givingPositions.includes('QB') && !gettingPositions.includes('QB'))
    reasoning.push('Trading away QB — only do this if you have a strong backup')
  if (gettingPositions.includes('RB') && giving.some(p => p.position === 'WR'))
    reasoning.push('Acquiring RB depth — smart in PPR where RBs have high injury risk')

  const injuryRisk = getting.some(p => p.injuryRisk === 'High')
  if (injuryRisk) reasoning.push('Warning: receiving player has HIGH injury risk')

  const playoffUpside = getting.some(p => p.playoffRating >= 8)
  if (playoffUpside) reasoning.push('Great playoff schedule for received player(s)')

  if (getting.some(p => p.upside === 'Ceiling'))
    reasoning.push('High ceiling player acquired — could win you weeks')

  if (reasoning.length === 0) reasoning.push('Trade values are close — consider roster needs and playoff schedule')

  return { givingValue, gettingValue, diff, verdict, grade, reasoning }
}

export function getFaabBid(player: Player, budget: number, week: number): number {
  const base = (player.tradeValue / 100) * budget
  const weekMultiplier = week <= 4 ? 0.6 : week <= 8 ? 0.8 : week <= 12 ? 1.0 : 1.2
  const urgency = player.upside === 'Ceiling' || player.injuryRisk === 'Low' ? 1.2 : 1.0
  return Math.min(budget, Math.round(base * weekMultiplier * urgency))
}

export function getScheduleLabel(rating: number): string {
  if (rating >= 9) return 'Elite'
  if (rating >= 7) return 'Easy'
  if (rating >= 5) return 'Average'
  if (rating >= 3) return 'Hard'
  return 'Brutal'
}

export function getScheduleColor(rating: number): string {
  if (rating >= 8) return 'text-green-400'
  if (rating >= 6) return 'text-lime-400'
  if (rating >= 4) return 'text-yellow-400'
  if (rating >= 2) return 'text-orange-400'
  return 'text-red-400'
}
