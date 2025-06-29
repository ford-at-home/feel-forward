
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Scenario {
  id: string;
  title: string;
  text: string;
}

interface Preference {
  factor: string;
  importance: number;
  hasLimit: boolean;
  limit: string;
  tradeoff: string;
}

interface PhaseTwoProps {
  preferences: Preference[];
  topic: string;
  onComplete: (data: { scenarios: Scenario[] }) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const PhaseTwo: React.FC<PhaseTwoProps> = ({ 
  preferences, 
  topic, 
  onComplete,
  isLoading: externalLoading,
  setIsLoading: setExternalLoading
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');
  const { toast } = useToast();
  
  // Use external loading state if provided
  const isLoadingState = externalLoading !== undefined ? externalLoading : loading;
  const setLoadingState = useCallback((loadingState: boolean) => {
    if (setExternalLoading) {
      setExternalLoading(loadingState);
    } else {
      setLoading(loadingState);
    }
  }, [setExternalLoading]);

  useEffect(() => {
    generateScenarios();
  }, []);

  const getFallbackScenarios = useCallback((topic: string): Scenario[] => {
    console.log('Generating fallback scenarios for topic:', topic);
    
    // Generate more context-aware scenarios based on the topic
    const isCareerRelated = topic.toLowerCase().includes('job') || 
                           topic.toLowerCase().includes('career') || 
                           topic.toLowerCase().includes('work');
    
    const isLocationRelated = topic.toLowerCase().includes('move') || 
                             topic.toLowerCase().includes('location') || 
                             topic.toLowerCase().includes('city');

    if (isCareerRelated) {
      return [
        {
          id: 's1',
          title: 'The Startup Adventure',
          text: 'You join a fast-growing startup where you wear many hats. The equity potential is exciting, but the hours are long and the stability uncertain. Your colleagues are passionate and the culture is energetic, but work-life balance can be challenging.'
        },
        {
          id: 's2', 
          title: 'The Corporate Comfort',
          text: 'You land a role at an established company with excellent benefits and clear career progression. The work is structured, the pay is reliable, but innovation moves slowly and bureaucracy can sometimes be frustrating.'
        },
        {
          id: 's3',
          title: 'The Remote Freedom',
          text: 'You find a fully remote position that offers incredible flexibility. You can live anywhere, set your own schedule, but you miss the energy of in-person collaboration and sometimes feel isolated from your team.'
        }
      ];
    }

    if (isLocationRelated) {
      return [
        {
          id: 's1',
          title: 'The Urban Opportunity',
          text: 'You move to a vibrant city with endless opportunities and cultural diversity. The pace is fast, the networking amazing, but the cost of living is high and space is limited. Every day brings new experiences and connections.'
        },
        {
          id: 's2',
          title: 'The Suburban Balance',
          text: 'You choose a suburban area that offers the best of both worlds. There\'s more space, better schools, and a slower pace, but you\'re still close enough to the city for opportunities. Community feels stronger here.'
        },
        {
          id: 's3',
          title: 'The Rural Retreat',
          text: 'You embrace a quieter life in a rural setting. The cost of living is low, nature is at your doorstep, and the community is tight-knit. However, career opportunities are limited and amenities are fewer.'
        }
      ];
    }

    // Default general scenarios
    return [
      {
        id: 's1',
        title: 'The Bold Choice',
        text: 'You choose the path that excites you most, even though it comes with risks. This option offers the highest potential for growth and fulfillment, but requires stepping outside your comfort zone and accepting some uncertainty.'
      },
      {
        id: 's2', 
        title: 'The Balanced Approach',
        text: 'You find a middle ground that satisfies most of your priorities. This choice offers stability and moderate growth, without extreme risks or dramatic changes. It feels comfortable and sustainable long-term.'
      },
      {
        id: 's3',
        title: 'The Safe Harbor',
        text: 'You prioritize security and stability above all else. This option minimizes risk and provides predictable outcomes, though it may limit your potential for dramatic growth or exciting new experiences.'
      }
    ];
  }, []);

  const generateScenarios = useCallback(async () => {
    console.log('Generating scenarios for topic:', topic);
    console.log('User preferences:', preferences);
    
    try {
      // Check if API is available first
      const health = await apiClient.healthCheck();
      setApiStatus(health.healthy ? 'online' : 'offline');
      
      if (!health.healthy) {
        throw new Error('API is not available');
      }

      const data = await apiClient.generateScenarios({ preferences, topic });
      console.log('Received scenarios from API:', data);
      
      if (data.scenarios && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
        setScenarios(data.scenarios);
        toast({
          title: "Scenarios generated",
          description: "We've created personalized scenarios based on your preferences.",
          variant: "default"
        });
      } else {
        throw new Error('No scenarios received from API');
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
      setApiStatus('offline');
      
      // Use fallback scenarios
      const fallbackScenarios = getFallbackScenarios(topic);
      setScenarios(fallbackScenarios);
      
      toast({
        title: "Using sample scenarios",
        description: "We've loaded example scenarios while working on the connection. These are still useful for exploring your reactions.",
        variant: "default"
      });
    } finally {
      setLoadingState(false);
    }
  }, [topic, preferences, toast, getFallbackScenarios, setLoadingState]);

  const handleContinue = useCallback(() => {
    console.log('Continuing with scenarios:', scenarios);
    onComplete({ scenarios });
  }, [scenarios, onComplete]);

  if (isLoadingState) {
    return (
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Creating your scenarios...</h3>
          <p className="text-muted-foreground text-center">
            We're crafting realistic future possibilities based on your preferences
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Your Possible Futures
            {apiStatus === 'offline' && (
              <WifiOff className="w-5 h-5 text-orange-500 ml-2" title="Offline mode" />
            )}
            {apiStatus === 'online' && (
              <Wifi className="w-5 h-5 text-green-500 ml-2" title="Connected" />
            )}
          </CardTitle>
          <p className="text-muted-foreground">
            {apiStatus === 'offline' 
              ? "Here are some example scenarios to help you explore your feelings. You can still gain valuable insights from this exercise."
              : "Here are realistic scenarios based on your preferences. Take a moment to imagine each one."
            }
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {scenarios.map((scenario, index) => (
          <Card key={scenario.id} className="backdrop-blur-sm bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">{scenario.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{scenario.text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to explore how each scenario makes you feel?
          </p>
          <Button 
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Explore Your Reactions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(PhaseTwo);
