/**
 * 스크래핑 진행률 표시 컴포넌트
 */

'use client';

import React from 'react';
import { Progress } from './ui';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  /** 현재 진행된 수 */
  current: number;
  /** 전체 수 */
  total: number;
  /** 현재 처리 중인 URL */
  currentUrl?: string;
  /** 현재 처리 중인 제목 */
  currentTitle?: string;
  /** CSS 클래스명 */
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  currentUrl,
  currentTitle,
  className,
}) => {
  // 진행률 계산
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* 진행률 표시 */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          진행 상황
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {current} / {total} ({percentage}%)
        </span>
      </div>

      {/* 프로그레스 바 */}
      <Progress
        value={percentage}
        className="h-3 bg-gray-200 dark:bg-gray-700"
      />

      {/* 현재 처리 중인 정보 */}
      {(currentUrl || currentTitle) && (
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          {currentTitle && (
            <div className="font-medium truncate">
              📄 {currentTitle}
            </div>
          )}
          {currentUrl && (
            <div className="truncate font-mono">
              🔗 {currentUrl}
            </div>
          )}
        </div>
      )}

      {/* 로딩 애니메이션 */}
      {current < total && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
          <span>수집 중...</span>
        </div>
      )}
    </div>
  );
};