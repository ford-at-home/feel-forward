
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PhaseZero from '@/components/PhaseZero';
import PhaseOne from '@/components/PhaseOne';
import PhaseTwo from '@/components/PhaseTwo';
import PhaseThree from '@/components/PhaseThree';
import PhaseFour from '@/components/PhaseFour';
import ProgressTracker from '@/components/ProgressTracker';
import { SessionBar } from '@/components/SessionBar';
import { useSession } from '@/hooks/use-session';
import { Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnhancedProgress } from '@/components/ui/enhanced-progress';
import { ResponsiveLayout, ResponsiveCard, TouchOptimizedButton, BreakpointIndicator } from '@/components/ui/responsive-layout';
import { SkipLink, ProgressAnnouncement, VisuallyHidden, HighContrastToggle } from '@/components/ui/accessibility';
import { StaggeredAnimation, FloatingElement } from '@/components/ui/micro-interactions';

// Types for better type safety
interface Factor {
  category: string;
  items: string[];
}

interface Preference {
  factor: string;
  importance: number;
  hasLimit: boolean;
  limit: string;
  tradeoff: string;
}

interface Scenario {
  id: string;
  title: string;
  text: string;
}

interface Reaction {
  scenario_id: string;
  excitement: number;
  anxiety: number;
  body: string;
  freeform: string;
}

interface UserData {
  topic: string;
  factors: Factor[];
  preferences: Preference[];
  scenarios: Scenario[];
  reactions: Reaction[];
  summary: string;
}

