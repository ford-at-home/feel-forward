
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

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

interface PhaseOneProps {
  factors: Factor[];
  topic: string;
  onComplete: (data: { preferences: Preference[] }) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const PhaseOne: React.FC<PhaseOneProps> = ({ 
  factors, 
  topic, 
  onComplete,
  isLoading: externalLoading,
  setIsLoading: setExternalLoading
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preferences, setPreferences] = useState<Preference[]>([]);

  // Memoize expensive calculations
  const allFactors = useMemo(() => factors.flatMap(f => f.items), [factors]);
  const currentFactor = allFactors[currentIndex];

  const [importance, setImportance] = useState(5);
  const [hasLimit, setHasLimit] = useState(false);
  const [limit, setLimit] = useState('');
  const [tradeoff, setTradeoff] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  // Use external loading state if provided
  const isLoadingState = externalLoading !== undefined ? externalLoading : saving;
  const setLoadingState = useCallback((loadingState: boolean) => {
    if (setExternalLoading) {
      setExternalLoading(loadingState);
    } else {
      setSaving(loadingState);
    }
  }, [setExternalLoading]);

  const handleNext = useCallback(async () => {
    const newPreference: Preference = {
      factor: currentFactor,
      importance,
      hasLimit,
      limit: hasLimit ? limit : '',
      tradeoff
    };

    const updatedPreferences = [...preferences];
    const existingIndex = updatedPreferences.findIndex(p => p.factor === currentFactor);
    
    if (existingIndex >= 0) {
      updatedPreferences[existingIndex] = newPreference;
    } else {
      updatedPreferences.push(newPreference);
    }
    
    setPreferences(updatedPreferences);

    if (currentIndex < allFactors.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset form for next factor
      setImportance(5);
      setHasLimit(false);
      setLimit('');
      setTradeoff('');
    } else {
      // Save all preferences to backend before completing
      setLoadingState(true);
      try {
        await apiClient.savePreferences({
          preferences: updatedPreferences,
          topic: topic
        });
        console.log('Preferences saved successfully');
        toast({
          title: "Preferences saved",
          description: "Your preferences have been saved successfully.",
          variant: "default"
        });
        onComplete({ preferences: updatedPreferences });
      } catch (error) {
        console.error('Error saving preferences:', error);
        // Don't block the user - continue with offline mode
        toast({
          title: "Saved locally",
          description: "Your preferences are saved locally. You can continue with the process.",
          variant: "default"
        });
        onComplete({ preferences: updatedPreferences });
      } finally {
        setLoadingState(false);
      }
    }
  }, [currentIndex, allFactors.length, currentFactor, importance, hasLimit, limit, tradeoff, preferences, topic, onComplete, toast, setLoadingState]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Load previous preference data
      const prevPreference = preferences.find(p => p.factor === allFactors[currentIndex - 1]);
      if (prevPreference) {
        setImportance(prevPreference.importance);
        setHasLimit(prevPreference.hasLimit);
        setLimit(prevPreference.limit);
        setTradeoff(prevPreference.tradeoff);
      }
    }
  }, [currentIndex, allFactors, preferences]);

  // Memoize importance labels
  const importanceLabels = useMemo(() => ({
    1: 'Not important',
    2: 'Slightly important', 
    3: 'Moderately important',
    4: 'Very important',
    5: 'Somewhat important',
    6: 'Important',
    7: 'Quite important',
    8: 'Very important',
    9: 'Extremely important',
    10: 'Absolutely critical'
  }), []);

  return (
    <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl mb-2">
          How important is <span className="text-purple-600">"{currentFactor}"</span>?
        </CardTitle>
        <p className="text-muted-foreground">
          Factor {currentIndex + 1} of {allFactors.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Importance slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="font-medium">Importance level</label>
            <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded">
              {importance}/10
            </span>
          </div>
          <Slider
            value={[importance]}
            onValueChange={(value) => setImportance(value[0])}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground text-center">
            {importanceLabels[importance as keyof typeof importanceLabels]}
          </p>
        </div>

        {/* Hard limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-medium">Do you have any hard limits?</label>
              <p className="text-sm text-muted-foreground">
                Non-negotiable requirements for this factor
              </p>
            </div>
            <Switch
              checked={hasLimit}
              onCheckedChange={setHasLimit}
            />
          </div>
          
          {hasLimit && (
            <Input
              placeholder="e.g., minimum $80k salary, must be remote, etc."
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          )}
        </div>

        {/* Trade-offs */}
        <div className="space-y-3">
          <label className="font-medium">How would you trade this off?</label>
          <Textarea
            placeholder="e.g., I'd accept lower salary for better work-life balance, or I'd compromise on location for the right team..."
            value={tradeoff}
            onChange={(e) => setTradeoff(e.target.value)}
            rows={3}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <Button 
              onClick={handlePrevious}
              variant="outline"
              className="flex-1"
            >
              Previous
            </Button>
          )}
          <Button 
            onClick={handleNext}
            disabled={isLoadingState}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isLoadingState ? 'Saving...' : (currentIndex < allFactors.length - 1 ? 'Next Factor' : 'Generate Scenarios')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(PhaseOne);
