/**
 * 재사용 가능한 입력 필드 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 입력 필드 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 레이블 */
  label?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 왼쪽 아이콘 */
  leftIcon?: React.ReactNode;
  /** 오른쪽 아이콘 */
  rightIcon?: React.ReactNode;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = 'md',
      error = false,
      errorMessage,
      label,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // 고유 ID 생성
    const generatedId = React.useId();
    const inputId = id || generatedId;

    // 기본 스타일
    const baseStyles = [
      'border rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
      'placeholder:text-gray-400',
      'text-gray-900', // 입력 텍스트 색상을 진한 회색으로 설정
    ];

    // 크기별 스타일
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    // 상태별 스타일
    const stateStyles = error
      ? [
          'border-red-400 bg-red-50 border-2',
          'focus:border-red-500 focus:ring-red-200',
        ]
      : [
          'border-gray-400 bg-white border-2',
          'focus:border-blue-500 focus:ring-blue-200',
          'hover:border-gray-500',
        ];

    // 아이콘이 있을 때 패딩 조정
    const iconPadding = {
      left: leftIcon ? 'pl-10' : '',
      right: rightIcon ? 'pr-10' : '',
    };

    // 전체 너비 스타일
    const fullWidthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {/* 레이블 */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-semibold',
              error ? 'text-red-700' : 'text-gray-900',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* 입력 필드 컨테이너 */}
        <div className="relative">
          {/* 왼쪽 아이콘 */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* 입력 필드 */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              ...baseStyles,
              sizeStyles[size],
              ...stateStyles,
              iconPadding.left,
              iconPadding.right,
              fullWidthStyle,
              className
            )}
            disabled={disabled}
            {...props}
          />

          {/* 오른쪽 아이콘 */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* 에러 메시지 또는 도움말 */}
        {(errorMessage || helperText) && (
          <p
            className={cn(
              'text-xs',
              error || errorMessage ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
