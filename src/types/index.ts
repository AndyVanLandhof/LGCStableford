export interface Player {
  id: string;
  name: string;
  handicapIndex: number;
  scores: number[];
  points: number[]; // Stableford points
  totalPoints: number; // Total Stableford points
  courseHandicap: number;
  team?: 'A' | 'B'; // Optional team assignment
  sixPoints?: number[]; // Six points system for 3-player games
  totalSixPoints?: number; // Total six points
}

export interface Hole {
  number: number;
  name: string;
  par: number;
  handicapIndex: number; // 1-18, where 1 is hardest hole
  yardages: {
    yellow: number;
    white: number;
    blue: number;
    red?: number;
  };
}

export interface TeeBox {
  name: string;
  color: string;
  courseRating: number;
  slopeRating: number;
}

export interface CourseData {
  name: string;
  par: number;
  teeBoxes: TeeBox[];
  holes: Hole[];
}

export interface GameData {
  date: string; // ISO date string
  players: Player[];
  selectedTeeBox: TeeBox;
  currentView: ViewType;
}

export type ViewType = 'setup' | 'scoring' | 'results' | 'fullScorecard' | 'scoringScorecard';