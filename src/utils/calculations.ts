export function calculateCourseHandicap(handicapIndex: number, slopeRating: number): number {
  return Math.round((handicapIndex * slopeRating) / 113);
}

// Import types
import type { Player, Hole } from '../types';

export function calculateStablefordPoints(grossScore: number, par: number, strokesReceived: number): number {
  if (grossScore === 0) return 0; // No score entered
  
  // Apply net double bogey rule first
  const adjustedScore = applyNetDoubleBogeyRule(grossScore, par, strokesReceived);
  const netScore = adjustedScore - strokesReceived;
  const difference = netScore - par;
  
  if (difference <= -3) return 5; // Double eagle or better
  if (difference === -2) return 4; // Eagle
  if (difference === -1) return 3; // Birdie
  if (difference === 0) return 2;  // Par
  if (difference === 1) return 1;  // Bogey
  return 0; // Double bogey or worse
}

export function getStrokesForHole(courseHandicap: number, holeHandicapIndex: number): number {
  if (courseHandicap >= holeHandicapIndex) {
    const additionalStrokes = Math.floor((courseHandicap - holeHandicapIndex) / 18);
    return 1 + additionalStrokes;
  }
  return 0;
}

export function applyNetDoubleBogeyRule(grossScore: number, par: number, strokesReceived: number): number {
  if (grossScore === 0) return 0; // No score entered
  
  // USGA Net Double Bogey Rule: Maximum score = Par + Handicap Strokes + 2
  // Example: Par 4 with 1 stroke = 4 + 1 + 2 = 7 maximum
  const maxScore = par + strokesReceived + 2;
  return Math.min(grossScore, maxScore);
}

// Match Play Calculations
export interface MatchPlayHoleResult {
  winnerIds: string[];
  isHalved: boolean;
  margin: number; // Strokes won by
  teamWinner?: 'A' | 'B'; // For team play
}

export interface MatchPlayStatus {
  leadingPlayerId: string | null;
  leadingPlayerName: string;
  margin: number; // How many holes up
  isAllSquare: boolean;
  status: string; // "2 Up", "All Square", etc.
  canEnd: boolean; // If match can end early
  holesRemaining: number;
  isTeamPlay?: boolean;
  teamStatus?: {
    leadingTeam: 'A' | 'B' | null;
    teamANames: string[];
    teamBNames: string[];
    status: string;
  };
}

// Calculate who won each hole in match play
export function calculateHoleWinner(players: Player[], holeIndex: number, holes: Hole[]): MatchPlayHoleResult {
  if (holeIndex >= holes.length) {
    return { winnerIds: [], isHalved: true, margin: 0 };
  }

  const hole = holes[holeIndex];
  const playersWithScores = players.filter(player => 
    player.scores[holeIndex] && player.scores[holeIndex] > 0
  );

  if (playersWithScores.length === 0) {
    return { winnerIds: [], isHalved: true, margin: 0 };
  }

  // Calculate net scores for each player
  const netScores = playersWithScores.map(player => {
    const grossScore = player.scores[holeIndex];
    const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
    const netScore = grossScore - strokesReceived;
    return {
      playerId: player.id,
      playerName: player.name,
      netScore,
      grossScore
    };
  });

  // Find the lowest net score
  const lowestNetScore = Math.min(...netScores.map(p => p.netScore));
  const winners = netScores.filter(p => p.netScore === lowestNetScore);
  
  // If only one winner, calculate margin
  const margin = winners.length === 1 ? 
    Math.min(...netScores.filter(p => p.netScore !== lowestNetScore).map(p => p.netScore)) - lowestNetScore : 0;

  return {
    winnerIds: winners.map(w => w.playerId),
    isHalved: winners.length > 1,
    margin
  };
}

