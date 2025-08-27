import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ChevronLeft, ChevronRight, Check, RotateCcw, Flag, FileText, Trophy, Target } from 'lucide-react';
import type { Player, Hole, TeeBox } from '../App';
import { 
  calculateStablefordPoints, 
  getStrokesForHole,
  applyNetDoubleBogeyRule,
  calculateHoleWinner,
  calculateMatchPlayStatus,
  calculateTeamHoleWinner,
  calculateTeamMatchPlayStatus,
  calculateSixPointsForHole,
  calculateSixPointsStatus,
  calculateAndResetSixPoints,
  type MatchPlayStatus
} from '../utils/calculations';

interface HoleByHoleScoringProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  holes: Hole[];
  selectedTeeBox: TeeBox;
  currentHoleIndex: number;
  setCurrentHoleIndex: (index: number) => void;
  startHoleIndex: number;
  onFinishRound: () => void;
  onShowScorecard: () => void;
}

export function HoleByHoleScoring({ 
  players, 
  setPlayers, 
  holes, 
  selectedTeeBox,
  currentHoleIndex,
  setCurrentHoleIndex,
  startHoleIndex,
  onFinishRound,
  onShowScorecard 
}: HoleByHoleScoringProps) {
  const [holeScores, setHoleScores] = useState<{ [playerId: string]: string }>({});
  const [holeConfirmed, setHoleConfirmed] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Load current hole scores when currentHoleIndex changes
  useEffect(() => {
    // Load scores for the current hole
    const currentHoleScores: { [playerId: string]: string } = {};
    let hasExistingScores = false;
    
    players.forEach(player => {
      const score = player.scores[currentHoleIndex];
      if (score > 0) {
        currentHoleScores[player.id] = score.toString();
        hasExistingScores = true;
      }
    });
    
    setHoleScores(currentHoleScores);
    setHoleConfirmed(hasExistingScores);
  }, [currentHoleIndex, players]);

  const lastHoleIndex = (startHoleIndex + 17) % 18;
  const isLastHole = currentHoleIndex === lastHoleIndex;
  const rotationOffset = (currentHoleIndex - startHoleIndex + 18) % 18; // 0..17
  const progress = ((rotationOffset + 1) / 18) * 100;

  // Get yardage for current tee box
  const getCurrentYardage = () => {
    switch (selectedTeeBox.name.toLowerCase()) {
      case 'yellow':
        return holes[currentHoleIndex].yardages.yellow;
      case 'white':  
        return holes[currentHoleIndex].yardages.white;
      case 'blue':
        return holes[currentHoleIndex].yardages.blue;
      default:
        return holes[currentHoleIndex].yardages.white;
    }
  };

  const handleScoreChange = (playerId: string, score: string) => {
    setHoleScores(prev => ({
      ...prev,
      [playerId]: score
    }));
  };

  const confirmScores = () => {
    const updatedPlayers = players.map(player => {
      const scoreInput = holeScores[player.id] || '';
      const rawScore = scoreInput ? parseInt(scoreInput) : 0;
      
      if (rawScore > 0) {
        const newScores = [...player.scores];
        const newPoints = [...player.points];
        
        const strokesReceived = getStrokesForHole(player.courseHandicap, holes[currentHoleIndex].handicapIndex);
        // Apply net double bogey rule
        const adjustedScore = applyNetDoubleBogeyRule(rawScore, holes[currentHoleIndex].par, strokesReceived);
        
        newScores[currentHoleIndex] = adjustedScore;
        newPoints[currentHoleIndex] = calculateStablefordPoints(adjustedScore, holes[currentHoleIndex].par, strokesReceived);
        
        const totalPoints = newPoints.reduce((sum, points) => sum + points, 0);
        
        return {
          ...player,
          scores: newScores,
          points: newPoints,
          totalPoints,
          sixPoints: player.sixPoints || Array(18).fill(0),
          totalSixPoints: player.totalSixPoints || 0
        };
      }
      
      return {
        ...player,
        sixPoints: player.sixPoints || Array(18).fill(0),
        totalSixPoints: player.totalSixPoints || 0
      };
    });
    
    // For 3-player games, calculate six points with reset
    if (players.length === 3) {
      const playersWithResetSixPoints = calculateAndResetSixPoints(updatedPlayers, currentHoleIndex, holes);
      setPlayers(playersWithResetSixPoints);
    } else {
      setPlayers(updatedPlayers);
    }
    
    setHoleConfirmed(true);
    
    // Auto-advance to next hole after a brief delay to show results
    setTimeout(() => {
      setIsAdvancing(true);
      setTimeout(() => {
        if (isLastHole) {
          onFinishRound();
        } else {
          setCurrentHoleIndex((currentHoleIndex + 1) % 18);
          setHoleScores({});
          setHoleConfirmed(false);
          setIsAdvancing(false);
        }
      }, 500); // Additional 0.5 second for advancing state
    }, 1500); // 1.5 second delay to show hole results
  };

  const nextHole = () => {
    if (isLastHole) {
      onFinishRound();
    } else {
      setCurrentHoleIndex((currentHoleIndex + 1) % 18);
    }
  };

  const previousHole = () => {
    if (currentHoleIndex !== startHoleIndex) {
      setCurrentHoleIndex((currentHoleIndex + 17) % 18);
    }
  };

  const editHole = () => {
    setHoleConfirmed(false);
  };

  const handleEndRound = () => {
    // Confirm any current hole scores first if they exist
    if (!holeConfirmed && Object.keys(holeScores).length > 0) {
      const shouldConfirm = window.confirm('You have entered scores for this hole. Would you like to confirm them before ending the round?');
      if (shouldConfirm) {
        confirmScores();
      }
    }
    onFinishRound();
  };

  // Updated logic: Allow confirmation if at least one player has entered a valid score
  const canConfirm = players.some(player => {
    const score = holeScores[player.id];
    return score && parseInt(score) > 0 && parseInt(score) <= 15;
  });

  const getScoreColor = (score: number, par: number, strokesReceived: number) => {
    if (score === 0) return '';
    const netScore = score - strokesReceived;
    const diff = netScore - par;
    
    if (diff <= -2) return 'text-green-600 font-medium'; // Eagle or better
    if (diff === -1) return 'text-green-500 font-medium'; // Birdie
    if (diff === 0) return 'text-blue-600 font-medium';   // Par
    if (diff === 1) return 'text-orange-500 font-medium'; // Bogey
    return 'text-red-600 font-medium'; // Double bogey or worse
  };

  const getPlayersWithScores = () => {
    return players.filter(player => {
      const score = holeScores[player.id];
      return score && parseInt(score) > 0;
    }).length;
  };

  const getMaxScoreForPlayer = (player: Player) => {
    const strokesReceived = getStrokesForHole(player.courseHandicap, holes[currentHoleIndex].handicapIndex);
    return holes[currentHoleIndex].par + strokesReceived + 2; // USGA Net Double Bogey Rule
  };

  const calculateTotals = (updatedPlayers: Player[]) => {
    const newTotals = updatedPlayers.map(player => {
      const stablefordTotal = player.scores.reduce((total, score, index) => {
        if (score > 0 && holes[index]) {
          const hole = holes[index];
          const strokesReceived = getStrokesForHole(player.courseHandicap, hole.handicapIndex);
          return total + calculateStablefordPoints(score, hole.par, strokesReceived);
        }
        return total;
      }, 0);

      return {
        ...player,
        totalStableford: stablefordTotal
      };
    });

    // For 3-player games, calculate six points with reset
    if (newTotals.length === 3) {
      const playersWithResetSixPoints = calculateAndResetSixPoints(newTotals, currentHoleIndex, holes);
      setPlayers(playersWithResetSixPoints);
    } else {
      setPlayers(newTotals);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Progress Header */}
      <Card className="p-4 sm:p-6 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={previousHole}
            disabled={currentHoleIndex === startHoleIndex}
            className="flex-shrink-0 border-primary/20 hover:bg-primary/10 min-h-11 min-w-11 touch-manipulation"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 text-center px-2 sm:px-4">
            <h2 className="text-primary mb-1 sm:mb-2 text-2xl sm:text-3xl">Hole {holes[currentHoleIndex].number}</h2>
            <h3 className="text-muted-foreground mb-2 sm:mb-3 text-lg sm:text-xl">{holes[currentHoleIndex].name}</h3>
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-sm sm:text-lg text-muted-foreground flex-wrap">
              <span>Par {holes[currentHoleIndex].par}</span>
              <span>•</span>
              <span>{getCurrentYardage()} yds</span>
              <span>•</span>
              <span>HCP {holes[currentHoleIndex].handicapIndex}</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextHole}
            disabled={!holeConfirmed}
            className="flex-shrink-0 border-primary/20 hover:bg-primary/10 min-h-11 min-w-11 touch-manipulation"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{currentHoleIndex + 1} of 18</span>
          </div>
          <Progress value={progress} className="h-3 sm:h-2" />
        </div>
      </Card>

      {/* Current Standings */}
      <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
        <h3 className="mb-3 text-primary">Current Standings (Stableford)</h3>
        <div className="space-y-2">
          {[...players]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-primary/10">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const strokesReceived = getStrokesForHole(player.courseHandicap, holes[currentHoleIndex].handicapIndex);
                        if (strokesReceived === 0) return "No stroke";
                        if (strokesReceived === 1) return "1 stroke this hole";
                        return `${strokesReceived} strokes this hole`;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div>{player.totalPoints} pts</div>
                  <div className="text-sm text-muted-foreground">
                    Thru {rotationOffset > 0 ? rotationOffset : '-'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Match Play Status (only for 2 players) */}
      {players.length === 2 && rotationOffset > 0 && (() => {
        const matchStatus = calculateMatchPlayStatus(players, holes, rotationOffset);
        
        return (
          <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-accent" />
              <h3 className="text-accent font-semibold">Match Play</h3>
            </div>
            
            <div className="text-center">
              {matchStatus.isAllSquare ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-accent">All Square</div>
                  <div className="text-sm text-muted-foreground">
                    Match is tied after {rotationOffset} hole{rotationOffset > 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-accent">
                    {matchStatus.leadingPlayerName} {matchStatus.status}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {matchStatus.canEnd 
                      ? `Match can end on hole ${rotationOffset + 1}` 
                      : `After ${rotationOffset} hole${rotationOffset > 1 ? 's' : ''} • ${matchStatus.holesRemaining} to play`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Show individual hole results for last 3 holes */}
            {rotationOffset >= 1 && (
              <div className="mt-3 pt-3 border-t border-accent/20">
                <div className="text-xs text-muted-foreground mb-2 text-center">Recent Holes</div>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: Math.min(3, rotationOffset) }, (_, i) => {
                    const n = Math.min(3, rotationOffset);
                    const offset = rotationOffset - n + i;
                    const holeIndex = (startHoleIndex + offset) % 18;
                    const holeResult = calculateHoleWinner(players, holeIndex, holes);
                    const holeNumber = holes[holeIndex].number;
                    
                    return (
                      <div key={holeIndex} className="text-center">
                        <div className="text-xs text-muted-foreground">H{holeNumber}</div>
                        <Badge 
                          variant={holeResult.isHalved ? "outline" : "default"} 
                          className="text-xs"
                        >
                          {holeResult.isHalved 
                            ? "½" 
                            : players.find(p => p.id === holeResult.winnerIds[0])?.name.charAt(0) || "?"
                          }
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      {/* Team Match Play Status (only for 4 players with teams) */}
      {players.length === 4 && currentHoleIndex > 0 && (() => {
        const teamA = players.filter(p => p.team === 'A');
        const teamB = players.filter(p => p.team === 'B');
        
        if (teamA.length === 2 && teamB.length === 2) {
          const teamMatchStatus = calculateTeamMatchPlayStatus(players, holes, currentHoleIndex);
          
          return (
            <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-accent/20">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-accent" />
                <h3 className="text-accent font-semibold">Team Match Play</h3>
              </div>
              
              <div className="text-center">
                {teamMatchStatus.isAllSquare ? (
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-accent">All Square</div>
                    <div className="text-sm text-muted-foreground">
                      Teams are tied after {currentHoleIndex} hole{currentHoleIndex > 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-accent">
                      {teamMatchStatus.leadingPlayerName} {teamMatchStatus.status}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {teamMatchStatus.canEnd 
                        ? `Match can end on hole ${currentHoleIndex + 1}` 
                        : `After ${currentHoleIndex} hole${currentHoleIndex > 1 ? 's' : ''} • ${teamMatchStatus.holesRemaining} to play`
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Team breakdown */}
              <div className="mt-3 pt-3 border-t border-accent/20">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">Team A</div>
                    <div className="text-xs text-muted-foreground">
                      {teamA.map(p => p.name.split(' ')[0]).join(', ')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Team B</div>
                    <div className="text-xs text-muted-foreground">
                      {teamB.map(p => p.name.split(' ')[0]).join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Show team hole results for last 3 holes */}
              {currentHoleIndex >= 1 && (
                <div className="mt-3 pt-3 border-t border-accent/20">
                  <div className="text-xs text-muted-foreground mb-2 text-center">Recent Holes</div>
                  <div className="space-y-1">
                    {Array.from({ length: Math.min(3, currentHoleIndex) }, (_, i) => {
                      const holeIndex = currentHoleIndex - Math.min(3, currentHoleIndex) + i;
                      const holeNumber = holes[holeIndex].number;
                      const sixPointsResult = calculateSixPointsForHole(players, holeIndex, holes);
                      
                      return (
                        <div key={holeIndex} className="text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">H{holeNumber}:</span>
                            <div className="flex gap-1">
                              {players.map(player => (
                                <Badge 
                                  key={player.id}
                                  variant="outline" 
                                  className="text-xs px-1"
                                >
                                  {sixPointsResult.playerPoints[player.id] || 0}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        }
        return null;
      })()}

      {/* Six Points Status (only for 3 players) */}
      {players.length === 3 && currentHoleIndex > 0 && (() => {
        const sixPointsStatus = calculateSixPointsStatus(players, currentHoleIndex);
        
        return (
          <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-accent" />
              <h3 className="text-accent font-semibold">Six Points System</h3>
            </div>
            
            <div className="text-center">
              {sixPointsStatus.isThreeWayTie ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-accent">Three-Way Tie</div>
                  <div className="text-sm text-muted-foreground">
                    All players tied with {sixPointsStatus.totalSixPoints} points after {currentHoleIndex} hole{currentHoleIndex > 1 ? 's' : ''}
                  </div>
                </div>
              ) : sixPointsStatus.isTwoWayTie ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-accent">Two-Way Tie</div>
                  <div className="text-sm text-muted-foreground">
                    {sixPointsStatus.tiedPlayerNames?.join(' & ')} tied with {sixPointsStatus.totalSixPoints} points after {currentHoleIndex} hole{currentHoleIndex > 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-accent">
                    {sixPointsStatus.leadingPlayerName} Leading
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sixPointsStatus.totalSixPoints} six points after {currentHoleIndex} hole{currentHoleIndex > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Current six points standings */}
            <div className="mt-3 pt-3 border-t border-accent/20">
              <div className="space-y-1">
                {sixPointsStatus.standings.map((standing, index) => (
                  <div key={standing.playerId} className="flex justify-between items-center text-sm">
                    <span className={index === 0 ? "font-semibold" : ""}>
                      {standing.playerName}
                    </span>
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {standing.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Show six points for last 3 holes */}
            {currentHoleIndex >= 1 && (
              <div className="mt-3 pt-3 border-t border-accent/20">
                <div className="text-xs text-muted-foreground mb-2 text-center">Recent Holes</div>
                <div className="space-y-1">
                  {Array.from({ length: Math.min(3, currentHoleIndex) }, (_, i) => {
                    const holeIndex = currentHoleIndex - Math.min(3, currentHoleIndex) + i;
                    const holeNumber = holes[holeIndex].number;
                    const sixPointsResult = calculateSixPointsForHole(players, holeIndex, holes);
                    
                    return (
                      <div key={holeIndex} className="text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">H{holeNumber}:</span>
                          <div className="flex gap-1">
                            {players.map(player => (
                              <Badge 
                                key={player.id}
                                variant="outline" 
                                className="text-xs px-1"
                              >
                                {sixPointsResult.playerPoints[player.id] || 0}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      {/* Score Entry */}
      <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary">Enter Scores</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {holeConfirmed && (
                <Button variant="outline" size="sm" onClick={editHole} className="border-primary/20 hover:bg-primary/10">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Edit Scores
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShowScorecard}
                className="border-primary/20 hover:bg-primary/10"
              >
                <FileText className="h-4 w-4 mr-2" />
                Show Scorecard
              </Button>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleEndRound}
              className="bg-destructive hover:bg-destructive/90 w-full"
            >
              <Flag className="h-4 w-4 mr-2" />
              End Round
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {players.map((player) => {
            const strokesReceived = getStrokesForHole(player.courseHandicap, holes[currentHoleIndex].handicapIndex);
            const scoreInput = holeScores[player.id] || '';
            const rawScore = scoreInput ? parseInt(scoreInput) : 0;
            const score = rawScore > 0 ? applyNetDoubleBogeyRule(rawScore, holes[currentHoleIndex].par, strokesReceived) : rawScore;
            const points = score > 0 ? calculateStablefordPoints(score, holes[currentHoleIndex].par, strokesReceived) : 0;
            
            return (
              <div key={player.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div>{player.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Course HCP: {player.courseHandicap}
                      {strokesReceived > 0 && ` • ${strokesReceived} stroke${strokesReceived > 1 ? 's' : ''}`}
                      <span className="text-xs block">Max score: {getMaxScoreForPlayer(player)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="1"
                      max="15"
                      placeholder="Score"
                      value={scoreInput}
                      onChange={(e) => handleScoreChange(player.id, e.target.value)}
                      disabled={holeConfirmed}
                      className={getScoreColor(score, holes[currentHoleIndex].par, strokesReceived)}
                    />
                  </div>
                  
                  {score > 0 && (
                    <div className="flex items-center gap-2">
                      {strokesReceived > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Net: {score - strokesReceived}
                        </div>
                      )}
                      {rawScore !== score && score > 0 && (
                        <div className="text-xs text-orange-600 font-medium">
                          Net Double Bogey: {score}
                        </div>
                      )}
                      <Badge 
                        variant={points >= 3 ? "default" : points >= 2 ? "secondary" : points === 1 ? "outline" : "destructive"}
                      >
                        {points} pt{points !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!holeConfirmed && (
          <div className="mt-4 space-y-2">
            {!canConfirm && (
              <p className="text-sm text-muted-foreground text-center">
                Enter at least one score to continue
              </p>
            )}
            <Button 
              onClick={confirmScores}
              disabled={!canConfirm}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLastHole ? 'Confirm & Finish Round' : `Confirm & Continue to Hole ${holes[currentHoleIndex].number + 1}`} {canConfirm && `(${getPlayersWithScores()} player${getPlayersWithScores() > 1 ? 's' : ''})`}
            </Button>
          </div>
        )}
      </Card>

      {/* Hole Summary (only shown after confirmation) */}
      {holeConfirmed && (
        <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
          {/* Advancing indicator */}
          {isAdvancing && (
            <div className="text-center mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-primary font-semibold mb-2">
                {isLastHole ? 'Finishing Round...' : `Moving to Hole ${holes[currentHoleIndex].number + 1}...`}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          )}
          
          <h4 className="mb-3 text-center text-primary text-xl font-semibold">Hole {holes[currentHoleIndex].number} - {holes[currentHoleIndex].name} Results</h4>
          <div className="text-center text-base font-medium text-muted-foreground mb-3">
            Par {holes[currentHoleIndex].par} • {getCurrentYardage()} yards • HCP {holes[currentHoleIndex].handicapIndex}
          </div>
          
          {/* Show hole winner for match play (2 players only) */}
          {players.length === 2 && (() => {
            const holeResult = calculateHoleWinner(players, currentHoleIndex, holes);
            if (holeResult.isHalved) {
              return (
                <div className="text-center mb-3 p-2 bg-accent/10 rounded-lg border border-accent/20">
                  <span className="text-accent font-semibold">Hole Halved</span>
                </div>
              );
            } else if (holeResult.winnerIds.length === 1) {
              const winner = players.find(p => p.id === holeResult.winnerIds[0]);
              return (
                <div className="text-center mb-3 p-2 bg-accent/10 rounded-lg border border-accent/20">
                  <span className="text-accent font-semibold">
                    {winner?.name} wins hole
                    {holeResult.margin > 1 && ` by ${holeResult.margin} stroke${holeResult.margin > 1 ? 's' : ''}`}
                  </span>
                </div>
              );
            }
            return null;
          })()}
          
          {/* Show six points distribution for 3-player games */}
          {players.length === 3 && (() => {
            const sixPointsResult = calculateSixPointsForHole(players, currentHoleIndex, holes);
            const totalPoints = Object.values(sixPointsResult.playerPoints).reduce((sum, pts) => sum + pts, 0);
            
            if (totalPoints > 0) {
              return (
                <div className="text-center mb-3 p-2 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="text-accent font-semibold mb-2">Six Points Distribution</div>
                  <div className="flex justify-center gap-2 text-sm">
                    {players.map(player => {
                      const points = sixPointsResult.playerPoints[player.id] || 0;
                      return (
                        <div key={player.id} className="text-center">
                          <div>{player.name.split(' ')[0]}</div>
                          <Badge 
                            variant={points === 4 ? "default" : points >= 2 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {points}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          <div className="space-y-2">
            {players.map((player) => {
              const score = player.scores[currentHoleIndex];
              const points = player.points[currentHoleIndex];
              const sixPoints = players.length === 3 ? (player.sixPoints?.[currentHoleIndex] || 0) : null;
              const strokesReceived = getStrokesForHole(player.courseHandicap, holes[currentHoleIndex].handicapIndex);
              
              return (
                <div key={player.id} className="flex items-center justify-between p-2 rounded bg-secondary/50 border border-primary/10">
                  <span>{player.name}</span>
                  <div className="flex items-center gap-2 text-sm">
                    {score > 0 ? (
                      <>
                        <span className={getScoreColor(score, holes[currentHoleIndex].par, strokesReceived)}>
                          {score}
                        </span>
                        {strokesReceived > 0 && (
                          <span className="text-muted-foreground">
                            (Net: {score - strokesReceived})
                          </span>
                        )}
                        {/* Show if score was adjusted by net double bogey rule */}
                        {(() => {
                          const originalScore = holeScores[player.id] ? parseInt(holeScores[player.id]) : 0;
                          const maxScore = holes[currentHoleIndex].par + strokesReceived + 2;
                          return originalScore > maxScore && score > 0 ? (
                            <span className="text-xs text-orange-600 ml-1">
                              (Max: {maxScore})
                            </span>
                          ) : null;
                        })()}
                        <Badge variant={points >= 3 ? "default" : points >= 2 ? "secondary" : points === 1 ? "outline" : "destructive"}>
                          {points} pt{points !== 1 ? 's' : ''}
                        </Badge>
                        {sixPoints !== null && (
                          <Badge 
                            variant={sixPoints === 4 ? "default" : sixPoints >= 2 ? "secondary" : "outline"}
                            className="bg-accent/20 text-accent border-accent/30"
                          >
                            {sixPoints} 6pts
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">No score entered</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}