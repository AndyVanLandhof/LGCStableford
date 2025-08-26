import { useState } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface ScoreEntryProps {
  score: number;
  points: number;
  par: number;
  strokesReceived: number;
  onScoreChange: (score: number) => void;
}

export function ScoreEntry({ score, points, par, strokesReceived, onScoreChange }: ScoreEntryProps) {
  const [inputValue, setInputValue] = useState(score > 0 ? score.toString() : '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 15) {
      onScoreChange(numValue);
    } else if (value === '') {
      onScoreChange(0);
    }
  };

  const getPointsColor = () => {
    if (points === 0) return 'destructive';
    if (points === 1) return 'secondary';
    if (points === 2) return 'outline';
    if (points === 3) return 'default';
    if (points >= 4) return 'default';
    return 'secondary';
  };

  const getScoreRelation = () => {
    if (score === 0) return '';
    const netScore = score - strokesReceived;
    const diff = netScore - par;
    if (diff < 0) return 'text-green-600';
    if (diff === 0) return 'text-blue-600';
    if (diff === 1) return 'text-orange-500';
    return 'text-red-600';
  };

  const netScore = score > 0 ? score - strokesReceived : 0;

  return (
    <div className="space-y-1">
      <Input
        type="number"
        min="1"
        max="15"
        value={inputValue}
        onChange={handleInputChange}
        className={`w-full text-center h-8 ${getScoreRelation()}`}
        placeholder="-"
      />
      
      {strokesReceived > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {strokesReceived} stroke{strokesReceived > 1 ? 's' : ''}
          </Badge>
        </div>
      )}
      
      {score > 0 && (
        <div className="text-center space-y-1">
          {strokesReceived > 0 && (
            <div className="text-xs text-muted-foreground">
              Net: {netScore}
            </div>
          )}
          <Badge variant={getPointsColor()} className="text-xs">
            {points} pt{points !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}