// Calculate overall match play status
export function calculateMatchPlayStatus(players: Player[], holes: Hole[], currentHoleIndex: number): MatchPlayStatus {
  if (players.length !== 2) {
    return {
      leadingPlayerId: null,
      leadingPlayerName: "Multiple Players",
      margin: 0,
      isAllSquare: true,
      status: "Stableford Only",
      canEnd: false,
      holesRemaining: 18 - currentHoleIndex
    };
  }

  let holesWon = { [players[0].id]: 0, [players[1].id]: 0 };
  
  // Count holes won up to current hole
  for (let i = 0; i < Math.min(currentHoleIndex, 18); i++) {
    const holeResult = calculateHoleWinner(players, i, holes);
    if (!holeResult.isHalved && holeResult.winnerIds.length === 1) {
      holesWon[holeResult.winnerIds[0]]++;
    }
  }

  const player1Wins = holesWon[players[0].id];
  const player2Wins = holesWon[players[1].id];
  const margin = Math.abs(player1Wins - player2Wins);
  const holesRemaining = 18 - currentHoleIndex;
  
  const isAllSquare = player1Wins === player2Wins;
  const leadingPlayer = player1Wins > player2Wins ? players[0] : 
                        player2Wins > player1Wins ? players[1] : null;
  
  // Can the match end early? (margin greater than holes remaining)
  const canEnd = margin > holesRemaining && holesRemaining > 0;
  
  let status = "";
  if (isAllSquare) {
    status = "All Square";
  } else if (canEnd) {
    status = `${margin} & ${holesRemaining}`;
  } else if (margin === 1) {
    status = "1 Up";
  } else {
    status = `${margin} Up`;
  }

  return {
    leadingPlayerId: leadingPlayer?.id || null,
    leadingPlayerName: leadingPlayer?.name || "All Square",
    margin,
    isAllSquare,
    status,
    canEnd,
    holesRemaining
  };
}

// Team Match Play Calculations
export function calculateTeamHoleWinner(players: Player[], holeIndex: number, holes: Hole[]): MatchPlayHoleResult {
  if (holeIndex >= holes.length || players.length !== 4) {
    return { winnerIds: [], isHalved: true, margin: 0 };
  }

  const hole = holes[holeIndex];
  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');

  if (teamA.length !== 2 || teamB.length !== 2) {
    return {
      winnerIds: [],
      isHalved: true,
      margin: 0
    };
  }

  // Get best net score for each team (4-ball format)
  const getTeamBestScore = (team: Player[]) => {
    const teamScores = team
      .filter(player => player.scores[holeIndex] && player.scores[holeIndex] > 0)
      .map(player => {
        const grossScore = player.scores[holeIndex];
        const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
        return {
          playerId: player.id,
          playerName: player.name,
          netScore: grossScore - strokesReceived,
          grossScore
        };
      });

    if (teamScores.length === 0) return null;
    
    // Return the best (lowest) net score for the team
    return teamScores.reduce((best, current) => 
      current.netScore < best.netScore ? current : best
    );
  };

  const teamABest = getTeamBestScore(teamA);
  const teamBBest = getTeamBestScore(teamB);

  // If neither team has a score, it's halved
  if (!teamABest && !teamBBest) {
    return { winnerIds: [], isHalved: true, margin: 0 };
  }

  // If only one team has a score, they win
  if (teamABest && !teamBBest) {
    return { winnerIds: [teamABest.playerId], isHalved: false, margin: 1, teamWinner: 'A' };
  }
  if (teamBBest && !teamABest) {
    return { winnerIds: [teamBBest.playerId], isHalved: false, margin: 1, teamWinner: 'B' };
  }

  // Both teams have scores - compare them
  if (teamABest && teamBBest) {
    if (teamABest.netScore < teamBBest.netScore) {
      return { 
        winnerIds: [teamABest.playerId], 
        isHalved: false, 
        margin: teamBBest.netScore - teamABest.netScore,
        teamWinner: 'A'
      };
    } else if (teamBBest.netScore < teamABest.netScore) {
      return { 
        winnerIds: [teamBBest.playerId], 
        isHalved: false, 
        margin: teamABest.netScore - teamBBest.netScore,
        teamWinner: 'B'
      };
    } else {
      // Tied scores - hole is halved
      return { winnerIds: [teamABest.playerId, teamBBest.playerId], isHalved: true, margin: 0 };
    }
  }

  return { winnerIds: [], isHalved: true, margin: 0 };
}

