import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface EnhancedProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showConnectors?: boolean;
}

export const EnhancedProgress: React.FC<EnhancedProgressProps> = ({
  steps,
  currentStep,
  className,
  variant = 'horizontal',
  showLabels = true,
  showConnectors = true
}) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (variant === 'horizontal') {
    return (
      <div className={cn("w-full", className)}>
        {/* Progress bar */}
        <div className="relative w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Animated shimmer effect */}
          <div 
            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
            style={{ 
              transform: `translateX(-100%)`,
              animation: `shimmer 2s infinite`
            }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between items-start">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={cn(
                "flex flex-col items-center text-center max-w-[120px]",
                index <= currentStep ? "opacity-100" : "opacity-50"
              )}
            >
              {/* Step circle with icon */}
              <div className={cn(
                "relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-2",
                index < currentStep 
                  ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent text-white shadow-lg"
                  : index === currentStep
                  ? "bg-white border-purple-500 text-purple-500 shadow-md animate-pulse"
                  : "bg-gray-100 border-gray-300 text-gray-400"
              )}>
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : index === currentStep ? (
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
                
                {/* Connector line */}
                {showConnectors && index < steps.length - 1 && (
                  <div className={cn(
                    "absolute top-1/2 left-full w-[calc(100%-20px)] h-0.5 -translate-y-1/2 transition-all duration-500",
                    index < currentStep ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200"
                  )} />
                )}
              </div>

              {/* Step labels */}
              {showLabels && (
                <div className="space-y-1">
                  <h4 className={cn(
                    "text-xs font-medium leading-tight",
                    index <= currentStep ? "text-gray-900" : "text-gray-500"
                  )}>
                    {step.title}
                  </h4>
                  <p className={cn(
                    "text-xs leading-tight hidden sm:block",
                    index <= currentStep ? "text-gray-600" : "text-gray-400"
                  )}>
                    {step.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current step info */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-purple-700">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Vertical variant for mobile/sidebar
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-start space-x-3">
          {/* Step indicator */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
            index < currentStep 
              ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent text-white"
              : index === currentStep
              ? "bg-white border-purple-500 text-purple-500 animate-pulse"
              : "bg-gray-100 border-gray-300 text-gray-400"
          )}>
            {index < currentStep ? (
              <CheckCircle className="w-4 h-4" />
            ) : index === currentStep ? (
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
            ) : (
              <span className="text-xs font-medium">{index + 1}</span>
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "text-sm font-medium",
              index <= currentStep ? "text-gray-900" : "text-gray-500"
            )}>
              {step.title}
            </h4>
            {showLabels && (
              <p className={cn(
                "text-xs mt-1",
                index <= currentStep ? "text-gray-600" : "text-gray-400"
              )}>
                {step.description}
              </p>
            )}
          </div>

          {/* Connector */}
          {showConnectors && index < steps.length - 1 && (
            <div className="absolute left-[15px] mt-8 w-0.5 h-8 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
};

// Add shimmer animation to global CSS
export const progressStyles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;