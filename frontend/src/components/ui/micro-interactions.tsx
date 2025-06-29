import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Star, Heart, ArrowRight, Sparkles } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'bounce' | 'pulse' | 'shake' | 'glow' | 'float';
  disabled?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'bounce',
  disabled = false,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsAnimating(true);
    onClick();
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const variantClasses = {
    bounce: isAnimating ? 'animate-bounce' : 'hover:animate-pulse',
    pulse: isAnimating ? 'animate-pulse' : 'hover:scale-105',
    shake: isAnimating ? 'animate-[wiggle_0.3s_ease-in-out]' : 'hover:scale-105',
    glow: isAnimating ? 'shadow-lg shadow-purple-500/50' : 'hover:shadow-md',
    float: isAnimating ? 'animate-[float_0.6s_ease-in-out]' : 'hover:-translate-y-1'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'px-6 py-3 rounded-lg font-medium transition-all duration-300',
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

interface SelectionFeedbackProps {
  isSelected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: 'check' | 'heart' | 'star';
  className?: string;
}

export const SelectionFeedback: React.FC<SelectionFeedbackProps> = ({
  isSelected,
  onToggle,
  children,
  variant = 'check',
  className
}) => {
  const [justToggled, setJustToggled] = useState(false);

  const handleToggle = () => {
    setJustToggled(true);
    onToggle();
    setTimeout(() => setJustToggled(false), 500);
  };

  const iconMap = {
    check: Check,
    heart: Heart,
    star: Star
  };

  const Icon = iconMap[variant];

  return (
    <div
      onClick={handleToggle}
      className={cn(
        'relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300',
        'hover:shadow-md active:scale-95',
        isSelected 
          ? 'border-purple-500 bg-purple-50 shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300',
        justToggled && 'animate-[success_0.5s_ease-in-out]',
        className
      )}
    >
      {children}
      
      {/* Selection indicator */}
      <div className={cn(
        'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
        isSelected 
          ? 'bg-purple-500 text-white scale-100' 
          : 'bg-gray-200 text-gray-400 scale-75 opacity-0'
      )}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Ripple effect */}
      {justToggled && (
        <div className="absolute inset-0 rounded-lg bg-purple-500/20 animate-ping" />
      )}
    </div>
  );
};

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  className,
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

interface CountUpAnimationProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const CountUpAnimation: React.FC<CountUpAnimationProps> = ({
  value,
  duration = 1000,
  className,
  suffix = '',
  prefix = ''
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  duration = 3000,
  delay = 0,
  className
}) => {
  return (
    <div
      className={cn('animate-[float_3s_ease-in-out_infinite]', className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

interface PulseIndicatorProps {
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'pink' | 'blue' | 'green';
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  active = true,
  size = 'md',
  color = 'purple',
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500'
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div className={cn(
        'rounded-full',
        sizeClasses[size],
        colorClasses[color],
        active && 'animate-pulse'
      )} />
      {active && (
        <div className={cn(
          'absolute rounded-full animate-ping',
          sizeClasses[size],
          colorClasses[color],
          'opacity-75'
        )} />
      )}
    </div>
  );
};

interface StaggeredAnimationProps {
  children: React.ReactNode[];
  stagger?: number;
  animation?: 'fadeIn' | 'slideUp' | 'slideIn' | 'scale';
  className?: string;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  stagger = 100,
  animation = 'fadeIn',
  className
}) => {
  const animationClasses = {
    fadeIn: 'animate-[fadeIn_0.6s_ease-out_forwards]',
    slideUp: 'animate-[slideUp_0.6s_ease-out_forwards]',
    slideIn: 'animate-[slideIn_0.6s_ease-out_forwards]',
    scale: 'animate-[scaleIn_0.6s_ease-out_forwards]'
  };

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn('opacity-0', animationClasses[animation])}
          style={{ animationDelay: `${index * stagger}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  onComplete,
  message = "Success!"
}) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center animate-[successPop_0.8s_ease-out]">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-[checkmark_0.6s_ease-in-out]">
          <Check className="w-8 h-8 text-white" />
        </div>
        <p className="text-lg font-semibold text-gray-900">{message}</p>
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-green-600 opacity-20 animate-pulse" />
      </div>
    </div>
  );
};

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};