import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface Phase {
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

interface ProgressTrackerProps {
  currentPhase: number;
  phases: Phase[];
  onBack?: () => void;
  onRestart?: () => void;
  showBackButton?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentPhase,
  phases,
  onBack,
  onRestart,
  showBackButton = true
}) => {
  const progress = useMemo(() => {
    if (currentPhase === -1) return 0;
    return ((currentPhase + 1) / phases.length) * 100;
  }, [currentPhase, phases.length]);

  const currentPhaseData = phases[currentPhase];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onRestart}
            className="text-2xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
          >
            Feel Forward
          </button>
          {showBackButton && currentPhase > 0 && onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Step {currentPhase + 1} of {phases.length}
          </div>
          {currentPhaseData && (
            <div className="text-xs text-muted-foreground">
              {currentPhaseData.title}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Start</span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
          <span>Insights</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProgressTracker);