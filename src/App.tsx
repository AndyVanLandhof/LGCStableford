import { useState, useEffect } from 'react';
import { PlayerSetup } from './components/PlayerSetup';
import { HoleByHoleScoring } from './components/HoleByHoleScoring';
import { Scorecard } from './components/Scorecard';
import { Logo } from './components/Logo';
import { InstallBanner } from './components/InstallBanner';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Trophy, RotateCcw, FileText, Download, ChevronLeft, ArrowLeft, Target } from 'lucide-react';
import { generatePDF } from './utils/pdfGenerator';
import { calculateCourseHandicap, calculateMatchPlayStatus, calculateTeamMatchPlayStatus, calculateSixPointsStatus } from './utils/calculations';
import { liphookCourseData } from './data/courseData';
import { elieGhcCourseData } from './data/elieGhcCourseData';
import type { Player, TeeBox, CourseData, ViewType } from './types';

type CourseType = 'liphook' | 'elie-ghc';
type AppView = 'courseSelection' | 'setup' | 'scoring' | 'results' | 'fullScorecard' | 'scoringScorecard';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseType>('liphook');
  const [courseData, setCourseData] = useState<CourseData>(liphookCourseData);
  const [selectedTeeBox, setSelectedTeeBox] = useState<TeeBox>(liphookCourseData.teeBoxes[1]); // Default to White tees
  const [currentView, setCurrentView] = useState<AppView>('courseSelection');
  const [currentHoleIndex, setCurrentHoleIndex] = useState<number>(0); // Add current hole state
  const [startHoleIndex, setStartHoleIndex] = useState<number>(0); // 0-based: 0 for Hole 1, 9 for Hole 10
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Update course data when course selection changes
  useEffect(() => {
    const newCourseData = selectedCourse === 'liphook' ? liphookCourseData : elieGhcCourseData;
    setCourseData(newCourseData);
    setSelectedTeeBox(newCourseData.teeBoxes[1]); // Default to White/second tee
  }, [selectedCourse]);

  // Generate storage keys based on selected course
  const getStorageKey = (key: string) => `${selectedCourse}-stableford-${key}`;

  // PWA Install Prompt Handler
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Load data from localStorage on mount and course change
  useEffect(() => {
    if (selectedCourse) {
      const savedPlayers = localStorage.getItem(getStorageKey('players'));
      const savedTeeBox = localStorage.getItem(getStorageKey('teebox'));
      const savedView = localStorage.getItem(getStorageKey('view'));
      const savedDate = localStorage.getItem(getStorageKey('date'));
      const savedHoleIndex = localStorage.getItem(getStorageKey('currentHole'));
      const savedStartHole = localStorage.getItem(getStorageKey('startHole'));
      
      if (savedPlayers) {
        try {
          setPlayers(JSON.parse(savedPlayers));
        } catch (e) {
          console.error('Error loading players:', e);
        }
      } else {
        setPlayers([]);
      }
      
      if (savedTeeBox) {
        try {
          const teeBox = JSON.parse(savedTeeBox);
          setSelectedTeeBox(teeBox);
        } catch (e) {
          console.error('Error loading tee box:', e);
        }
      }

      if (savedDate) {
        try {
          setGameDate(JSON.parse(savedDate));
        } catch (e) {
          console.error('Error loading date:', e);
        }
      }

      if (savedHoleIndex) {
        try {
          setCurrentHoleIndex(JSON.parse(savedHoleIndex));
        } catch (e) {
          console.error('Error loading hole index:', e);
        }
      }
      if (savedStartHole) {
        try {
          setStartHoleIndex(JSON.parse(savedStartHole));
        } catch (e) {
          console.error('Error loading start hole:', e);
        }
      }

      if (savedView && savedPlayers) {
        try {
          const view = JSON.parse(savedView);
          if (view !== 'courseSelection') {
            setCurrentView(view);
          }
        } catch (e) {
          console.error('Error loading view:', e);
        }
      } else {
        setCurrentView('setup');
      }
    }
  }, [selectedCourse]);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem(getStorageKey('players'), JSON.stringify(players));
    }
  }, [players, selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem(getStorageKey('teebox'), JSON.stringify(selectedTeeBox));
    }
  }, [selectedTeeBox, selectedCourse]);

  useEffect(() => {
    if (selectedCourse && currentView !== 'courseSelection') {
      localStorage.setItem(getStorageKey('view'), JSON.stringify(currentView));
    }
  }, [currentView, selectedCourse]);

  // Save current hole index to localStorage
  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem(getStorageKey('currentHole'), JSON.stringify(currentHoleIndex));
    }
  }, [currentHoleIndex, selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem(getStorageKey('date'), JSON.stringify(gameDate));
    }
  }, [gameDate, selectedCourse]);

  // Save start hole to localStorage
  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem(getStorageKey('startHole'), JSON.stringify(startHoleIndex));
    }
  }, [startHoleIndex, selectedCourse]);

  const selectCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setCurrentView('setup');
  };

  const backToCourseSelection = () => {
    setCurrentView('courseSelection');
    setPlayers([]);
    if (selectedCourse) {
      localStorage.removeItem(getStorageKey('players'));
      localStorage.removeItem(getStorageKey('view'));
      localStorage.removeItem(getStorageKey('date'));
    }
  };

  const startGame = () => {
    if (players.length === 0) return;
    
    // Calculate course handicaps for all players
    const updatedPlayers = players.map(player => ({
      ...player,
      courseHandicap: calculateCourseHandicap(player.handicapIndex, selectedTeeBox.slopeRating)
    }));
    
    setPlayers(updatedPlayers);
    setCurrentHoleIndex(startHoleIndex);
    setCurrentView('scoring');
  };

  const finishRound = () => {
    setCurrentView('results');
  };

  const newGame = () => {
    setPlayers([]);
    setCurrentView('setup');
    setCurrentHoleIndex(0); // Reset hole index for new game
    setGameDate(new Date().toISOString().split('T')[0]); // Reset to today's date
    if (selectedCourse) {
      localStorage.removeItem(getStorageKey('players'));
      localStorage.removeItem(getStorageKey('view'));
      localStorage.removeItem(getStorageKey('date'));
      localStorage.removeItem(getStorageKey('currentHole'));
    }
  };

  const viewFullScorecard = () => {
    setCurrentView('fullScorecard');
  };

  const backToResults = () => {
    setCurrentView('results');
  };

  const viewScorecardFromScoring = () => {
    setCurrentView('scoringScorecard');
  };

  const backToScoring = () => {
    setCurrentView('scoring');
  };

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF(players, selectedTeeBox, gameDate);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (currentView === 'courseSelection') {
    return (
      <div className="min-h-screen bg-background relative safe-all">
        <InstallBanner 
          showInstallPrompt={showInstallPrompt}
          onInstallClick={handleInstallClick}
          onDismiss={() => setShowInstallPrompt(false)}
        />
        
        {/* Header Logo */}
        <div className="absolute top-4 right-4 z-10 safe-top safe-right">
          <Logo />
        </div>
        
        <div className={`p-4 relative z-10 mobile-iphone-padding ${showInstallPrompt ? 'pt-20' : ''}`}>
          <div className="max-w-md mx-auto">
            <Card className="p-6 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
              <h1 className="mb-6 text-center text-primary text-4xl sm:text-5xl">Golf Stableford</h1>
              <div className="space-y-4">
                <div>
                  <h2 className="mb-4 text-center">Select Course</h2>
                  <p className="text-muted-foreground mb-6 text-center text-sm">
                    Choose which golf course you'd like to play
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => selectCourse('liphook')}
                    className="w-full h-16 sm:h-20 text-lg bg-primary hover:bg-primary/90 touch-manipulation"
                  >
                    <div className="text-center">
                      <div className="text-lg sm:text-xl">Liphook Golf Club</div>
                      <div className="text-sm opacity-90">Hampshire, England</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => selectCourse('elie-ghc')}
                    className="w-full h-16 sm:h-20 text-lg bg-primary hover:bg-primary/90 touch-manipulation"
                  >
                    <div className="text-center">
                      <div className="text-lg sm:text-xl">Elie Golf House Club</div>
                      <div className="text-sm opacity-90">Fife, Scotland</div>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-background relative safe-all">
        <InstallBanner 
          showInstallPrompt={showInstallPrompt}
          onInstallClick={handleInstallClick}
          onDismiss={() => setShowInstallPrompt(false)}
        />
        
        {/* Header Logo */}
        <div className="absolute top-4 right-4 z-10 safe-top safe-right">
          <Logo />
        </div>
        
        <div className={`p-4 relative z-10 mobile-iphone-padding ${showInstallPrompt ? 'pt-20' : ''}`}>
          <div className="max-w-md mx-auto">
            <Card className="p-6 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  onClick={backToCourseSelection}
                  className="p-2 min-h-11 min-w-11 touch-manipulation"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-center text-primary text-3xl sm:text-4xl flex-1">
                  {courseData.name === 'Liphook Golf Club' ? 'Liphook' : 'Elie GHC'} Stableford
                </h1>
                <div className="w-11"></div>
              </div>
              <PlayerSetup 
                players={players} 
                setPlayers={setPlayers}
                teeBoxes={courseData.teeBoxes}
                selectedTeeBox={selectedTeeBox}
                onTeeBoxChange={setSelectedTeeBox}
                gameDate={gameDate}
                onDateChange={setGameDate}
                startHoleIndex={startHoleIndex}
                onStartHoleChange={setStartHoleIndex}
                onStartGame={startGame}
              />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'scoring') {
    return (
      <div className="min-h-screen bg-background relative safe-all">
        <InstallBanner 
          showInstallPrompt={showInstallPrompt}
          onInstallClick={handleInstallClick}
          onDismiss={() => setShowInstallPrompt(false)}
        />
        
        <div className={`mobile-header border-b border-primary/20 p-4 z-20 relative mobile-iphone-padding ${showInstallPrompt ? 'mt-16' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-2xl mx-auto gap-3">
            <div className="flex-1">
              <h1 className="text-primary text-xl sm:text-2xl">
                {courseData.name === 'Liphook Golf Club' ? 'Liphook' : 'Elie GHC'} Stableford
              </h1>
              <p className="text-sm text-muted-foreground">
                {courseData.name} - {selectedTeeBox.name} Tees
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDisplayDate(gameDate)}
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={newGame} 
                className="border-primary/20 hover:bg-primary/10 touch-manipulation flex-1 sm:flex-initial"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Game</span>
              </Button>
              <Logo />
            </div>
          </div>
        </div>
        
        <div className="p-4 relative z-10 mobile-iphone-padding">
          <HoleByHoleScoring 
            players={players}
            setPlayers={setPlayers}
            holes={courseData.holes}
            selectedTeeBox={selectedTeeBox}
            currentHoleIndex={currentHoleIndex}
            setCurrentHoleIndex={setCurrentHoleIndex}
            startHoleIndex={startHoleIndex}
            onFinishRound={finishRound}
            onShowScorecard={viewScorecardFromScoring}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'results') {
    const winner = [...players].sort((a, b) => b.totalPoints - a.totalPoints)[0];
    
    // Calculate match play result for 2 players
    const matchPlayResult = players.length === 2 ? 
      calculateMatchPlayStatus(players, courseData.holes, 18) : null;
    
    // Calculate team match play result for 4 players with teams
    const teamA = players.filter(p => p.team === 'A');
    const teamB = players.filter(p => p.team === 'B');
    const teamMatchPlayResult = players.length === 4 && teamA.length === 2 && teamB.length === 2 ? 
      calculateTeamMatchPlayStatus(players, courseData.holes, 18) : null;
    
    // Calculate six points result for 3 players
    const sixPointsResult = players.length === 3 ? 
      calculateSixPointsStatus(players, 18) : null;
    
    return (
      <div className="min-h-screen bg-background relative safe-all">
        <InstallBanner 
          showInstallPrompt={showInstallPrompt}
          onInstallClick={handleInstallClick}
          onDismiss={() => setShowInstallPrompt(false)}
        />
        
        {/* Header Logo */}
        <div className="absolute top-4 right-4 z-10 safe-top safe-right">
          <Logo />
        </div>
        
        <div className={`p-4 relative z-10 mobile-iphone-padding ${showInstallPrompt ? 'pt-20' : ''}`}>
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Results Header */}
            <Card className="p-6 text-center bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h1 className="mb-2 text-primary">Round Complete!</h1>
              <p className="text-muted-foreground mb-2">
                {courseData.name} - {selectedTeeBox.name} Tees
              </p>
              <p className="text-muted-foreground mb-4">
                {formatDisplayDate(gameDate)}
              </p>
              
              {winner && (
                <div className="space-y-2">
                  <h2 className="text-primary">🏆 Stableford Winner: {winner.name}</h2>
                  <p className="text-lg text-accent">{winner.totalPoints} Stableford Points</p>
                </div>
              )}
              
              {/* Match Play Result */}
              {matchPlayResult && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-accent" />
                    <h3 className="text-accent font-semibold">Match Play Result</h3>
                  </div>
                  {matchPlayResult.isAllSquare ? (
                    <p className="text-lg text-accent font-semibold">Match Halved</p>
                  ) : (
                    <p className="text-lg text-accent font-semibold">
                      {matchPlayResult.leadingPlayerName} wins {matchPlayResult.status}
                    </p>
                  )}
                </div>
              )}
              
              {/* Team Match Play Result */}
              {teamMatchPlayResult && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-accent" />
                    <h3 className="text-accent font-semibold">Team Match Play Result</h3>
                  </div>
                  {teamMatchPlayResult.isAllSquare ? (
                    <p className="text-lg text-accent font-semibold">Team Match Halved</p>
                  ) : (
                    <p className="text-lg text-accent font-semibold">
                      {teamMatchPlayResult.leadingPlayerName} wins {teamMatchPlayResult.status}
                    </p>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="grid grid-cols-2 gap-4">
                      <div>Team A: {teamA.map(p => p.name.split(' ')[0]).join(', ')}</div>
                      <div>Team B: {teamB.map(p => p.name.split(' ')[0]).join(', ')}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Six Points Result */}
              {sixPointsResult && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    <h3 className="text-accent font-semibold">Six Points Result</h3>
                  </div>
                  {sixPointsResult.isThreeWayTie ? (
                    <p className="text-lg text-accent font-semibold">Three-Way Tie</p>
                  ) : (
                    <p className="text-lg text-accent font-semibold">
                      {sixPointsResult.leadingPlayerName} wins with {sixPointsResult.totalSixPoints} six points
                    </p>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    {sixPointsResult.standings.map((standing, idx) => (
                      <span key={standing.playerId}>
                        {standing.playerName}: {standing.points} pts
                        {idx < sixPointsResult.standings.length - 1 && ' • '}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Final Standings */}
            <Card className="p-4 sm:p-6 bg-card/95 backdrop-blur-sm shadow-lg border-2 border-primary/20">
              <h3 className="mb-4 text-primary">Final Standings</h3>
              <div className="space-y-3">
                {[...players]
                  .sort((a, b) => b.totalPoints - a.totalPoints)
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/50 border border-primary/10 touch-manipulation">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                          <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                          </Badge>
                        </div>
                        <div>
                          <div className={`${index === 0 ? "font-medium text-primary" : ""} flex items-center gap-2 text-sm sm:text-base`}>
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
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            HCP: {player.handicapIndex} (Course: {player.courseHandicap})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg ${index === 0 ? "font-medium text-primary" : ""}`}>
                          {player.totalPoints} pts
                        </div>
                        {players.length === 3 && player.totalSixPoints !== undefined && (
                          <div className="text-sm text-accent">
                            {player.totalSixPoints} six pts
                          </div>
                        )}
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {player.scores.filter(s => s > 0).length}/18 holes
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={viewFullScorecard} className="w-full h-12 sm:h-auto" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Full Scorecard
              </Button>
              <Button onClick={newGame} className="w-full h-12 sm:h-auto bg-primary hover:bg-primary/90">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Game
              </Button>
              <Button onClick={backToCourseSelection} className="w-full h-12 sm:h-auto" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Choose Different Course
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'fullScorecard') {
    return (
      <div className="min-h-screen bg-background relative">
        <InstallBanner 
          showInstallPrompt={showInstallPrompt}
          onInstallClick={handleInstallClick}
          onDismiss={() => setShowInstallPrompt(false)}
        />
        
        <div className={`sticky top-0 bg-background/95 backdrop-blur-sm border-b border-primary/20 p-4 z-20 relative ${showInstallPrompt ? 'mt-16' : ''}`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <h1 className="text-primary">Full Scorecard</h1>
              <p className="text-sm text-muted-foreground">
                {courseData.name} - {selectedTeeBox.name} Tees
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDisplayDate(gameDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={backToResults} className="border-primary/20 hover:bg-primary/10">
                  Back to Results
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadPDF} 
                  disabled={isGeneratingPDF}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button variant="outline" onClick={newGame} className="border-primary/20 hover:bg-primary/10">
                  New Game
                </Button>
              </div>
              <Logo />
            </div>
          </div>
        </div>
        
        <div className="p-4 relative z-10 pdf-content">
          <Scorecard 
            players={players}
            setPlayers={setPlayers}
            holes={courseData.holes}
            selectedTeeBox={selectedTeeBox}
            gameDate={gameDate}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'scoringScorecard') {
    return (
      <div className="min-h-screen bg-background relative">
        <InstallBanner 
          showInstallPrompt={showInstallPrompt}
          onInstallClick={handleInstallClick}
          onDismiss={() => setShowInstallPrompt(false)}
        />
        
        <div className={`sticky top-0 bg-background/95 backdrop-blur-sm border-b border-primary/20 p-4 z-20 relative ${showInstallPrompt ? 'mt-16' : ''}`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <h1 className="text-primary">Round Scorecard</h1>
              <p className="text-sm text-muted-foreground">
                {courseData.name} - {selectedTeeBox.name} Tees
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDisplayDate(gameDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={backToScoring} className="border-primary/20 hover:bg-primary/10">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Scoring
              </Button>
              <Logo />
            </div>
          </div>
        </div>
        
        <div className="p-4 relative z-10">
          <Scorecard 
            players={players}
            setPlayers={setPlayers}
            holes={courseData.holes}
            selectedTeeBox={selectedTeeBox}
            gameDate={gameDate}
          />
        </div>
      </div>
    );
  }

  return null;
}

// Re-export the calculation functions for use by other components
export { 
  calculateStablefordPoints, 
  getStrokesForHole, 
  applyNetDoubleBogeyRule, 
  calculateCourseHandicap,
  calculateHoleWinner,
  calculateMatchPlayStatus,
  calculateTeamHoleWinner,
  calculateTeamMatchPlayStatus,
  calculateSixPointsForHole,
  calculateSixPointsStatus,
  calculateAndResetSixPoints,
  allocateSixPointsFromPlaces,
  normalizeTotals,
  type MatchPlayHoleResult,
  type MatchPlayStatus,
  type SixPointsHoleResult,
  type SixPointsStatus
} from './utils/calculations';