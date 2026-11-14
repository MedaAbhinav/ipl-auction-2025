'use strict';

/**
 * AI-powered team evaluation engine.
 * Scores every team out of 100 across 12 dimensions and returns ranked results.
 */

function evaluateTeams(teams, auctionSettings) {
  const initialPurse = (auctionSettings && auctionSettings.initialPurse) || 12000; // in lakhs

  const evaluations = teams.map(team => {
    const squad = team.players || [];
    const totalSpent = squad.reduce((s, p) => s + (p.soldPrice || p.basePrice), 0);
    const remaining = initialPurse - totalSpent;

    // ── Category counts ──────────────────────────────────────────────────────
    const batsmen    = squad.filter(p => p.role === 'Batsman');
    const bowlers    = squad.filter(p => p.role === 'Bowler');
    const allRounders= squad.filter(p => p.role === 'All-rounder');
    const wks        = squad.filter(p => p.role === 'Wicketkeeper');
    const overseas   = squad.filter(p => p.isOverseas);
    const indian     = squad.filter(p => !p.isOverseas);

    // ── 1. Batting strength (0-15) ───────────────────────────────────────────
    const battingScore = Math.min(15, (
      batsmen.length * 1.2 +
      allRounders.length * 0.6 +
      wks.length * 0.4 +
      squad.reduce((s, p) => s + (p.stats.avg || 0), 0) / Math.max(squad.length, 1) * 0.1
    ));

    // ── 2. Bowling strength (0-15) ───────────────────────────────────────────
    const bowlingScore = Math.min(15, (
      bowlers.length * 1.5 +
      allRounders.length * 0.6 +
      squad.reduce((s, p) => s + (p.stats.wickets || 0), 0) / Math.max(squad.length, 1) * 0.1
    ));

    // ── 3. All-rounder quality (0-10) ────────────────────────────────────────
    const arScore = Math.min(10, allRounders.length * 2.0);

    // ── 4. Wicket-keeping (0-8) ──────────────────────────────────────────────
    const wkScore = Math.min(8, wks.length * 4);

    // ── 5. Indian / overseas balance (0-8) ──────────────────────────────────
    const balanceScore = Math.min(8,
      overseas.length >= 2 && overseas.length <= 8 && indian.length >= 7 ? 8 :
      overseas.length >= 1 && indian.length >= 5 ? 5 : 2
    );

    // ── 6. Squad depth (0-8) ─────────────────────────────────────────────────
    const depthScore = Math.min(8, squad.length * 0.44);

    // ── 7. Player versatility (0-7) ──────────────────────────────────────────
    const versatilityScore = Math.min(7, allRounders.length * 1.5 + wks.length * 0.5);

    // ── 8. Performance quality (0-10) ────────────────────────────────────────
    const avgSR   = squad.reduce((s, p) => s + (p.stats.sr || 0), 0) / Math.max(squad.length, 1);
    const avgAvg  = squad.reduce((s, p) => s + (p.stats.avg || 0), 0) / Math.max(squad.length, 1);
    const perfScore = Math.min(10, (avgSR / 15) + (avgAvg / 4));

    // ── 9. Experience (0-7) ───────────────────────────────────────────────────
    const expMap = { Legend: 3, Senior: 2, 'Mid-career': 1.5, Young: 0.8 };
    const expScore = Math.min(7,
      squad.reduce((s, p) => s + (expMap[p.experience] || 1), 0) / Math.max(squad.length, 1) * 2.5
    );

    // ── 10. Value for money (0-7) ────────────────────────────────────────────
    const avgValueRatio = squad.reduce((s, p) => {
      const base = p.basePrice || 20;
      const paid = p.soldPrice || base;
      return s + (base / Math.max(paid, 1));
    }, 0) / Math.max(squad.length, 1);
    const valueScore = Math.min(7, avgValueRatio * 7);

    // ── 11. Remaining purse (0-5) ────────────────────────────────────────────
    const purseScore = Math.min(5, (remaining / initialPurse) * 10);

    // ── 12. Overall balance (0-5) ────────────────────────────────────────────
    const hasWK     = wks.length >= 1;
    const hasFastB  = squad.some(p => p.bowlingStyle && p.bowlingStyle.toLowerCase().includes('fast'));
    const hasSpinner= squad.some(p => p.bowlingStyle && (p.bowlingStyle.toLowerCase().includes('spin') || p.bowlingStyle.toLowerCase().includes('break')));
    const overallBal= (hasWK ? 2 : 0) + (hasFastB ? 1.5 : 0) + (hasSpinner ? 1.5 : 0);
    const balScore  = Math.min(5, overallBal);

    // ── Total ─────────────────────────────────────────────────────────────────
    const total = battingScore + bowlingScore + arScore + wkScore + balanceScore +
                  depthScore + versatilityScore + perfScore + expScore + valueScore +
                  purseScore + balScore;

    // Penalty for incomplete squad
    const squadPenalty = squad.length < 18 ? ((18 - squad.length) * 1.5) : 0;
    const finalScore = Math.max(0, Math.min(100, total - squadPenalty));

    // ── Strengths / weaknesses ───────────────────────────────────────────────
    const strengths = [];
    const weaknesses = [];

    if (battingScore >= 10) strengths.push('Explosive batting lineup');
    else weaknesses.push('Weak batting depth');

    if (bowlingScore >= 10) strengths.push('Potent bowling attack');
    else weaknesses.push('Thin bowling attack');

    if (arScore >= 6) strengths.push('Excellent all-round options');
    if (wks.length >= 2) strengths.push('Well-covered wicketkeeping');
    else if (wks.length === 0) weaknesses.push('No specialist wicketkeeper');

    if (overseas.length >= 4) strengths.push('Quality overseas firepower');
    if (remaining > initialPurse * 0.15) strengths.push('Smart budget management');
    else if (remaining < 0) weaknesses.push('Overspent budget');

    if (squad.length < 18) weaknesses.push(`Incomplete squad (${squad.length}/18 players)`);

    // ── Best purchases ────────────────────────────────────────────────────────
    const bestPurchases = squad
      .filter(p => p.soldPrice && p.basePrice)
      .sort((a, b) => (b.stats.avg + b.stats.sr / 10) - (a.stats.avg + a.stats.sr / 10))
      .slice(0, 3)
      .map(p => ({ name: p.name, role: p.role, soldPrice: p.soldPrice }));

    return {
      teamId: team.id,
      teamName: team.name,
      score: Math.round(finalScore * 10) / 10,
      breakdown: {
        batting: Math.round(battingScore * 10) / 10,
        bowling: Math.round(bowlingScore * 10) / 10,
        allRounders: Math.round(arScore * 10) / 10,
        wicketkeeping: Math.round(wkScore * 10) / 10,
        balance: Math.round(balanceScore * 10) / 10,
        depth: Math.round(depthScore * 10) / 10,
        versatility: Math.round(versatilityScore * 10) / 10,
        performance: Math.round(perfScore * 10) / 10,
        experience: Math.round(expScore * 10) / 10,
        value: Math.round(valueScore * 10) / 10,
        purse: Math.round(purseScore * 10) / 10,
        overallBalance: Math.round(balScore * 10) / 10
      },
      squadSize: squad.length,
      totalSpent,
      remaining,
      overseas: overseas.length,
      indian: indian.length,
      strengths,
      weaknesses,
      bestPurchases,
      squadPenalty: Math.round(squadPenalty * 10) / 10
    };
  });

  // Sort descending by score
  evaluations.sort((a, b) => b.score - a.score);

  // Assign ranks
  evaluations.forEach((e, i) => { e.rank = i + 1; });

  return evaluations;
}

