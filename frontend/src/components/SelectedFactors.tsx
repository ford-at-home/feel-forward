
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface SelectedFactorsProps {
  selectedFactors: string[];
  onRemove: (factor: string) => void;
}

const SelectedFactors: React.FC<SelectedFactorsProps> = ({ 
  selectedFactors, 
  onRemove 
}) => {
  if (selectedFactors.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Selected factors ({selectedFactors.length})</h3>
      <div className="flex flex-wrap gap-2">
        {selectedFactors.map((factor, idx) => (
          <Badge 
            key={idx}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            {factor}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => onRemove(factor)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SelectedFactors;
