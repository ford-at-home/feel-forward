
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Heart, Zap, Frown, Smile, WifiOff } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

interface PhaseThreeProps {
  scenarios: Scenario[];
  onComplete: (data: { reactions: Reaction[] }) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const PhaseThree: React.FC<PhaseThreeProps> = ({ 
  scenarios, 
  onComplete,
  isLoading: externalLoading,
  setIsLoading: setExternalLoading
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [apiOffline, setApiOffline] = useState(false);
  
  // Use external loading state if provided
  const setLoadingState = useCallback((loadingState: boolean) => {
    if (setExternalLoading) {
      setExternalLoading(loadingState);
    }
  }, [setExternalLoading]);
  
  const [excitement, setExcitement] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [body, setBody] = useState('');
  const [freeform, setFreeform] = useState('');
  
  const { toast } = useToast();
  const currentScenario = scenarios[currentIndex];

  const handleNext = useCallback(async () => {
    const newReaction: Reaction = {
      scenario_id: currentScenario.id,
      excitement,
      anxiety,
      body,
      freeform
    };

    console.log('Recording reaction for scenario:', currentScenario.title, newReaction);

    // Try to send reaction to backend
    try {
      await apiClient.saveReaction(newReaction);
      console.log('Reaction sent successfully to API');
      setApiOffline(false);
    } catch (error) {
      console.error('Error sending reaction to API:', error);
      setApiOffline(true);
      // Don't block the user - continue with offline mode
      if (!apiOffline) {
        toast({
          title: "Offline mode",
          description: "Your reactions are being saved locally. You can still complete the process.",
          variant: "default"
        });
      }
    }

    const updatedReactions = [...reactions];
    const existingIndex = updatedReactions.findIndex(r => r.scenario_id === currentScenario.id);
    
    if (existingIndex >= 0) {
      updatedReactions[existingIndex] = newReaction;
    } else {
      updatedReactions.push(newReaction);
    }
    
    setReactions(updatedReactions);
    console.log('Updated reactions array:', updatedReactions);

    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset form for next scenario
      setExcitement(5);
      setAnxiety(5);
      setBody('');
      setFreeform('');
    } else {
      console.log('Completing Phase 3 with all reactions:', updatedReactions);
      onComplete({ reactions: updatedReactions });
    }
  }, [currentScenario, excitement, anxiety, body, freeform, reactions, scenarios, currentIndex, onComplete, toast]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Load previous reaction data
      const prevReaction = reactions.find(r => r.scenario_id === scenarios[currentIndex - 1].id);
      if (prevReaction) {
        setExcitement(prevReaction.excitement);
        setAnxiety(prevReaction.anxiety);
        setBody(prevReaction.body);
        setFreeform(prevReaction.freeform);
      } else {
        // Reset to defaults if no previous reaction
        setExcitement(5);
        setAnxiety(5);
        setBody('');
        setFreeform('');
      }
    }
  }, [currentIndex, reactions, scenarios]);

  const getExcitementLabel = useCallback((value: number) => {
    if (value <= 2) return 'Not excited';
    if (value <= 4) return 'Slightly excited';
    if (value <= 6) return 'Moderately excited';
    if (value <= 8) return 'Very excited';
    return 'Extremely excited';
  }, []);

  const getAnxietyLabel = useCallback((value: number) => {
    if (value <= 2) return 'Calm';
    if (value <= 4) return 'Slightly anxious';
    if (value <= 6) return 'Moderately anxious';
    if (value <= 8) return 'Very anxious';
    return 'Extremely anxious';
  }, []);

  return (
    <div className="space-y-6">
      {/* Scenario recap */}
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-500" />
            Scenario {currentIndex + 1}: {currentScenario.title}
            {apiOffline && (
              <WifiOff className="w-4 h-4 text-orange-500 ml-auto" title="Offline mode - reactions saved locally" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {currentScenario.text}
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-purple-700">
              💭 Imagine this scenario is your reality right now. How does it make you feel?
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emotional reactions */}
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Your Emotional Response</CardTitle>
          <p className="text-sm text-muted-foreground">
            Scenario {currentIndex + 1} of {scenarios.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Excitement slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium flex items-center gap-2">
                <Smile className="w-4 h-4 text-green-500" />
                Excitement level
              </label>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                {excitement}/10
              </span>
            </div>
            <Slider
              value={[excitement]}
              onValueChange={(value) => setExcitement(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground text-center">
              {getExcitementLabel(excitement)}
            </p>
          </div>

          {/* Anxiety slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium flex items-center gap-2">
                <Frown className="w-4 h-4 text-orange-500" />
                Anxiety level
              </label>
              <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                {anxiety}/10
              </span>
            </div>
            <Slider
              value={[anxiety]}
              onValueChange={(value) => setAnxiety(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground text-center">
              {getAnxietyLabel(anxiety)}
            </p>
          </div>

          {/* Body sensations */}
          <div className="space-y-3">
            <label className="font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              What do you notice in your body?
            </label>
            <Textarea
              placeholder="e.g., tight chest, butterflies in stomach, relaxed shoulders, tense jaw..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
            />
          </div>

          {/* Free-form thoughts */}
          <div className="space-y-3">
            <label className="font-medium">Additional thoughts and feelings</label>
            <Textarea
              placeholder="What else comes up for you? Any specific worries, hopes, or reactions?"
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={3}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {currentIndex > 0 && (
              <Button 
                onClick={handlePrevious}
                variant="outline"
                className="flex-1"
              >
                Previous Scenario
              </Button>
            )}
            <Button 
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {currentIndex < scenarios.length - 1 ? 'Next Scenario' : 'See Your Insights'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(PhaseThree);