export function calculateTeamMatchPlayStatus(players: Player[], holes: Hole[], currentHoleIndex: number): MatchPlayStatus {
  if (players.length !== 4) {
    return {
      leadingPlayerId: null,
      leadingPlayerName: "Not Team Play",
      margin: 0,
      isAllSquare: true,
      status: "Individual Play",
      canEnd: false,
      holesRemaining: 18 - currentHoleIndex
    };
  }

  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');

  if (teamA.length !== 2 || teamB.length !== 2) {
    return {
      leadingPlayerId: null,
      leadingPlayerName: "Invalid Teams",
      margin: 0,
      isAllSquare: true,
      status: "Check Team Setup",
      canEnd: false,
      holesRemaining: 18 - currentHoleIndex
    };
  }

  let teamHolesWon = { A: 0, B: 0 };
  
  // Count holes won by each team up to current hole
  for (let i = 0; i < Math.min(currentHoleIndex, 18); i++) {
    const holeResult = calculateTeamHoleWinner(players, i, holes);
    if (!holeResult.isHalved && holeResult.teamWinner) {
      teamHolesWon[holeResult.teamWinner]++;
    }
  }

  const teamAWins = teamHolesWon.A;
  const teamBWins = teamHolesWon.B;
  const margin = Math.abs(teamAWins - teamBWins);
  const holesRemaining = 18 - currentHoleIndex;
  
  const isAllSquare = teamAWins === teamBWins;
  const leadingTeam = teamAWins > teamBWins ? 'A' : teamBWins > teamAWins ? 'B' : null;
  
  // Can the match end early? (margin greater than holes remaining)
  const canEnd = margin > holesRemaining && holesRemaining > 0;
  
  let status = "";
  if (isAllSquare) {
    status = "All Square";
  } else if (canEnd) {
    status = `${margin} & ${holesRemaining}`;
  } else if (margin === 1) {
    status = "1 Up";
  } else {
    status = `${margin} Up`;
  }

  const teamANames = teamA.map(p => p.name);
  const teamBNames = teamB.map(p => p.name);
  const leadingTeamName = leadingTeam === 'A' ? `Team A (${teamANames.join(', ')})` : 
                         leadingTeam === 'B' ? `Team B (${teamBNames.join(', ')})` : "All Square";

  return {
    leadingPlayerId: null,
    leadingPlayerName: leadingTeamName,
    margin,
    isAllSquare,
    status,
    canEnd,
    holesRemaining,
    isTeamPlay: true,
    teamStatus: {
      leadingTeam,
      teamANames,
      teamBNames,
      status
    }
  };
}

// Six Points System Calculations for 3-player games
export interface SixPointsHoleResult {
  playerPoints: { [playerId: string]: number };
  netScores: { playerId: string; playerName: string; netScore: number; grossScore: number }[];
}

export interface SixPointsStatus {
  leadingPlayerId: string | null;
  leadingPlayerName: string;
  totalSixPoints: number;
  standings: { playerId: string; playerName: string; points: number }[];
  isThreeWayTie: boolean;
}

/** 
 * Map 3-player placements (1=best) to six-point allocation.
 * Always distributes exactly 6 points per hole.
 */
export function allocateSixPointsFromPlaces(places: number[]): number[] {
  if (!Array.isArray(places) || places.length !== 3) {
    throw new Error("places must be an array of length 3");
  }

  // Normalize input: places are 1=best, 2=next, 3=last.
  // Our tie mapping from placesFromStrokes can yield [1,1,2] for two-way tie for first
  // (since only two unique values exist). Treat [1,1,2] same as [1,1,3].

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  places.forEach(p => { counts[p] = (counts[p] ?? 0) + 1; });

  // Three-way tie
  if (counts[1] === 3) {
    return [2, 2, 2];
  }

  // Two-way tie for first: [1,1,2] (or [1,1,3] depending on mapper)
  if (counts[1] === 2) {
    // 3–3–0
    return places.map(p => (p === 1 ? 3 : 0));
  }

  // Single winner (one place=1)
  if (counts[1] === 1) {
    // Check tie for second: typically [1,2,2]
    if (counts[2] === 2) {
      // 4–1–1
      return places.map(p => (p === 1 ? 4 : 1));
    }
    // Clear 1-2-3: [1,2,3] or mapper-equivalent
    const map: Record<number, number> = { 1: 4, 2: 2, 3: 0 };
    return places.map(p => map[p] ?? 0);
  }

  // Fallback (shouldn't happen): distribute evenly
  return [2, 2, 2];
}

/** Normalize totals so the lowest becomes 0. */
export function normalizeTotals(totals: number[]): number[] {
  const min = Math.min(...totals);
  return totals.map(t => t - min);
}

/** Convert strokes to placements (1=best), preserving ties. */
function placesFromStrokes(strokes: number[]): number[] {
  if (!Array.isArray(strokes) || strokes.length !== 3) {
    throw new Error("strokes must be an array of length 3");
  }
  // Rank by value: lower is better. Ties get same place.
  const sortedVals = [...new Set([...strokes].sort((a, b) => a - b))]; // unique sorted stroke values
  // place = index in sortedVals + 1
  return strokes.map(s => sortedVals.indexOf(s) + 1);
}

