import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'centered' | 'sidebar';
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  variant = 'default'
}) => {
  const isMobile = useIsMobile();

  const variantClasses = {
    default: 'container mx-auto px-4 py-8',
    centered: 'min-h-screen flex items-center justify-center p-4',
    sidebar: 'flex flex-col lg:flex-row min-h-screen'
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 4,
  className
}) => {
  const gridClasses = [
    `grid gap-${gap}`,
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md'
}) => {
  const isMobile = useIsMobile();

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-gray-200',
    glass: 'bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg'
  };

  const sizeClasses = {
    sm: isMobile ? 'p-4' : 'p-6',
    md: isMobile ? 'p-6' : 'p-8',
    lg: isMobile ? 'p-6' : 'p-10'
  };

  return (
    <div className={cn(
      'rounded-lg transition-all duration-300',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  className
}) => {
  const isMobile = useIsMobile();

  const getFlexDirection = () => {
    if (direction === 'responsive') {
      return isMobile ? 'flex-col' : 'flex-row';
    }
    return direction === 'vertical' ? 'flex-col' : 'flex-row';
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };

  const gapClass = direction === 'vertical' || (direction === 'responsive' && isMobile) 
    ? `space-y-${spacing}` 
    : `space-x-${spacing}`;

  return (
    <div className={cn(
      'flex',
      getFlexDirection(),
      alignClasses[align],
      justifyClasses[justify],
      gapClass,
      className
    )}>
      {children}
    </div>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  children
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className={cn(
        'fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50 lg:hidden',
        'transform transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="h-full overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
};

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className
}) => {
  const isMobile = useIsMobile();

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-50',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };

  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[52px]' : 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'font-medium rounded-lg transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95 touch-manipulation',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {children}
    </button>
  );
};

interface BreakpointIndicatorProps {
  show?: boolean;
}

export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({ 
  show = process.env.NODE_ENV === 'development' 
}) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-black text-white px-2 py-1 rounded text-xs font-mono">
      <span className="sm:hidden">XS</span>
      <span className="hidden sm:inline md:hidden">SM</span>
      <span className="hidden md:inline lg:hidden">MD</span>
      <span className="hidden lg:inline xl:hidden">LG</span>
      <span className="hidden xl:inline 2xl:hidden">XL</span>
      <span className="hidden 2xl:inline">2XL</span>
    </div>
  );
};