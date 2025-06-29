
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CustomFactorInputProps {
  customFactor: string;
  setCustomFactor: (factor: string) => void;
  onAdd: () => void;
}

const CustomFactorInput: React.FC<CustomFactorInputProps> = ({ 
  customFactor, 
  setCustomFactor, 
  onAdd 
}) => {
  return (
    <div className="border-t pt-4 space-y-3">
      <h3 className="font-medium">Add your own factor</h3>
      <div className="flex gap-2">
        <Input
          placeholder="Type a custom factor..."
          value={customFactor}
          onChange={(e) => setCustomFactor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        />
        <Button 
          onClick={onAdd}
          variant="outline"
          size="icon"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CustomFactorInput;
