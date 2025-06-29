import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Heart, Sparkles, Brain, Target } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'pulse';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    default: 'text-gray-500',
    gradient: 'text-purple-500',
    pulse: 'text-pink-500'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )} 
    />
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'text' 
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = "Loading...",
  description,
  className
}) => {
  return (
    <div className={cn(
      'bg-white rounded-lg border shadow-sm p-6 space-y-4',
      className
    )}>
      <div className="flex items-center space-x-3">
        <LoadingSpinner variant="gradient" />
        <div className="space-y-2 flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

interface ThinkingAnimationProps {
  phase?: 'analyzing' | 'generating' | 'processing' | 'completing';
  className?: string;
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({
  phase = 'processing',
  className
}) => {
  const phaseConfig = {
    analyzing: {
      icon: Brain,
      color: 'text-blue-500',
      text: 'Analyzing your preferences...',
      dots: 3
    },
    generating: {
      icon: Sparkles,
      color: 'text-purple-500', 
      text: 'Generating scenarios...',
      dots: 4
    },
    processing: {
      icon: Target,
      color: 'text-pink-500',
      text: 'Processing your responses...',
      dots: 3
    },
    completing: {
      icon: Heart,
      color: 'text-green-500',
      text: 'Completing analysis...',
      dots: 5
    }
  };

  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <div className={cn('flex flex-col items-center space-y-4 py-8', className)}>
      <div className="relative">
        <Icon className={cn('w-12 h-12 animate-pulse', config.color)} />
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-ping" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-900">{config.text}</p>
        <div className="flex justify-center space-x-1">
          {Array.from({ length: config.dots }).map((_, i) => (
            <div
              key={i}
              className={cn('w-2 h-2 rounded-full', config.color.replace('text-', 'bg-'))}
              style={{
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProgressLoadingProps {
  progress: number;
  status: string;
  className?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress,
  status,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{status}</span>
          <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Floating action button with loading state
interface FloatingActionButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  className
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg',
        'flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'z-50',
        className
      )}
    >
      {loading ? (
        <LoadingSpinner size="sm" variant="default" className="text-white" />
      ) : (
        children
      )}
    </button>
  );
};