const Index: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState(-1); // -1 = welcome screen
  const [userData, setUserData] = useState<UserData>({
    topic: '',
    factors: [],
    preferences: [],
    scenarios: [],
    reactions: [],
    summary: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const isMobile = useIsMobile();

  // Session management
  const {
    sessionData,
    isLoading: sessionLoading,
    hasUnsavedChanges,
    createNewSession,
    loadSession,
    saveCurrentSession,
    updateSessionData,
    exportCurrentSession,
    importSession,
    deleteCurrentSession,
    sessionList,
    refreshSessionList,
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled
  } = useSession();

  // Sync session data with component state
  useEffect(() => {
    if (sessionData && !sessionLoading) {
      setCurrentPhase(sessionData.currentPhase);
      setUserData({
        topic: sessionData.topic,
        factors: sessionData.factors,
        preferences: sessionData.preferences,
        scenarios: sessionData.scenarios,
        reactions: sessionData.reactions,
        summary: sessionData.insights || ''
      });
    }
  }, [sessionData, sessionLoading]);

  // Update session when userData changes
  useEffect(() => {
    if (sessionData && userData.topic) {
      updateSessionData({
        topic: userData.topic,
        currentPhase,
        factors: userData.factors,
        preferences: userData.preferences,
        scenarios: userData.scenarios,
        reactions: userData.reactions,
        insights: userData.summary,
        summary: {
          ...sessionData.summary,
          total_factors: userData.factors.reduce((acc, f) => acc + f.items.length, 0),
          preferences_count: userData.preferences.length,
          scenarios_count: userData.scenarios.length,
          reactions_count: userData.reactions.length
        }
      });
    }
  }, [userData, currentPhase, sessionData, updateSessionData]);

  const phases = useMemo(() => [
    { 
      title: "Discover Preferences", 
      description: "What matters most to you?",
      icon: "🎯",
      estimatedTime: "3-5 min"
    },
    { 
      title: "Detail Preferences", 
      description: "How much does each factor matter?",
      icon: "⚖️",
      estimatedTime: "5-8 min"
    },
    { 
      title: "Explore Scenarios", 
      description: "See possible futures",
      icon: "🔮",
      estimatedTime: "2-3 min"
    },
    { 
      title: "Feel Your Reactions", 
      description: "How do these scenarios make you feel?",
      icon: "💭",
      estimatedTime: "5-10 min"
    },
    { 
      title: "Understand Yourself", 
      description: "Your emotional insights",
      icon: "✨",
      estimatedTime: "3-5 min"
    }
  ], []);

  const handleStart = useCallback(() => {
    if (!sessionData) {
      createNewSession();
    }
    setCurrentPhase(0);
  }, [sessionData, createNewSession]);

  const handlePhaseComplete = useCallback((phaseData: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...phaseData }));
    if (currentPhase < 4) {
      setCurrentPhase(prev => prev + 1);
    }
  }, [currentPhase]);

  const handleBack = useCallback(() => {
    if (currentPhase > 0) {
      setCurrentPhase(prev => prev - 1);
    }
  }, [currentPhase]);

  const handleRestart = useCallback(() => {
    setCurrentPhase(-1);
    setUserData({
      topic: '',
      factors: [],
      preferences: [],
      scenarios: [],
      reactions: [],
      summary: ''
    });
    // Create a fresh session for restart
    createNewSession();
  }, [createNewSession]);

  // Session management functions for SessionBar
  const handleLoadSession = useCallback((sessionId: string) => {
    loadSession(sessionId);
  }, [loadSession]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (sessionData?.sessionId === sessionId) {
      // If deleting current session, reset to welcome screen
      setCurrentPhase(-1);
      setUserData({
        topic: '',
        factors: [],
        preferences: [],
        scenarios: [],
        reactions: [],
        summary: ''
      });
    }
    deleteCurrentSession();
    refreshSessionList();
  }, [sessionData, deleteCurrentSession, refreshSessionList]);

  const handleToggleAutoSave = useCallback(() => {
    if (isAutoSaveEnabled) {
      disableAutoSave();
    } else {
      enableAutoSave();
    }
  }, [isAutoSaveEnabled, enableAutoSave, disableAutoSave]);

  // Memoized progress calculation
  const progress = useMemo(() => {
    if (currentPhase === -1) return 0;
    return ((currentPhase + 1) / 5) * 100;
  }, [currentPhase]);

  if (currentPhase === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Accessibility enhancements */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <HighContrastToggle enabled={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        <BreakpointIndicator />
        
        {/* Session Bar on welcome screen too */}
        <SessionBar
          sessionData={sessionData}
          sessionList={sessionList}
          hasUnsavedChanges={hasUnsavedChanges}
          isAutoSaveEnabled={isAutoSaveEnabled}
          onCreateNew={createNewSession}
          onLoadSession={handleLoadSession}
          onSaveSession={saveCurrentSession}
          onExportSession={exportCurrentSession}
          onImportSession={importSession}
          onDeleteSession={handleDeleteSession}
          onToggleAutoSave={handleToggleAutoSave}
        />
        
        <ResponsiveLayout variant="centered">
          <div className="max-w-2xl w-full">
            <StaggeredAnimation stagger={150} animation="fadeIn">
              <div className="text-center mb-12">
                <FloatingElement>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                </FloatingElement>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Feel Forward
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Make better life decisions by understanding your emotional truth
                </p>
              </div>
            </StaggeredAnimation>

          <ResponsiveCard variant="glass" size={isMobile ? 'sm' : 'md'} id="main-content">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your 5-Step Journey</h2>
              <p className="text-muted-foreground mb-6">
                We'll guide you through a thoughtful process to discover what you really want
              </p>
            </div>

            <StaggeredAnimation stagger={100} animation="slideUp">
              {phases.map((phase, index) => (
                <div key={index} className="flex items-center p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300 hover:shadow-md">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4 shadow-lg">
                    <span className="text-lg" role="img" aria-label={`Step ${index + 1}`}>{phase.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{phase.title}</h3>
                      <span className="text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded">
                        {phase.estimatedTime}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              ))}
            </StaggeredAnimation>

            <div className="space-y-4 mt-8">
              <TouchOptimizedButton 
                onClick={handleStart}
                variant="primary"
                size={isMobile ? 'lg' : 'md'}
                fullWidth
              >
                Begin Your Journey
                <ChevronRight className="ml-2 w-4 h-4" />
              </TouchOptimizedButton>
              
              {sessionList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Or continue a previous session:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {sessionList.slice(0, 3).map((session) => (
                      <Button
                        key={session.sessionId}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => handleLoadSession(session.sessionId)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {session.topic || "Untitled Session"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.completion_percentage}% complete • {' '}
                            {new Date(session.last_updated).toLocaleDateString()}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  {sessionList.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{sessionList.length - 3} more sessions available in Sessions menu
                    </p>
                  )}
                </div>
              )}
            </div>
          </ResponsiveCard>
        </div>
        </ResponsiveLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Accessibility enhancements */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <HighContrastToggle enabled={highContrast} onToggle={() => setHighContrast(!highContrast)} />
      <BreakpointIndicator />
      
      {/* Progress announcement for screen readers */}
      <ProgressAnnouncement 
        currentStep={currentPhase}
        totalSteps={5}
        stepName={phases[currentPhase]?.title || 'Loading'}
      />
      
      {/* Session Bar */}
      <SessionBar
        sessionData={sessionData}
        sessionList={sessionList}
        hasUnsavedChanges={hasUnsavedChanges}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onCreateNew={createNewSession}
        onLoadSession={handleLoadSession}
        onSaveSession={saveCurrentSession}
        onExportSession={exportCurrentSession}
        onImportSession={importSession}
        onDeleteSession={handleDeleteSession}
        onToggleAutoSave={handleToggleAutoSave}
      />
      
      <ResponsiveLayout>
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TouchOptimizedButton 
                  onClick={handleRestart}
                  variant="ghost"
                  className="text-2xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity p-0"
                >
                  Feel Forward
                </TouchOptimizedButton>
                {currentPhase > 0 && (
                  <TouchOptimizedButton
                    onClick={handleBack}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </TouchOptimizedButton>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Step {currentPhase + 1} of 5
                </div>
                <div className="text-xs text-muted-foreground">
                  {phases[currentPhase]?.title}
                </div>
              </div>
            </div>

            {/* Enhanced progress indicator */}
            <EnhancedProgress
              steps={phases.map((phase, index) => ({
                title: phase.title,
                description: phase.description,
                completed: index < currentPhase,
                current: index === currentPhase
              }))}
              currentStep={currentPhase}
              variant={isMobile ? 'vertical' : 'horizontal'}
              showLabels={!isMobile}
              className="mb-4"
            />
          </div>

          {/* Phase content with better loading states */}
          <div className="transition-all duration-300 ease-in-out" id="main-content">
            {currentPhase === 0 && (
              <PhaseZero 
                onComplete={handlePhaseComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentPhase === 1 && (
              <PhaseOne 
                factors={userData.factors}
                topic={userData.topic}
                onComplete={handlePhaseComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentPhase === 2 && (
              <PhaseTwo 
                preferences={userData.preferences}
                topic={userData.topic}
                onComplete={handlePhaseComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentPhase === 3 && (
              <PhaseThree 
                scenarios={userData.scenarios}
                onComplete={handlePhaseComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentPhase === 4 && (
              <PhaseFour 
                reactions={userData.reactions}
                preferences={userData.preferences}
                userData={userData}
                onRestart={handleRestart}
              />
            )}
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
};

export default React.memo(Index);
