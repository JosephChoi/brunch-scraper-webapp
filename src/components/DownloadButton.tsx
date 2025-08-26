/**
 * 파일 다운로드 버튼 컴포넌트
 */

'use client';

import React, { useState } from 'react';
import { Button } from './ui';
import { cn } from '@/lib/utils';

export interface DownloadButtonProps {
  /** 다운로드할 텍스트 내용 */
  content: string;
  /** 파일명 */
  filename: string;
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** CSS 클래스명 */
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  filename,
  size = 'md',
  className,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * 파일 다운로드 처리
   */
  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Blob 생성
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      
      // 다운로드 URL 생성
      const url = URL.createObjectURL(blob);
      
      // 다운로드 링크 생성 및 클릭
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // URL 해제
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('다운로드 중 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 파일 크기 계산
  const fileSize = new Blob([content]).size;
  const fileSizeText = fileSize < 1024 
    ? `${fileSize}B`
    : fileSize < 1024 * 1024
    ? `${Math.round(fileSize / 1024)}KB`
    : `${Math.round(fileSize / (1024 * 1024))}MB`;

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || !content}
      size={size}
      className={cn(
        'flex items-center gap-2',
        'bg-green-600 hover:bg-green-700 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isDownloading ? (
        <>
          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
          <span>다운로드 중...</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>텍스트 파일 다운로드</span>
          <span className="text-xs opacity-75">({fileSizeText})</span>
        </>
      )}
    </Button>
  );
};