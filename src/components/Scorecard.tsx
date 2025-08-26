import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScoreEntry } from './ScoreEntry';
import type { Player, Hole, TeeBox } from '../types';
import { calculateStablefordPoints, getStrokesForHole, applyNetDoubleBogeyRule } from '../utils/calculations';

interface ScorecardProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  holes: Hole[];
  selectedTeeBox: TeeBox;
  gameDate?: string;
}

export function Scorecard({ players, setPlayers, holes, selectedTeeBox, gameDate }: ScorecardProps) {
  const updatePlayerScore = (playerId: string, holeIndex: number, score: number) => {
    setPlayers(players.map(player => {
      if (player.id !== playerId) return player;
      
      const newScores = [...player.scores];
      const newPoints = [...player.points];
      
      if (score > 0) {
        const hole = holes[holeIndex];
        const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
        // Apply net double bogey rule
        const adjustedScore = applyNetDoubleBogeyRule(score, hole.par, strokesReceived);
        newScores[holeIndex] = adjustedScore;
        newPoints[holeIndex] = calculateStablefordPoints(adjustedScore, hole.par, strokesReceived);
      } else {
        newScores[holeIndex] = score;
        newPoints[holeIndex] = 0;
      }
      
      const totalPoints = newPoints.reduce((sum, points) => sum + points, 0);
      
      return {
        ...player,
        scores: newScores,
        points: newPoints,
        totalPoints
      };
    }));
  };

  // Get yardage for current tee box
  const getYardageForTeeBox = (hole: Hole) => {
    switch (selectedTeeBox.name.toLowerCase()) {
      case 'yellow':
        return hole.yardages.yellow;
      case 'white':
        return hole.yardages.white;
      case 'blue':
        return hole.yardages.blue;
      case 'red':
        return hole.yardages.red || hole.yardages.white;
      default:
        return hole.yardages.white;
    }
  };

  // Calculate totals for a player
  const calculateTotals = (player: Player) => {
    const front9Scores = player.scores.slice(0, 9);
    const back9Scores = player.scores.slice(9, 18);
    const front9Points = player.points.slice(0, 9);
    const back9Points = player.points.slice(9, 18);
    
    // Split holes into front 9 and back 9
    const frontNine = holes.slice(0, 9);
    const backNine = holes.slice(9, 18);
    
    // Calculate strokes only for holes that have been played (score > 0)
    const front9Strokes = frontNine.reduce((sum, hole, index) => {
      const score = player.scores[index];
      if (score > 0) {
        return sum + getStrokesForHole(player.courseHandicap, hole.handicapIndex);
      }
      return sum;
    }, 0);
    
    const back9Strokes = backNine.reduce((sum, hole, index) => {
      const score = player.scores[9 + index]; // Back 9 starts at index 9
      if (score > 0) {
        return sum + getStrokesForHole(player.courseHandicap, hole.handicapIndex);
      }
      return sum;
    }, 0);
    
    const totalStrokes = holes.reduce((sum, hole, index) => {
      const score = player.scores[index];
      if (score > 0) {
        return sum + getStrokesForHole(player.courseHandicap, hole.handicapIndex);
      }
      return sum;
    }, 0);
    
    // Calculate gross scores for each nine
    const front9Gross = front9Scores.reduce((sum, score) => sum + (score || 0), 0);
    const back9Gross = back9Scores.reduce((sum, score) => sum + (score || 0), 0);
    const totalGross = player.scores.reduce((sum, score) => sum + (score || 0), 0);
    
    const front9Net = front9Gross > 0 ? front9Gross - front9Strokes : 0;
    const back9Net = back9Gross > 0 ? back9Gross - back9Strokes : 0;
    const totalNet = totalGross > 0 ? totalGross - totalStrokes : 0;
    
    return {
      front9Gross,
      back9Gross,
      totalGross,
      front9Points: front9Points.reduce((sum, points) => sum + points, 0),
      back9Points: back9Points.reduce((sum, points) => sum + points, 0),
      totalPoints: player.totalPoints,
      front9Strokes,
      back9Strokes,
      totalStrokes,
      front9Net,
      back9Net,
      totalNet
    };
  };

  // Split holes into front 9 and back 9
  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9, 18);

  const getScoreColor = (score: number, hole: Hole, player: Player) => {
    if (score === 0) return 'text-muted-foreground';
    const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
    const netScore = score - strokesReceived;
    const diff = netScore - hole.par;
    if (diff <= -2) return 'text-green-600 font-medium';
    if (diff === -1) return 'text-green-500 font-medium';
    if (diff === 0) return 'text-blue-600 font-medium';
    if (diff === 1) return 'text-orange-500 font-medium';
    return 'text-red-600 font-medium';
  };

  const getPointsVariant = (points: number) => {
    if (points === 0) return 'destructive';
    if (points === 1) return 'secondary';
    if (points === 2) return 'outline';
    if (points === 3) return 'default';
    if (points >= 4) return 'default';
    return 'secondary';
  };

  const renderNine = (nineHoles: Hole[], startIndex: number, title: string) => (
    <Card className="p-4 mb-6">
      <h3 className="mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header row with players */}
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 w-32">Hole</th>
              {players.map((player) => (
                <th key={player.id} className="text-center p-2 min-w-20">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">HCP {player.courseHandicap}</div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {/* Each hole gets its own row */}
            {nineHoles.map((hole, index) => {
              const holeIndex = startIndex + index;
              return (
                <tr key={hole.number} className="border-b border-border/50">
                  <td className="p-2 w-32">
                    <div className="space-y-1">
                      <div className="font-medium">{hole.number}. {hole.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Par {hole.par} • {getYardageForTeeBox(hole)} yds • HCP {hole.handicapIndex}
                      </div>
                    </div>
                  </td>
                  
                  {/* Each player gets a column */}
                  {players.map((player) => {
                    const rawScore = player.scores[holeIndex];
                    const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
                    const score = rawScore > 0 ? applyNetDoubleBogeyRule(rawScore, hole.par, strokesReceived) : rawScore;
                    const points = player.points[holeIndex];
                    const netScore = score > 0 ? score - strokesReceived : 0;
                    
                    return (
                      <td key={player.id} className="p-2 text-center min-w-20">
                        <div className="space-y-1">
                          {/* Gross Score */}
                          <div className={`text-base font-medium ${getScoreColor(score, hole, player)}`}>
                            {score > 0 ? score : '-'}
                            {strokesReceived > 0 && score > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                •{strokesReceived}
                              </span>
                            )}
                          </div>
                          
                          {/* Net Score */}
                          {netScore > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Net: {netScore}
                            </div>
                          )}
                          
                          {/* Points */}
                          {points > 0 ? (
                            <Badge variant={getPointsVariant(points)} className="text-xs">
                              {points} pt{points !== 1 ? 's' : ''}
                            </Badge>
                          ) : score > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              0 pts
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            
            {/* Totals row */}
            <tr className="border-t-2 border-primary/20 bg-secondary/30">
              <td className="p-2 font-medium">
                <div>Total</div>
                <div className="text-xs text-muted-foreground">Par {nineHoles.reduce((sum, hole) => sum + hole.par, 0)}</div>
              </td>
              
              {players.map((player) => {
                const totals = calculateTotals(player);
                const nineGross = startIndex === 0 ? totals.front9Gross : totals.back9Gross;
                const nineStrokes = startIndex === 0 ? totals.front9Strokes : totals.back9Strokes;
                const nineNet = startIndex === 0 ? totals.front9Net : totals.back9Net;
                const ninePoints = startIndex === 0 ? totals.front9Points : totals.back9Points;
                
                return (
                  <td key={player.id} className="p-2 text-center font-medium">
                    <div className="space-y-1">
                      {/* Gross Total */}
                      <div className="text-base">
                        {nineGross > 0 ? nineGross : '-'}
                        {nineStrokes > 0 && nineGross > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({nineStrokes})
                          </span>
                        )}
                      </div>
                      
                      {/* Net Total */}
                      {nineNet > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Net: {nineNet}
                        </div>
                      )}
                      
                      {/* Points Total */}
                      <Badge variant="secondary" className="font-medium">
                        {ninePoints} pts
                      </Badge>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );

  // Calculate total yardage for the course from selected tee box
  const totalYardage = holes.reduce((total, hole) => total + getYardageForTeeBox(hole), 0);

  // Format date for display
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Total scores card */}
      <Card className="p-4">
        <h2 className="mb-4">Final Leaderboard</h2>
        <div className="space-y-3">
          {[...players]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((player, index) => {
              const totals = calculateTotals(player);
              return (
                <div key={player.id} className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-4">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        HCP: {player.handicapIndex} (Course: {player.courseHandicap})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">{player.totalPoints} pts</div>
                    <div className="text-sm text-muted-foreground">
                      Front: {totals.front9Points} | Back: {totals.back9Points}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Gross: {totals.totalGross > 0 ? totals.totalGross : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Front 9 */}
      {renderNine(frontNine, 0, "Front 9")}

      {/* Back 9 */}
      {renderNine(backNine, 9, "Back 9")}

      {/* 18-Hole Summary */}
      <Card className="p-4">
        <h3 className="mb-4">18-Hole Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2">Player</th>
                <th className="text-center p-2">Front 9</th>
                <th className="text-center p-2">Back 9</th>
                <th className="text-center p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...players]
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((player, index) => {
                  const totals = calculateTotals(player);
                  return (
                    <tr key={player.id} className={`border-b border-border ${index === 0 ? 'bg-primary/10' : ''}`}>
                      <td className="p-2 font-medium">{player.name}</td>
                      <td className="text-center p-2">
                        <div>Gross: {totals.front9Gross > 0 ? totals.front9Gross : '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          Strokes: ({totals.front9Strokes})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Net: {totals.front9Net > 0 ? totals.front9Net : '-'}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {totals.front9Points} pts
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <div>Gross: {totals.back9Gross > 0 ? totals.back9Gross : '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          Strokes: ({totals.back9Strokes})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Net: {totals.back9Net > 0 ? totals.back9Net : '-'}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {totals.back9Points} pts
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <div className="font-medium">Gross: {totals.totalGross > 0 ? totals.totalGross : '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          Strokes: ({totals.totalStrokes})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Net: {totals.totalNet > 0 ? totals.totalNet : '-'}
                        </div>
                        <Badge variant={index === 0 ? "default" : "secondary"} className="font-medium mt-1">
                          {totals.totalPoints} pts
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Course information */}
      <Card className="p-4">
        <h3 className="mb-3">Liphook Golf Club Course Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            {gameDate && <div>Date: {formatDisplayDate(gameDate)}</div>}
            <div>Tee Box: {selectedTeeBox.name}</div>
            <div>Course Rating: {selectedTeeBox.courseRating}</div>
            <div>Slope Rating: {selectedTeeBox.slopeRating}</div>
            <div>Par: 70 (4 Par 3s, 10 Par 4s, 4 Par 5s)</div>
            <div>Total Yardage: {totalYardage} yards</div>
          </div>
          <div>
            <div>Course Handicap = (Handicap Index × Slope) ÷ 113</div>
            <div className="text-muted-foreground">Rounded to nearest whole number</div>
          </div>
        </div>
        
        <h4 className="mb-2">Stableford Scoring (Net Score)</h4>
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>Net Double Eagle (-3): 5 pts</div>
          <div>Net Eagle (-2): 4 pts</div>
          <div>Net Birdie (-1): 3 pts</div>
          <div>Net Par (0): 2 pts</div>
          <div>Net Bogey (+1): 1 pt</div>
          <div>Net Double Bogey (+2): 0 pts</div>
        </div>
        
        <h4 className="mb-2">USGA Net Double Bogey Rule</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Maximum score per hole = Par + Handicap Strokes + 2</div>
          <div className="text-xs">Examples: Par 4 (no strokes) = max 6 • Par 5 (1 stroke) = max 8</div>
          <div className="text-xs">Scores exceeding this limit are automatically adjusted down.</div>
        </div>
      </Card>
    </div>
  );
}