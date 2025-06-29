import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  title, 
  description, 
  icon = <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
}) => {
  return (
    <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default React.memo(LoadingState);