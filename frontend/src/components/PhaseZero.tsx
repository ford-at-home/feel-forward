
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { errorHandler, handleAsync } from '@/lib/errorHandler';
import { ErrorMessage, getErrorType } from '@/components/ErrorMessage';
import { GracefulDegradation } from '@/components/GracefulDegradation';
import TopicInput from './TopicInput';
import FactorSelection from './FactorSelection';
import { ThinkingAnimation, LoadingCard } from '@/components/ui/loading-states';

interface Factor {
  category: string;
  items: string[];
}

interface PhaseZeroProps {
  onComplete: (data: { topic: string; factors: Factor[] }) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const PhaseZero: React.FC<PhaseZeroProps> = ({ 
  onComplete, 
  isLoading: externalLoading, 
  setIsLoading: setExternalLoading 
}) => {
  const [topic, setTopic] = useState('');
  const [factors, setFactors] = useState<Factor[]>([]);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [customFactor, setCustomFactor] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0 = topic input, 1 = factor selection
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  
  // Use external loading state if provided, otherwise use internal
  const isLoadingState = externalLoading !== undefined ? externalLoading : loading;
  const setLoadingState = useCallback((loadingState: boolean) => {
    if (setExternalLoading) {
      setExternalLoading(loadingState);
    } else {
      setLoading(loadingState);
    }
  }, [setExternalLoading]);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = useCallback(async () => {
    try {
      const health = await apiClient.healthCheck();
      setApiStatus(health.healthy ? 'online' : 'offline');
      console.log('API health status:', health);
    } catch (error) {
      console.error('Health check error:', error);
      setApiStatus('offline');
    }
  }, []);

  // Memoized fallback factors for when API is unavailable
  const getFallbackFactors = useCallback((topic: string): Factor[] => {
    console.log('Using fallback factors for topic:', topic);
    return [
      {
        category: "Financial",
        items: ["Salary", "Benefits", "Job Security", "Cost of Living", "Financial Growth"]
      },
      {
        category: "Lifestyle", 
        items: ["Work-Life Balance", "Location", "Flexibility", "Commute", "Travel Requirements"]
      },
      {
        category: "Career",
        items: ["Growth Opportunities", "Learning", "Industry", "Company Culture", "Leadership"]
      },
      {
        category: "Personal",
        items: ["Values Alignment", "Impact", "Relationships", "Stress Level", "Fulfillment"]
      }
    ];
  }, []);

  const handleTopicSubmit = useCallback(async () => {
    if (!topic.trim()) {
      toast({
        title: "Please enter a topic",
        description: "What decision are you trying to make?",
        variant: "destructive"
      });
      return;
    }

    setLoadingState(true);
    setError(null);
    console.log('Submitting topic:', topic.trim());

    try {
      if (apiStatus === 'offline') {
        throw new Error('API is offline');
      }

      const data = await handleAsync(
        () => apiClient.getFactors({ topic: topic.trim() }),
        {
          component: 'PhaseZero',
          action: 'fetch_factors',
          metadata: { topic: topic.trim(), retryCount }
        }
      );

      console.log('Received factors from API:', data);
      
      if (data?.factors && Array.isArray(data.factors) && data.factors.length > 0) {
        setFactors(data.factors);
        setStep(1);
        setRetryCount(0);
        toast({
          title: "Factors loaded successfully",
          description: "We've generated personalized factors for your decision.",
          variant: "default"
        });
      } else {
        throw new Error('No factors received from API');
      }
    } catch (error) {
      console.error('Error fetching factors:', error);
      setError(error as Error);
      
      // Use fallback factors when API is unavailable
      const fallbackFactors = getFallbackFactors(topic.trim());
      setFactors(fallbackFactors);
      setStep(1);
      
      errorHandler.logError(error as Error, {
        component: 'PhaseZero',
        action: 'factors_fallback',
        metadata: { 
          topic: topic.trim(), 
          retryCount,
          fallbackUsed: true 
        }
      });
      
      toast({
        title: "Using offline mode",
        description: "We've loaded some general factors to help you get started. You can add your own custom factors as needed.",
        variant: "default"
      });
    } finally {
      setLoadingState(false);
    }
  }, [topic, apiStatus, toast, getFallbackFactors, setLoadingState, retryCount]);

  const handleRetry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    await handleTopicSubmit();
  }, [handleTopicSubmit]);

  const toggleFactor = useCallback((factor: string) => {
    console.log('Toggling factor:', factor);
    setSelectedFactors(prev => 
      prev.includes(factor) 
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    );
  }, []);

  const addCustomFactor = useCallback(() => {
    if (customFactor.trim() && !selectedFactors.includes(customFactor.trim())) {
      console.log('Adding custom factor:', customFactor.trim());
      setSelectedFactors(prev => [...prev, customFactor.trim()]);
      setCustomFactor('');
    }
  }, [customFactor, selectedFactors]);

  const handleComplete = useCallback(() => {
    if (selectedFactors.length === 0) {
      toast({
        title: "Select some factors",
        description: "Choose at least one factor that matters to your decision.",
        variant: "destructive"
      });
      return;
    }

    console.log('Completing Phase 0 with factors:', selectedFactors);
    onComplete({ 
      topic, 
      factors: selectedFactors.map(f => ({ category: 'Selected', items: [f] }))
    });
  }, [selectedFactors, topic, onComplete, toast]);

  if (step === 0) {
    return (
      <GracefulDegradation
        requiresApi={true}
        featureName="Topic input"
        description="This feature helps you get started by analyzing your topic and suggesting relevant factors."
        onFallback={(reason) => {
          if (reason === 'api_error' || reason === 'offline') {
            // Show informational message but allow user to continue
            toast({
              title: "Limited functionality",
              description: "You can still enter a topic and proceed with default factors.",
              variant: "default"
            });
          }
        }}
      >
        <div className="space-y-4">
          {error && (
            <ErrorMessage
              type={getErrorType(error)}
              title="Topic Processing Error"
              message={error.message}
              onRetry={retryCount < 3 ? handleRetry : undefined}
              retryCount={retryCount}
              maxRetries={3}
              variant="alert"
            />
          )}
          
          {isLoadingState ? (
            <ThinkingAnimation 
              phase="analyzing"
              className="py-12"
            />
          ) : (
            <TopicInput
              topic={topic}
              setTopic={setTopic}
              onSubmit={handleTopicSubmit}
              loading={isLoadingState}
            />
          )}
        </div>
      </GracefulDegradation>
    );
  }

  return (
    <GracefulDegradation
      featureName="Factor selection"
      description="Choose the factors that matter most for your decision."
    >
      <FactorSelection
        topic={topic}
        factors={factors}
        selectedFactors={selectedFactors}
        customFactor={customFactor}
        setCustomFactor={setCustomFactor}
        onToggleFactor={toggleFactor}
        onAddCustomFactor={addCustomFactor}
        onComplete={handleComplete}
      />
    </GracefulDegradation>
  );
};

export default React.memo(PhaseZero);