/**
 * Generate the best Playing XI for a squad.
 */
function generatePlayingXI(squad) {
  if (!squad || squad.length === 0) return null;

  const batsmen     = squad.filter(p => p.role === 'Batsman');
  const bowlers     = squad.filter(p => p.role === 'Bowler');
  const allRounders = squad.filter(p => p.role === 'All-rounder');
  const wks         = squad.filter(p => p.role === 'Wicketkeeper');

  const xi = [];
  const usedIds = new Set();

  const pick = (pool, max) => {
    let count = 0;
    for (const p of pool) {
      if (count >= max) break;
      if (!usedIds.has(p.id) && (xi.filter(x => x.isOverseas).length < 4 || !p.isOverseas)) {
        xi.push(p);
        usedIds.add(p.id);
        count++;
      }
    }
  };

  // 1 WK → 4 pure batsmen → 2 AR → 4 bowlers
  pick(wks, 1);
  pick(batsmen, 4);
  pick(allRounders, 2);
  pick(bowlers, 4);

  // Fill remaining slots from whatever's available
  const remaining = squad.filter(p => !usedIds.has(p.id));
  pick(remaining, 11 - xi.length);

  // Captain = highest stats player
  const captain = xi.reduce((best, p) =>
    (p.stats.avg + p.stats.sr / 10) > (best.stats.avg + best.stats.sr / 10) ? p : best, xi[0]);

  // Vice-captain = second highest
  const vc = xi.filter(p => p.id !== captain.id).reduce((best, p) =>
    (p.stats.avg + p.stats.sr / 10) > (best.stats.avg + best.stats.sr / 10) ? p : best, xi[1]);

  // Impact sub from bench
  const bench = squad.filter(p => !usedIds.has(p.id));
  const impactSub = bench.length > 0 ? bench[0] : null;

  return { xi: xi.slice(0, 11), captain, viceCaptain: vc, impactSub };
}

