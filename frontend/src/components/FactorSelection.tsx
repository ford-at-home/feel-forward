
import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import CustomFactorInput from './CustomFactorInput';
import SelectedFactors from './SelectedFactors';
import { ResponsiveCard, ResponsiveGrid, TouchOptimizedButton } from '@/components/ui/responsive-layout';
import { SelectionFeedback, StaggeredAnimation } from '@/components/ui/micro-interactions';
import { useIsMobile } from '@/hooks/use-mobile';

interface Factor {
  category: string;
  items: string[];
}

interface FactorSelectionProps {
  topic: string;
  factors: Factor[];
  selectedFactors: string[];
  customFactor: string;
  setCustomFactor: (factor: string) => void;
  onToggleFactor: (factor: string) => void;
  onAddCustomFactor: () => void;
  onComplete: () => void;
}

const FactorSelection: React.FC<FactorSelectionProps> = ({
  topic,
  factors,
  selectedFactors,
  customFactor,
  setCustomFactor,
  onToggleFactor,
  onAddCustomFactor,
  onComplete
}) => {
  const isMobile = useIsMobile();
  
  const handleFactorClick = useCallback((factor: string) => {
    onToggleFactor(factor);
  }, [onToggleFactor]);
  
  return (
    <ResponsiveCard variant="glass" size={isMobile ? 'sm' : 'md'}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">What factors matter to you?</h2>
        <p className="text-muted-foreground">
          Select the factors that could influence your decision about: <span className="font-medium">{topic}</span>
        </p>
      </div>
      
      <div className="space-y-6">
        <StaggeredAnimation stagger={150} animation="slideUp">
          {factors.map((category, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-medium text-lg text-purple-700">{category.category}</h3>
              <ResponsiveGrid columns={{ default: 1, sm: 2, md: 3 }} gap={3}>
                {category.items.map((item, itemIdx) => (
                  <SelectionFeedback
                    key={itemIdx}
                    isSelected={selectedFactors.includes(item)}
                    onToggle={() => handleFactorClick(item)}
                    variant="check"
                    className="p-3 text-sm font-medium transition-all hover:shadow-sm"
                  >
                    {item}
                  </SelectionFeedback>
                ))}
              </ResponsiveGrid>
            </div>
          ))}
        </StaggeredAnimation>

        <CustomFactorInput
          customFactor={customFactor}
          setCustomFactor={setCustomFactor}
          onAdd={onAddCustomFactor}
        />

        <SelectedFactors
          selectedFactors={selectedFactors}
          onRemove={onToggleFactor}
        />

        <TouchOptimizedButton 
          onClick={onComplete}
          disabled={selectedFactors.length === 0}
          size={isMobile ? 'lg' : 'md'}
          fullWidth
          variant="primary"
        >
          Continue to preferences ({selectedFactors.length} selected)
        </TouchOptimizedButton>
      </div>
    </ResponsiveCard>
  );
};

export default React.memo(FactorSelection);
