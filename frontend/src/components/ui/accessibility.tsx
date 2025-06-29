import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-4 left-4 z-50',
        'bg-purple-600 text-white px-4 py-2 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
      )}
    >
      {children}
    </a>
  );
};

interface FocusWrapperProps {
  children: React.ReactNode;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusWrapper: React.FC<FocusWrapperProps> = ({
  children,
  autoFocus = false,
  restoreFocus = false,
  className
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement>();

  useEffect(() => {
    if (autoFocus && wrapperRef.current) {
      const firstFocusable = wrapperRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        firstFocusable.focus();
      }
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [autoFocus, restoreFocus]);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
};

interface VisuallyHiddenProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  asChild = false 
}) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(
        'sr-only',
        (children as React.ReactElement).props.className
      )
    });
  }

  return <span className="sr-only">{children}</span>;
};

interface HighContrastModeProps {
  enabled: boolean;
  onToggle: () => void;
}

export const HighContrastToggle: React.FC<HighContrastModeProps> = ({
  enabled,
  onToggle
}) => {
  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [enabled]);

  return (
    <button
      onClick={onToggle}
      className={cn(
        'fixed top-4 right-4 z-50 p-2 rounded-lg',
        'bg-gray-100 hover:bg-gray-200 text-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-purple-500',
        'transition-colors duration-200'
      )}
      aria-label={`${enabled ? 'Disable' : 'Enable'} high contrast mode`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
      </svg>
    </button>
  );
};

interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  className
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className={className}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all'
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
};

interface ProgressAnnouncementProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  autoAnnounce?: boolean;
}

export const ProgressAnnouncement: React.FC<ProgressAnnouncementProps> = ({
  currentStep,
  totalSteps,
  stepName,
  autoAnnounce = true
}) => {
  const announcement = `Step ${currentStep + 1} of ${totalSteps}: ${stepName}`;

  if (!autoAnnounce) return null;

  return (
    <LiveRegion politeness="polite">
      {announcement}
    </LiveRegion>
  );
};

interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  description?: string;
  className?: string;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  title,
  description,
  className
}) => {
  const titleId = `form-title-${React.useId()}`;
  const descId = `form-desc-${React.useId()}`;

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      noValidate
    >
      <VisuallyHidden>
        <h2 id={titleId}>{title}</h2>
        {description && <p id={descId}>{description}</p>}
      </VisuallyHidden>
      {children}
    </form>
  );
};

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  className,
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-50',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? `${props.id}-loading` : undefined}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      {loading ? loadingText : children}
      {loading && (
        <VisuallyHidden>
          <span id={`${props.id}-loading`}>Please wait</span>
        </VisuallyHidden>
      )}
    </button>
  );
};

interface ReducedMotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ReducedMotion: React.FC<ReducedMotionProps> = ({
  children,
  fallback
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (prefersReducedMotion && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};