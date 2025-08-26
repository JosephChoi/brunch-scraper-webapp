/**
 * 재사용 가능한 진행률 바 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 진행률 (0-100) */
  value: number;
  /** 최대값 */
  max?: number;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 색상 변형 */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** 애니메이션 여부 */
  animated?: boolean;
  /** 줄무늬 패턴 여부 */
  striped?: boolean;
  /** 텍스트 표시 여부 */
  showText?: boolean;
  /** 커스텀 텍스트 */
  text?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      variant = 'primary',
      animated = false,
      striped = false,
      showText = false,
      text,
      ...props
    },
    ref
  ) => {
    // 진행률 계산 (0-100으로 정규화)
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // 기본 컨테이너 스타일
    const containerStyles = [
      'relative w-full bg-gray-300 rounded-full overflow-hidden border border-gray-400',
    ];

    // 크기별 스타일
    const sizeStyles = {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
    };

    // 색상별 스타일
    const variantStyles = {
      primary: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };

    // 바 기본 스타일
    const barStyles = [
      'h-full transition-all duration-300 ease-out',
      variantStyles[variant],
    ];

    // 줄무늬 스타일
    const stripedStyles = striped
      ? [
          'bg-gradient-to-r from-transparent via-white/20 to-transparent',
          'bg-size-animate',
        ]
      : [];

    // 애니메이션 스타일
    const animatedStyles = animated
      ? ['animate-progress']
      : [];

    // 텍스트 크기
    const textSizeStyles = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    // 표시할 텍스트 결정
    const displayText = text || `${Math.round(percentage)}%`;

    return (
      <div
        ref={ref}
        className={cn(...containerStyles, sizeStyles[size], className)}
        {...props}
      >
        {/* 진행률 바 */}
        <div
          className={cn(...barStyles, ...stripedStyles, ...animatedStyles)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuetext={showText ? displayText : undefined}
        >
          {/* 줄무늬 패턴 */}
          {striped && (
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-r',
                'from-transparent via-white/30 to-transparent',
                'bg-[length:20px_20px]',
                animated && 'animate-pulse'
              )}
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 5px,
                  rgba(255,255,255,0.2) 5px,
                  rgba(255,255,255,0.2) 10px
                )`,
              }}
            />
          )}
        </div>

        {/* 진행률 텍스트 */}
        {showText && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'font-medium text-gray-700',
              textSizeStyles[size]
            )}
          >
            {displayText}
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// 원형 진행률 바 컴포넌트
export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 진행률 (0-100) */
  value: number;
  /** 최대값 */
  max?: number;
  /** 크기 */
  size?: number;
  /** 선 두께 */
  strokeWidth?: number;
  /** 색상 변형 */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** 텍스트 표시 여부 */
  showText?: boolean;
  /** 커스텀 텍스트 */
  text?: string;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 120,
      strokeWidth = 8,
      variant = 'primary',
      showText = true,
      text,
      ...props
    },
    ref
  ) => {
    // 진행률 계산
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    // SVG 계산
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // 색상별 스타일
    const variantColors = {
      primary: '#3b82f6', // blue-500
      success: '#10b981', // green-500  
      warning: '#f59e0b', // yellow-500
      error: '#ef4444', // red-500
    };

    // 표시할 텍스트
    const displayText = text || `${Math.round(percentage)}%`;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* 진행률 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={variantColors[variant]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* 중앙 텍스트 */}
        {showText && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {displayText}
            </span>
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export { Progress, CircularProgress };