// Calculate six points for a hole (3 players only) - IMPROVED VERSION
export function calculateSixPointsForHole(players: Player[], holeIndex: number, holes: Hole[]): SixPointsHoleResult {
  if (players.length !== 3 || holeIndex >= holes.length) {
    return { 
      playerPoints: {}, 
      netScores: [] 
    };
  }

  const hole = holes[holeIndex];
  const playersWithScores = players.filter(player => 
    player.scores[holeIndex] && player.scores[holeIndex] > 0
  );

  // Initialize points for all players
  const playerPoints: { [playerId: string]: number } = {};
  players.forEach(player => {
    playerPoints[player.id] = 0;
  });

  if (playersWithScores.length === 0) {
    return { playerPoints, netScores: [] };
  }

  // Calculate net scores for players with scores
  const netScores = playersWithScores.map(player => {
    const grossScore = player.scores[holeIndex];
    const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
    const netScore = grossScore - strokesReceived;
    return {
      playerId: player.id,
      playerName: player.name,
      netScore,
      grossScore
    };
  });

  // If we have exactly 3 players with scores, use the new placement-based logic
  if (netScores.length === 3) {
    const netScoresOnly = netScores.map(ns => ns.netScore);
    const places = placesFromStrokes(netScoresOnly);
    const pointsDistribution = allocateSixPointsFromPlaces(places);
    
    // Assign points back to players
    netScores.forEach((netScore, index) => {
      playerPoints[netScore.playerId] = pointsDistribution[index];
    });
  } else {
    // Fallback to original logic for incomplete holes
    const sortedNetScores = [...netScores].sort((a, b) => a.netScore - b.netScore);
    
    if (netScores.length === 1) {
      // Only one player has a score
      playerPoints[sortedNetScores[0].playerId] = 6;
    } else if (netScores.length === 2) {
      // Only two players have scores
      if (sortedNetScores[0].netScore === sortedNetScores[1].netScore) {
        // Tie between two players
        playerPoints[sortedNetScores[0].playerId] = 3;
        playerPoints[sortedNetScores[1].playerId] = 3;
      } else {
        // Different scores
        playerPoints[sortedNetScores[0].playerId] = 4;
        playerPoints[sortedNetScores[1].playerId] = 2;
      }
    }
  }

  return { playerPoints, netScores };
}

// Calculate overall six points status
export function calculateSixPointsStatus(players: Player[], currentHoleIndex: number): SixPointsStatus {
  if (players.length !== 3) {
    return {
      leadingPlayerId: null,
      leadingPlayerName: "Not 3-Player Game",
      totalSixPoints: 0,
      standings: [],
      isThreeWayTie: false
    };
  }

  // Calculate standings based on total six points
  const standings = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    points: player.totalSixPoints || 0
  })).sort((a, b) => b.points - a.points);

  const leader = standings[0];
  const isThreeWayTie = standings[0].points === standings[1].points && 
                       standings[1].points === standings[2].points;

  return {
    leadingPlayerId: leader.playerId,
    leadingPlayerName: leader.playerName,
    totalSixPoints: leader.points,
    standings,
    isThreeWayTie
  };
}

// Calculate and reset six points totals (subtract minimum from all) - FIXED VERSION
export function calculateAndResetSixPoints(players: Player[], holeIndex: number, holes: Hole[]): Player[] {
  if (players.length !== 3) {
    return players;
  }

  // First, calculate the six points for this hole
  const sixPointsResult = calculateSixPointsForHole(players, holeIndex, holes);
  
  // Update each player's six points array for this hole only
  const playersWithUpdatedHole = players.map(player => {
    const holePoints = sixPointsResult.playerPoints[player.id] || 0;
    const newSixPoints = [...(player.sixPoints || Array(18).fill(0))];
    newSixPoints[holeIndex] = holePoints;
    
    return {
      ...player,
      sixPoints: newSixPoints
    };
  });
  
  // Add this hole's points to existing cumulative totals
  const playersWithNewTotals = playersWithUpdatedHole.map(player => {
    const holePoints = sixPointsResult.playerPoints[player.id] || 0;
    const previousTotal = player.totalSixPoints || 0;
    const newTotal = previousTotal + holePoints;
    
    return {
      ...player,
      totalSixPoints: newTotal
    };
  });
  
  // Normalize: subtract the minimum from all totals (so lowest player has 0)
  const minTotal = Math.min(...playersWithNewTotals.map(p => p.totalSixPoints));
  const resetPlayers = playersWithNewTotals.map(player => ({
    ...player,
    totalSixPoints: player.totalSixPoints - minTotal
  }));
  
  console.log(`Six Points Hole ${holeIndex + 1}:`, {
    holePoints: sixPointsResult.playerPoints,
    beforeNormalization: playersWithNewTotals.map(p => ({ name: p.name, total: p.totalSixPoints })),
    afterNormalization: resetPlayers.map(p => ({ name: p.name, total: p.totalSixPoints })),
    minTotal
  });
  
  return resetPlayers;
}