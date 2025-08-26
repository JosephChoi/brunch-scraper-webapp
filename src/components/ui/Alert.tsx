/**
 * 재사용 가능한 알림/에러 메시지 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 알림 변형 */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
  /** 닫기 버튼 표시 여부 */
  dismissible?: boolean;
  /** 닫기 콜백 */
  onDismiss?: () => void;
  /** 제목 */
  title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      size = 'md',
      showIcon = true,
      dismissible = false,
      onDismiss,
      title,
      children,
      ...props
    },
    ref
  ) => {
    // 기본 스타일
    const baseStyles = [
      'relative rounded-lg border transition-all duration-200',
      'flex items-start gap-3',
    ];

    // 크기별 스타일
    const sizeStyles = {
      sm: 'p-3 text-sm',
      md: 'p-4 text-base',
      lg: 'p-5 text-lg',
    };

    // 변형별 스타일
    const variantStyles = {
      info: [
        'bg-blue-50 border-blue-200 text-blue-800',
        '[&>svg]:text-blue-500',
      ],
      success: [
        'bg-green-50 border-green-200 text-green-800',
        '[&>svg]:text-green-500',
      ],
      warning: [
        'bg-yellow-50 border-yellow-200 text-yellow-800',
        '[&>svg]:text-yellow-500',
      ],
      error: [
        'bg-red-50 border-red-200 text-red-800',
        '[&>svg]:text-red-500',
      ],
    };

    // 아이콘 컴포넌트들
    const icons = {
      info: (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      success: (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    // 닫기 버튼
    const CloseButton = () => (
      <button
        type="button"
        className={cn(
          'absolute top-2 right-2 p-1 rounded-md',
          'hover:bg-black/10 focus:bg-black/10',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
        )}
        onClick={onDismiss}
        aria-label="알림 닫기"
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );

    return (
      <div
        ref={ref}
        className={cn(
          ...baseStyles,
          sizeStyles[size],
          ...variantStyles[variant],
          dismissible && 'pr-10',
          className
        )}
        role="alert"
        {...props}
      >
        {/* 아이콘 */}
        {showIcon && icons[variant]}

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium mb-1">
              {title}
            </h4>
          )}
          <div className={title ? 'text-sm opacity-90' : ''}>
            {children}
          </div>
        </div>

        {/* 닫기 버튼 */}
        {dismissible && <CloseButton />}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
