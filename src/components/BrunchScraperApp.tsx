/**
 * 브런치 스크래퍼 메인 애플리케이션 컴포넌트
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { ScrapeForm, ProgressBar, DownloadButton } from '@/components';
import { Card } from '@/components/ui';
import { useBrunchScraper } from '@/hooks';
import { ScrapeRequest, ScrapingProgress, ScrapingResult } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface BrunchScraperAppProps {
  className?: string;
}

/**
 * 브런치 스크래퍼 메인 애플리케이션
 */
export function BrunchScraperApp({ className }: BrunchScraperAppProps) {
  // 스크래핑 상태 관리
  const {
    state,
    progress,
    result,
    error,
    isLoading,
    startScraping,
    cancelScraping,
    resetState,
  } = useBrunchScraper({
    onProgress: (progress: ScrapingProgress) => {
      console.log('진행 상황:', progress);
    },
    onComplete: (result: ScrapingResult) => {
      console.log('완료:', result.metadata);
    },
    onError: (error: string) => {
      console.error('오류:', error);
    },
  });

  // 폼 제출 처리 (바로 스크래핑 시작)
  const handleFormSubmit = async (request: ScrapeRequest) => {
    await startScraping(request);
  };

  // 취소 처리
  const handleCancel = () => {
    cancelScraping();
  };

  // 재시작 처리
  const handleReset = () => {
    resetState();
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* 헤더 섹션 */}
      <div className="text-center space-y-6">
        {/* 브런치 로고 */}
        <div className="flex justify-center">
          <Image 
            src="/brunch logo.jpg" 
            alt="브런치 로고" 
            width={200}
            height={64}
            className="h-16 w-auto object-contain"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            브런치 텍스트 수집기
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            브런치 작가의 연속된 글들을 텍스트 파일로 수집하는 도구입니다.
            URL과 범위를 입력하면 자동으로 글을 수집하여 하나의 파일로 만들어드립니다.
          </p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="space-y-6">
        {/* 입력 폼 */}
        {(state === 'idle' || state === 'error') && (
          <Card className="p-6">
            <ScrapeForm
              onSubmit={handleFormSubmit}
              disabled={isLoading}
              loading={isLoading}
              className="space-y-4"
            />
          </Card>
        )}

        {/* 진행 상황 표시 */}
        {(isLoading || progress) && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  수집 진행 상황
                </h3>
                {isLoading && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 
                             border border-red-300 hover:border-red-400 rounded-md
                             transition-colors duration-200"
                  >
                    취소
                  </button>
                )}
              </div>

              <ProgressBar
                current={progress?.current || 0}
                total={progress?.total || 0}
                currentUrl={progress?.currentUrl}
                currentTitle={progress?.currentTitle}
                className="w-full"
              />

              {progress?.currentUrl && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="truncate">
                    <span className="font-medium">현재 처리 중:</span> {progress.currentUrl}
                  </p>
                  {progress.currentTitle && (
                    <p className="truncate mt-1">
                      <span className="font-medium">제목:</span> {progress.currentTitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 오류 표시 */}
        {error && state === 'error' && (
          <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    수집 중 오류가 발생했습니다
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 
                           border border-red-300 hover:border-red-400 rounded-md
                           transition-colors duration-200"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* 결과 표시 */}
        {result && state === 'completed' && (
          <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.36a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    수집이 완료되었습니다!
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                    <p>
                      <span className="font-medium">작가:</span> {result.metadata.authorId}
                    </p>
                    <p>
                      <span className="font-medium">범위:</span> {result.metadata.range}번 글
                    </p>
                    <p>
                      <span className="font-medium">수집 결과:</span>{' '}
                      {result.metadata.successCount}/{result.metadata.totalArticles}개 성공
                      {result.metadata.skippedCount > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          {' '}({result.metadata.skippedCount}개 실패)
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="font-medium">파일명:</span> {result.filename}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-green-200 dark:border-green-700">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-green-700 hover:text-green-800 
                           border border-green-300 hover:border-green-400 rounded-md
                           transition-colors duration-200"
                >
                  새로 수집
                </button>
                
                <DownloadButton
                  content={result.content}
                  filename={result.filename}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* 사용법 안내 */}
      {state === 'idle' && (
        <Card className="p-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              📋 사용법
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <span className="font-medium">1단계:</span> 브런치 글 URL을 입력하세요
                <br />
                <span className="text-xs text-blue-600 dark:text-blue-300 ml-6">
                  예: https://brunch.co.kr/@username (숫자 없이도 가능)
                </span>
              </p>
              <p>
                <span className="font-medium">2단계:</span> 수집할 글 범위를 설정하세요
                <br />
                <span className="text-xs text-blue-600 dark:text-blue-300 ml-6">
                  최대 50개까지 수집 가능합니다
                </span>
              </p>
              <p>
                <span className="font-medium">3단계:</span> 조건이 완성되면 &apos;🚀 수집 시작!&apos; 버튼이 활성화됩니다
                <br />
                <span className="text-xs text-blue-600 dark:text-blue-300 ml-6">
                  버튼 색상이 초록색으로 변하면 클릭하세요
                </span>
              </p>
              <p>
                <span className="font-medium">4단계:</span> 실시간 진행 상황을 확인하고 완료 후 파일을 다운로드하세요
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
