/**
 * 재사용 가능한 버튼 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'disabled';
  /** 로딩 상태 */
  loading?: boolean;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 아이콘 (선택사항) */
  icon?: React.ReactNode;
  /** 아이콘 위치 */
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      size = 'md',
      variant = 'primary',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // 기본 스타일
    const baseStyles = [
      'inline-flex items-center justify-center rounded-lg font-medium',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'select-none',
    ];

    // 크기별 스타일
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    // 변형별 스타일
    const variantStyles = {
      primary: [
        'bg-primary-500 text-white',
        'hover:bg-primary-600 active:bg-primary-700',
        'focus:ring-primary-500',
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200 active:bg-gray-300',
        'focus:ring-gray-500',
      ],
      outline: [
        'border border-gray-300 bg-transparent text-gray-700',
        'hover:bg-gray-50 active:bg-gray-100',
        'focus:ring-gray-500',
      ],
      ghost: [
        'bg-transparent text-gray-600',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:ring-gray-500',
      ],
      danger: [
        'bg-red-500 text-white',
        'hover:bg-red-600 active:bg-red-700',
        'focus:ring-red-500',
      ],
      disabled: [
        'bg-gray-200 text-gray-800 border-2 border-gray-400',
        'cursor-not-allowed font-medium',
        'hover:bg-gray-100',
      ],
    };

    // 전체 너비 스타일
    const fullWidthStyle = fullWidth ? 'w-full' : '';

    // 로딩 스피너 컴포넌트
    const LoadingSpinner = () => (
      <svg
        className="animate-spin"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="32"
        >
          <animate
            attributeName="stroke-dasharray"
            dur="2s"
            values="0 32;16 16;0 32;0 32"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dashoffset"
            dur="2s"
            values="0;-16;-32;-32"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    );

    // 아이콘 렌더링
    const renderIcon = () => {
      if (loading) return <LoadingSpinner />;
      if (!icon) return null;
      return <span className="flex-shrink-0">{icon}</span>;
    };

    // 컨텐츠 렌더링
    const renderContent = () => {
      if (iconPosition === 'right') {
        return (
          <>
            {children}
            {renderIcon()}
          </>
        );
      }
      
      return (
        <>
          {renderIcon()}
          {children}
        </>
      );
    };

    return (
      <button
        ref={ref}
        className={cn(
          ...baseStyles,
          sizeStyles[size],
          ...variantStyles[variant],
          fullWidthStyle,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
