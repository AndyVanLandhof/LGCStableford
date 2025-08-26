import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Player, Hole, TeeBox } from '../types';
import { calculateStablefordPoints, getStrokesForHole, applyNetDoubleBogeyRule } from '../utils/calculations';

interface PDFScorecardProps {
  players: Player[];
  holes: Hole[];
  selectedTeeBox: TeeBox;
  gameDate?: string;
}

export function PDFScorecard({ players, holes, selectedTeeBox, gameDate }: PDFScorecardProps) {
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

  // Calculate totals for a player for a nine
  const calculateNineTotals = (player: Player, startIndex: number, nineHoles: Hole[]) => {
    const nineScores = player.scores.slice(startIndex, startIndex + 9);
    const ninePoints = player.points.slice(startIndex, startIndex + 9);
    
    const nineStrokes = nineHoles.reduce((sum, hole, index) => {
      const score = player.scores[startIndex + index];
      if (score > 0) {
        return sum + getStrokesForHole(player.courseHandicap, hole.handicapIndex);
      }
      return sum;
    }, 0);
    
    const nineGross = nineScores.reduce((sum, score) => sum + (score || 0), 0);
    const nineNet = nineGross > 0 ? nineGross - nineStrokes : 0;
    const nineTotalPoints = ninePoints.reduce((sum, points) => sum + points, 0);
    
    return { nineGross, nineStrokes, nineNet, nineTotalPoints };
  };

  const getScoreColor = (score: number, hole: Hole, player: Player) => {
    if (score === 0) return 'text-gray-400';
    const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
    const netScore = score - strokesReceived;
    const diff = netScore - hole.par;
    if (diff <= -2) return 'text-green-700 font-semibold';
    if (diff === -1) return 'text-green-600 font-semibold';
    if (diff === 0) return 'text-blue-600 font-semibold';
    if (diff === 1) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getPointsColor = (points: number) => {
    if (points === 0) return 'bg-red-600 text-white';
    if (points === 1) return 'bg-orange-500 text-white';
    if (points === 2) return 'bg-blue-600 text-white';
    if (points === 3) return 'bg-green-600 text-white';
    if (points >= 4) return 'bg-green-700 text-white';
    return 'bg-gray-400 text-white';
  };

  // Split holes into front 9 and back 9
  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9, 18);

  const renderNineColumn = (nineHoles: Hole[], startIndex: number, title: string) => (
    <div className="flex-1">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-center border-b-2 border-gray-300 pb-2">{title}</h3>
      </div>
      
      <table className="w-full text-sm border-collapse">
        {/* Header row */}
        <thead>
          <tr className="border-b-2 border-gray-400">
            <th className="text-left p-2 border-r border-gray-300 w-16">Hole</th>
            <th className="text-center p-1 border-r border-gray-300 w-12">Par</th>
            <th className="text-center p-1 border-r border-gray-300 w-12">HCP</th>
            <th className="text-center p-1 border-r border-gray-300 w-14">Yds</th>
            {players.map((player) => (
              <th key={player.id} className="text-center p-1 border-r border-gray-300 min-w-20">
                <div className="font-semibold text-xs">{player.name}</div>
                <div className="text-xs text-gray-600">HCP {player.courseHandicap}</div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {/* Each hole row */}
          {nineHoles.map((hole, index) => {
            const holeIndex = startIndex + index;
            return (
              <tr key={hole.number} className="border-b border-gray-200">
                <td className="p-2 border-r border-gray-300 font-semibold">{hole.number}</td>
                <td className="text-center p-1 border-r border-gray-300 font-semibold">{hole.par}</td>
                <td className="text-center p-1 border-r border-gray-300 text-xs">{hole.handicapIndex}</td>
                <td className="text-center p-1 border-r border-gray-300 text-xs">{getYardageForTeeBox(hole)}</td>
                
                {/* Player scores */}
                {players.map((player) => {
                  const rawScore = player.scores[holeIndex];
                  const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
                  const score = rawScore > 0 ? applyNetDoubleBogeyRule(rawScore, hole.par, strokesReceived) : rawScore;
                  const points = player.points[holeIndex];
                  const netScore = score > 0 ? score - strokesReceived : 0;
                  
                  return (
                    <td key={player.id} className="p-1 text-center border-r border-gray-300">
                      <div className="space-y-1">
                        {/* Gross Score */}
                        <div className={`text-base font-semibold ${getScoreColor(score, hole, player)}`}>
                          {score > 0 ? score : '-'}
                          {strokesReceived > 0 && score > 0 && (
                            <span className="text-xs text-gray-500 ml-1">•{strokesReceived}</span>
                          )}
                        </div>
                        
                        {/* Net Score */}
                        {netScore > 0 && (
                          <div className="text-xs text-gray-600">Net: {netScore}</div>
                        )}
                        
                        {/* Points */}
                        {points > 0 ? (
                          <div className={`text-xs px-1 py-0.5 rounded ${getPointsColor(points)}`}>
                            {points}pt{points !== 1 ? 's' : ''}
                          </div>
                        ) : score > 0 ? (
                          <div className="text-xs px-1 py-0.5 rounded bg-red-600 text-white">0pts</div>
                        ) : (
                          <div className="text-xs text-gray-400">-</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          
          {/* Totals row */}
          <tr className="border-t-2 border-gray-400 bg-gray-100">
            <td className="p-2 border-r border-gray-300 font-bold">OUT/IN</td>
            <td className="text-center p-1 border-r border-gray-300 font-bold">
              {nineHoles.reduce((sum, hole) => sum + hole.par, 0)}
            </td>
            <td className="text-center p-1 border-r border-gray-300"></td>
            <td className="text-center p-1 border-r border-gray-300 text-xs">
              {nineHoles.reduce((total, hole) => total + getYardageForTeeBox(hole), 0)}
            </td>
            
            {players.map((player) => {
              const totals = calculateNineTotals(player, startIndex, nineHoles);
              
              return (
                <td key={player.id} className="p-1 text-center border-r border-gray-300">
                  <div className="space-y-1">
                    {/* Gross Total */}
                    <div className="text-base font-bold">
                      {totals.nineGross > 0 ? totals.nineGross : '-'}
                      {totals.nineStrokes > 0 && totals.nineGross > 0 && (
                        <span className="text-xs text-gray-500 ml-1">({totals.nineStrokes})</span>
                      )}
                    </div>
                    
                    {/* Net Total */}
                    {totals.nineNet > 0 && (
                      <div className="text-xs text-gray-600">Net: {totals.nineNet}</div>
                    )}
                    
                    {/* Points Total */}
                    <div className="text-xs px-1 py-0.5 rounded bg-blue-600 text-white font-semibold">
                      {totals.nineTotalPoints} pts
                    </div>
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Calculate overall totals
  const calculateOverallTotals = (player: Player) => {
    const totalGross = player.scores.reduce((sum, score) => sum + (score || 0), 0);
    const totalStrokes = holes.reduce((sum, hole, index) => {
      const score = player.scores[index];
      if (score > 0) {
        return sum + getStrokesForHole(player.courseHandicap, hole.handicapIndex);
      }
      return sum;
    }, 0);
    const totalNet = totalGross > 0 ? totalGross - totalStrokes : 0;
    return { totalGross, totalStrokes, totalNet };
  };

  const totalYardage = holes.reduce((total, hole) => total + getYardageForTeeBox(hole), 0);
  
  // Format date for display
  const formatDisplayDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const displayDate = formatDisplayDate(gameDate);

  return (
    <div className="max-w-full mx-auto bg-white text-black p-6" style={{ fontSize: '14px', lineHeight: '1.4' }}>
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-gray-400 pb-4">
        <h1 className="text-2xl font-bold text-green-800 mb-2">Liphook Golf Club</h1>
        <h2 className="text-lg font-semibold mb-2">Stableford Scorecard</h2>
        <div className="text-sm space-y-1">
          <div>Date: {date}</div>
          <div>Tee Box: {selectedTeeBox.name} (Course Rating: {selectedTeeBox.courseRating}, Slope: {selectedTeeBox.slopeRating})</div>
          <div>Par: 70 • Total Yardage: {totalYardage} yards</div>
        </div>
      </div>

      {/* Player Names */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Players:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {players.map((player, index) => (
            <div key={player.id}>
              {index + 1}. {player.name} (Handicap Index: {player.handicapIndex}, Course Handicap: {player.courseHandicap})
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout for Front 9 and Back 9 */}
      <div className="flex gap-6 mb-6">
        {renderNineColumn(frontNine, 0, "Front 9")}
        {renderNineColumn(backNine, 9, "Back 9")}
      </div>

      {/* Overall Totals */}
      <div className="border-t-2 border-gray-400 pt-4">
        <h3 className="font-semibold mb-3 text-center">18-Hole Summary</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="text-left p-2 border-r border-gray-300">Player</th>
              <th className="text-center p-2 border-r border-gray-300">Total Gross</th>
              <th className="text-center p-2 border-r border-gray-300">Total Net</th>
              <th className="text-center p-2">Stableford Points</th>
            </tr>
          </thead>
          <tbody>
            {[...players]
              .sort((a, b) => b.totalPoints - a.totalPoints)
              .map((player, index) => {
                const totals = calculateOverallTotals(player);
                return (
                  <tr key={player.id} className={`border-b border-gray-200 ${index === 0 ? 'bg-yellow-100' : ''}`}>
                    <td className="p-2 border-r border-gray-300 font-semibold">
                      {index === 0 && '🏆 '}{player.name}
                    </td>
                    <td className="text-center p-2 border-r border-gray-300">
                      {totals.totalGross > 0 ? `${totals.totalGross} (${totals.totalStrokes})` : '-'}
                    </td>
                    <td className="text-center p-2 border-r border-gray-300">
                      {totals.totalNet > 0 ? totals.totalNet : '-'}
                    </td>
                    <td className="text-center p-2 font-bold text-lg">
                      {player.totalPoints}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 text-xs border-t border-gray-300 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Stableford Scoring:</h4>
            <div className="space-y-1">
              <div>Net Double Eagle (-3): 5 pts</div>
              <div>Net Eagle (-2): 4 pts</div>
              <div>Net Birdie (-1): 3 pts</div>
              <div>Net Par (0): 2 pts</div>
              <div>Net Bogey (+1): 1 pt</div>
              <div>Net Double Bogey (+2): 0 pts</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Notes:</h4>
            <div className="space-y-1">
              <div>• Course Handicap = (Handicap Index × Slope) ÷ 113</div>
              <div>• Stroke allocations shown with • symbol</div>
              <div>• USGA Net Double Bogey Rule applied</div>
              <div>• Maximum score = Par + Strokes + 2</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}