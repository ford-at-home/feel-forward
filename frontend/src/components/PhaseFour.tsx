import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Heart, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Reaction {
  scenario_id: string;
  excitement: number;
  anxiety: number;
  body: string;
  freeform: string;
}

interface Preference {
  factor: string;
  importance: number;
  hasLimit: boolean;
  limit: string;
  tradeoff: string;
}

interface PhaseFourProps {
  reactions: Reaction[];
  preferences: Preference[];
  userData?: any;
  onRestart?: () => void;
}

const PhaseFour: React.FC<PhaseFourProps> = ({ 
  reactions, 
  preferences, 
  userData,
  onRestart
}) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = useCallback(async () => {
    try {
      const data = await apiClient.generateSummary({ reactions, preferences });
      setSummary(data.summary || '');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unable to generate insights. Showing sample insights.",
        variant: "destructive"
      });
      // Fallback summary
      setSummary("Based on your responses, you seem to value stability and growth opportunities, but you're also drawn to environments where you can make a meaningful impact. Your emotional reactions suggest you're most energized by scenarios that offer both personal development and the chance to work with passionate people. Consider prioritizing roles that offer mentorship and clear progression paths while maintaining some flexibility in how you work.");
    } finally {
      setLoading(false);
    }
  }, [reactions, preferences, toast]);

  const handleStartOver = useCallback(() => {
    if (onRestart) {
      onRestart();
    } else {
      window.location.reload();
    }
  }, [onRestart]);
  
  const handleSaveInsights = useCallback(() => {
    // Create a printable version of insights
    const insights = {
      summary,
      avgExcitement: reactions.reduce((sum, r) => sum + r.excitement, 0) / reactions.length,
      avgAnxiety: reactions.reduce((sum, r) => sum + r.anxiety, 0) / reactions.length,
      topPreferences: preferences
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3),
      timestamp: new Date().toISOString(),
      topic: userData?.topic || 'Decision Making'
    };
    
    // Try to download as JSON, fallback to print
    try {
      const dataStr = JSON.stringify(insights, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `feel-forward-insights-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      // Fallback to print
      window.print();
    }
  }, [summary, reactions, preferences, userData]);

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Analyzing your emotional patterns...</h3>
          <p className="text-muted-foreground text-center">
            We're synthesizing your reactions to understand what you really want
          </p>
        </CardContent>
      </Card>
    );
  }

  // Memoize calculations
  const avgExcitement = useMemo(() => 
    reactions.reduce((sum, r) => sum + r.excitement, 0) / reactions.length, 
    [reactions]
  );
  const avgAnxiety = useMemo(() => 
    reactions.reduce((sum, r) => sum + r.anxiety, 0) / reactions.length, 
    [reactions]
  );
  const topPreferences = useMemo(() => 
    preferences
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3),
    [preferences]
  );

  return (
    <div className="space-y-6">
      {/* Main insights */}
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2 flex items-center justify-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Your Emotional Truth
          </CardTitle>
          <p className="text-muted-foreground">
            What your heart is really telling you
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
            <p className="text-gray-700 leading-relaxed text-lg">
              {summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emotional patterns */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-500" />
              Emotional Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Average Excitement</span>
              <span className="text-lg font-bold text-green-600">{avgExcitement.toFixed(1)}/10</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="font-medium">Average Anxiety</span>
              <span className="text-lg font-bold text-orange-600">{avgAnxiety.toFixed(1)}/10</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {avgExcitement > avgAnxiety 
                ? "You tend to feel more excited than anxious about your options - trust that optimism!"
                : "You feel some anxiety about change - that's normal and shows you care about making the right choice."
              }
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Top Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPreferences.map((pref, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">{pref.factor}</span>
                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {pref.importance}/10
                </span>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              These are your highest-rated factors. Use them as your north star.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next steps */}
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <p>✨ <strong>Trust your insights:</strong> Your emotional reactions revealed important truths about what you value.</p>
            <p>🎯 <strong>Use your priorities:</strong> Let your top-rated factors guide your decision-making process.</p>
            <p>💭 <strong>Reflect regularly:</strong> Come back to this process as your situation evolves.</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleStartOver}
              variant="outline" 
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start New Journey
            </Button>
            <Button 
              onClick={handleSaveInsights}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Save Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(PhaseFour);
