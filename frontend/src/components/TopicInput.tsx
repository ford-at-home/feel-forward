
import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface TopicInputProps {
  topic: string;
  setTopic: (topic: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ topic, setTopic, onSubmit, loading }) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && topic.trim()) {
      onSubmit();
    }
  }, [onSubmit, loading, topic]);
  return (
    <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl mb-2">What decision are you making?</CardTitle>
        <p className="text-muted-foreground">
          Tell us about the choice you're facing so we can help you explore what matters most.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Your decision topic</label>
          <Input
            placeholder="e.g., choosing a new job, picking where to live, deciding on a career change..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-lg p-4"
          />
        </div>
        
        <Button 
          onClick={onSubmit}
          disabled={loading || !topic.trim()}
          size="lg"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Finding relevant factors...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default React.memo(TopicInput);