/**
 * Generate awards after auction ends.
 */
function generateAwards(teams) {
  const allSoldPlayers = teams.flatMap(t =>
    (t.players || []).map(p => ({ ...p, teamName: t.name, teamId: t.id }))
  );

  if (allSoldPlayers.length === 0) return {};

  const byPrice   = [...allSoldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
  const byValue   = [...allSoldPlayers].sort((a, b) => {
    const va = (a.basePrice || 20) / Math.max(a.soldPrice || 1, 1);
    const vb = (b.basePrice || 20) / Math.max(b.soldPrice || 1, 1);
    return vb - va;
  });

  const batsmen    = allSoldPlayers.filter(p => p.role === 'Batsman' || p.role === 'Wicketkeeper');
  const bowlerList = allSoldPlayers.filter(p => p.role === 'Bowler');
  const arList     = allSoldPlayers.filter(p => p.role === 'All-rounder');

  const teamSpend  = teams.map(t => ({
    teamId: t.id, teamName: t.name,
    spent: (t.players || []).reduce((s, p) => s + (p.soldPrice || 0), 0)
  }));
  teamSpend.sort((a, b) => b.spent - a.spent);

  return {
    mostExpensivePlayer:  byPrice[0] || null,
    cheapestPlayer:       byPrice[byPrice.length - 1] || null,
    bestBargain:          byValue[0] || null,
    bestBatterPurchase:   batsmen.sort((a, b) => b.stats.avg - a.stats.avg)[0] || null,
    bestBowlerPurchase:   bowlerList.sort((a, b) => b.stats.wickets - a.stats.wickets)[0] || null,
    bestAllRounder:       arList.sort((a, b) => (b.stats.avg + b.stats.wickets) - (a.stats.avg + a.stats.wickets))[0] || null,
    highestSpendingTeam:  teamSpend[0] || null,
    mostEconomicalTeam:   teamSpend[teamSpend.length - 1] || null,
    totalAuctionSpend:    teamSpend.reduce((s, t) => s + t.spent, 0),
    averagePlayerPrice:   allSoldPlayers.length > 0
      ? Math.round(allSoldPlayers.reduce((s, p) => s + (p.soldPrice || 0), 0) / allSoldPlayers.length)
      : 0,
    totalUnsold:          0 // filled in by caller
  };
}

module.exports = { evaluateTeams, generatePlayingXI, generateAwards };
