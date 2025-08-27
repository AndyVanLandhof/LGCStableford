import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Trash2, Plus, Play, AlertCircle, Users, Shuffle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import type { Player, TeeBox } from '../types';
import { calculateCourseHandicap } from '../utils/calculations';

interface PlayerSetupProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  teeBoxes: TeeBox[];
  selectedTeeBox: TeeBox;
  onTeeBoxChange: (teeBox: TeeBox) => void;
  gameDate: string;
  onDateChange: (date: string) => void;
  startHoleIndex: number; // 0-based: 0 => Hole 1, 9 => Hole 10
  onStartHoleChange: (index: number) => void;
  onStartGame: () => void;
}

export function PlayerSetup({ 
  players, 
  setPlayers, 
  teeBoxes, 
  selectedTeeBox, 
  onTeeBoxChange,
  gameDate,
  onDateChange,
  startHoleIndex,
  onStartHoleChange,
  onStartGame 
}: PlayerSetupProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerHandicap, setNewPlayerHandicap] = useState('');
  const [error, setError] = useState('');

  const parseHandicap = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed)) return null;
    
    // Round to 1 decimal place
    return Math.round(parsed * 10) / 10;
  };

  const addPlayer = () => {
    // Clear any previous errors
    setError('');
    
    // Validate inputs
    if (!newPlayerName.trim()) {
      setError('Please enter a player name');
      return;
    }
    
    if (!newPlayerHandicap.trim()) {
      setError('Please enter a handicap index');
      return;
    }
    
    if (players.length >= 4) {
      setError('Maximum 4 players allowed');
      return;
    }
    
    const handicapIndex = parseHandicap(newPlayerHandicap);
    if (handicapIndex === null) {
      setError('Please enter a valid handicap number');
      return;
    }
    
    if (handicapIndex < 0 || handicapIndex > 54) {
      setError('Handicap index must be between 0 and 54');
      return;
    }

    // Check for duplicate names
    if (players.some(player => player.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      setError('Player name already exists');
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      handicapIndex: handicapIndex,
      scores: Array(18).fill(0),
      points: Array(18).fill(0),
      totalPoints: 0,
      courseHandicap: calculateCourseHandicap(handicapIndex, selectedTeeBox.slopeRating),
      sixPoints: Array(18).fill(0),
      totalSixPoints: 0
    };
    
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setNewPlayerHandicap('');
    setError('');
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(player => player.id !== playerId));
  };

  const updatePlayerHandicap = (playerId: string, value: string) => {
    const handicapIndex = parseHandicap(value);
    if (handicapIndex === null || handicapIndex < 0 || handicapIndex > 54) return;
    
    setPlayers(players.map(player => 
      player.id === playerId 
        ? { 
            ...player, 
            handicapIndex,
            courseHandicap: calculateCourseHandicap(handicapIndex, selectedTeeBox.slopeRating)
          }
        : player
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPlayer();
    }
  };

  const handleTeeBoxChange = (teeBoxName: string) => {
    const teeBox = teeBoxes.find(tb => tb.name === teeBoxName);
    if (teeBox) {
      onTeeBoxChange(teeBox);
      // Recalculate course handicaps for existing players
      setPlayers(players.map(player => ({
        ...player,
        courseHandicap: calculateCourseHandicap(player.handicapIndex, teeBox.slopeRating)
      })));
    }
  };

  const handleStartGame = () => {
    console.log('Start Game clicked, players:', players);
    onStartGame();
  };

  const assignPlayerToTeam = (playerId: string, team: 'A' | 'B') => {
    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, team } : player
    ));
  };

  const removePlayerFromTeam = (playerId: string) => {
    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, team: undefined } : player
    ));
  };

  const autoAssignTeams = () => {
    if (players.length !== 4) return;
    
    // Sort players by handicap for balanced teams
    const sortedPlayers = [...players].sort((a, b) => a.handicapIndex - b.handicapIndex);
    
    // Assign teams in alternating pattern for balance
    const updatedPlayers = players.map(player => {
      const index = sortedPlayers.findIndex(p => p.id === player.id);
      return {
        ...player,
        team: (index % 2 === 0 ? 'A' : 'B') as 'A' | 'B'
      };
    });
    
    setPlayers(updatedPlayers);
  };

  const clearTeams = () => {
    setPlayers(players.map(player => ({ ...player, team: undefined })));
  };

  const getTeamAssignments = () => {
    const teamA = players.filter(p => p.team === 'A');
    const teamB = players.filter(p => p.team === 'B');
    return { teamA, teamB };
  };

  const canAddPlayer = newPlayerName.trim() && newPlayerHandicap.trim() && players.length < 4;
  const isTeamPlayPossible = players.length === 4;
  const { teamA, teamB } = getTeamAssignments();
  const hasCompleteTeams = teamA.length === 2 && teamB.length === 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4">Setup Game</h2>
        <p className="text-muted-foreground mb-4">
          Set the date, select tee box and add up to 4 players with their handicaps
        </p>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label htmlFor="game-date">Game Date</Label>
        <Input
          id="game-date"
          type="date"
          value={gameDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Tee Box Selection */}
      <div className="space-y-3">
        <Label htmlFor="tee-box">Tee Box</Label>
        <Select value={selectedTeeBox.name} onValueChange={handleTeeBoxChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select tee box" />
          </SelectTrigger>
          <SelectContent>
            {teeBoxes.map((teeBox) => (
              <SelectItem key={teeBox.name} value={teeBox.name}>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      teeBox.color === 'yellow' ? 'bg-yellow-400' :
                      teeBox.color === 'white' ? 'bg-gray-100 border border-gray-400' :
                      teeBox.color === 'red' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                  />
                  {teeBox.name} Tees
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          Course Rating: {selectedTeeBox.courseRating} | Slope: {selectedTeeBox.slopeRating}
        </div>
      </div>

      {/* Starting Tee Selection */}
      <div className="space-y-3">
        <Label htmlFor="start-hole">Starting Tee</Label>
        <div className="flex gap-2">
          <Button
            variant={startHoleIndex === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStartHoleChange(0)}
          >
            Hole 1
          </Button>
          <Button
            variant={startHoleIndex === 9 ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStartHoleChange(9)}
          >
            Hole 10
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Choose which tee to start on.</p>
      </div>

      {/* Add Player */}
      <div className="space-y-3">
        <Label>Add Player {players.length + 1}</Label>
        <div className="space-y-2">
          <Input
            placeholder={`Player ${players.length + 1} name`}
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={20}
          />
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Handicap (e.g. 12.5)"
              value={newPlayerHandicap}
              onChange={(e) => setNewPlayerHandicap(e.target.value)}
              onKeyPress={handleKeyPress}
              inputMode="decimal"
            />
            <Button 
              onClick={addPlayer}
              disabled={!canAddPlayer}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {players.length >= 4 && (
          <p className="text-sm text-muted-foreground">Maximum 4 players allowed</p>
        )}
      </div>

      {/* Players List */}
      {players.length > 0 && (
        <div className="space-y-3">
          <Label>Players ({players.length}/4)</Label>
          {players.map((player, index) => (
            <Card key={player.id} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{player.name}</span>
                  {player.team && (
                    <Badge 
                      variant={player.team === 'A' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      Team {player.team}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlayer(player.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`handicap-${player.id}`} className="text-xs">
                    Handicap Index:
                  </Label>
                  <Input
                    id={`handicap-${player.id}`}
                    type="text"
                    value={player.handicapIndex.toString()}
                    onChange={(e) => updatePlayerHandicap(player.id, e.target.value)}
                    className="w-20 h-8"
                    inputMode="decimal"
                  />
                </div>
                <div className="text-muted-foreground">
                  Course Handicap: {player.courseHandicap}
                </div>
              </div>
              
              {/* Team Assignment Buttons (only for 4 players) */}
              {isTeamPlayPossible && (
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-xs">Team:</Label>
                  <Button
                    variant={player.team === 'A' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => 
                      player.team === 'A' 
                        ? removePlayerFromTeam(player.id)
                        : assignPlayerToTeam(player.id, 'A')
                    }
                    disabled={player.team !== 'A' && teamA.length >= 2}
                  >
                    A
                  </Button>
                  <Button
                    variant={player.team === 'B' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => 
                      player.team === 'B' 
                        ? removePlayerFromTeam(player.id)
                        : assignPlayerToTeam(player.id, 'B')
                    }
                    disabled={player.team !== 'B' && teamB.length >= 2}
                  >
                    B
                  </Button>
                  {player.team && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayerFromTeam(player.id)}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Team Setup Section (only for 4 players) */}
      {isTeamPlayPossible && (
        <div className="space-y-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <Label className="text-accent font-semibold">Team Match Play (Optional)</Label>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Assign players to teams for 4-ball match play. Each team's best score on each hole counts.
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={autoAssignTeams}
              className="border-accent/20 hover:bg-accent/10"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Auto Assign Teams
            </Button>
            
            {(teamA.length > 0 || teamB.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTeams}
                className="text-muted-foreground"
              >
                Clear Teams
              </Button>
            )}
          </div>
          
          {/* Team Display */}
          {(teamA.length > 0 || teamB.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Team A ({teamA.length}/2)</Label>
                <div className="space-y-1">
                  {teamA.map(player => (
                    <div key={player.id} className="text-sm p-2 bg-primary/10 rounded border">
                      <span className="font-medium">{player.name}</span> (HCP: {player.handicapIndex})
                    </div>
                  ))}
                  {teamA.length < 2 && (
                    <div className="text-xs text-muted-foreground p-2 border-2 border-dashed rounded">
                      Assign a player
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Team B ({teamB.length}/2)</Label>
                <div className="space-y-1">
                  {teamB.map(player => (
                    <div key={player.id} className="text-sm p-2 bg-secondary/50 rounded border">
                      <span className="font-medium">{player.name}</span> (HCP: {player.handicapIndex})
                    </div>
                  ))}
                  {teamB.length < 2 && (
                    <div className="text-xs text-muted-foreground p-2 border-2 border-dashed rounded">
                      Assign a player
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {hasCompleteTeams && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Teams are ready! Team match play will track the best score from each team on every hole.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <Button 
        onClick={handleStartGame}
        disabled={players.length === 0}
        className="w-full"
        size="lg"
      >
        <Play className="h-4 w-4 mr-2" />
        Start Game {players.length > 0 && `(${players.length} player${players.length > 1 ? 's' : ''})`}
      </Button>
      
      {players.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Add at least one player to start the game
        </p>
      )}
    </div>
  );
}