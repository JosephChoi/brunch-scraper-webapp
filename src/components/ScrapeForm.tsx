/**
 * 스크래핑 설정 폼 컴포넌트
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Alert } from './ui';
import { ScrapeRequest, FieldError } from '@/lib/types';
import { isValidBrunchUrl } from '@/lib/utils';

export interface ScrapeFormProps {
  /** 폼 제출 콜백 */
  onSubmit: (data: ScrapeRequest) => void;
  /** 로딩 상태 */
  loading?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 폼 비활성화 여부 */
  disabled?: boolean;
  /** CSS 클래스명 */
  className?: string;
}

export const ScrapeForm: React.FC<ScrapeFormProps> = ({
  onSubmit,
  loading = false,
  error,
  disabled = false,
  className,
}) => {
  // 폼 상태 (입력용)
  const [formData, setFormData] = useState({
    url: '',
    startNum: '',
    endNum: '',
  });

  // 검증 에러 상태 (예비용)
  // const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  // 폼 검증 함수
  const validateForm = (data: typeof formData): FieldError[] => {
    const errors: FieldError[] = [];

    // URL 검증
    if (!data.url.trim()) {
      errors.push({
        field: 'url',
        message: '브런치 URL을 입력해주세요.',
      });
    } else if (!isValidBrunchUrl(data.url.trim())) {
      errors.push({
        field: 'url',
        message: '올바른 브런치 URL 형식이 아닙니다. (예: https://brunch.co.kr/@author/123)',
      });
    }

    // 시작 번호 검증
    const startNum = parseInt(data.startNum);
    if (!data.startNum.trim() || isNaN(startNum) || startNum < 1) {
      errors.push({
        field: 'startNum',
        message: '시작 번호는 1 이상의 숫자여야 합니다.',
      });
    }

    // 종료 번호 검증
    const endNum = parseInt(data.endNum);
    if (!data.endNum.trim() || isNaN(endNum) || endNum < 1) {
      errors.push({
        field: 'endNum',
        message: '종료 번호는 1 이상의 숫자여야 합니다.',
      });
    } else if (!isNaN(startNum) && startNum > endNum) {
      errors.push({
        field: 'endNum',
        message: '종료 번호는 시작 번호보다 크거나 같아야 합니다.',
      });
    } else if (!isNaN(startNum) && endNum - startNum + 1 > 50) {
      errors.push({
        field: 'endNum',
        message: '한 번에 최대 50개의 글만 수집할 수 있습니다.',
      });
    }

    return errors;
  };

  // 특정 필드의 에러 메시지 가져오기 (예비용)
  // const getFieldError = (field: string): string | undefined => {
  //   return fieldErrors.find(error => error.field === field)?.message;
  // };

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 해당 필드의 에러 제거 (예비용)
    // setFieldErrors(prev => prev.filter(error => error.field !== field));
  };

  // 수집 시작 핸들러
  const handleStartScraping = () => {
    // 검증 실행
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
      // setFieldErrors(errors); // 예비용
      console.log('검증 에러:', errors);
      return;
    }

    // 에러 초기화 후 제출 (예비용)
    // setFieldErrors([]);
    onSubmit({
      url: formData.url.trim(),
      startNum: parseInt(formData.startNum),
      endNum: parseInt(formData.endNum),
    });
  };

  // 폼 제출 핸들러 (Enter 키 지원용)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      handleStartScraping();
    }
  };

  // 폼 유효성 검사 (실시간)
  const isFormValid = (): boolean => {
    const url = formData.url.trim();
    const startNum = parseInt(formData.startNum);
    const endNum = parseInt(formData.endNum);
    
    return !!(
      url &&
      isValidBrunchUrl(url) &&
      !isNaN(startNum) &&
      startNum >= 1 &&
      !isNaN(endNum) &&
      endNum >= 1 &&
      startNum <= endNum &&
      endNum - startNum + 1 <= 50
    );
  };

  // 예제 URL 적용 핸들러
  const handleExampleUrl = () => {
    setFormData(prev => ({
      ...prev,
      url: 'https://brunch.co.kr/@ssoojeenlee',
    }));
    // setFieldErrors(prev => prev.filter(error => error.field !== 'url')); // 예비용
  };

  return (
    <div className={className}>
      <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 font-bold">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          브런치 텍스트 수집기
        </CardTitle>
        <CardDescription>
          브런치 블로그에서 연속된 글들을 수집하여 텍스트 파일로 다운로드하세요.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 에러 메시지 표시 */}
          {error && (
            <Alert variant="error" dismissible onDismiss={() => {}}>
              {error}
            </Alert>
          )}

          {/* URL 입력 필드 */}
          <div className="space-y-2">
            <Input
              label="브런치 URL"
              placeholder="https://brunch.co.kr/@author/123"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}

              disabled={disabled || loading}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              }
            />
            
            {/* 예제 URL 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExampleUrl}
              disabled={disabled || loading}
            >
              예제 URL 사용하기
            </Button>
          </div>

          {/* 범위 입력 필드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="시작 글 번호"
              type="number"
              min="1"
              placeholder="예: 1"
              value={formData.startNum}
              onChange={(e) => handleInputChange('startNum', e.target.value)}
              disabled={disabled || loading}
              helperText="수집을 시작할 글 번호"
            />

            <Input
              label="종료 글 번호"
              type="number"
              min="1"
              placeholder="예: 10"
              value={formData.endNum}
              onChange={(e) => handleInputChange('endNum', e.target.value)}
              disabled={disabled || loading}
              helperText="수집을 종료할 글 번호"
            />
          </div>

          {/* 수집 정보 표시 */}
          {formData.startNum && formData.endNum && parseInt(formData.startNum) <= parseInt(formData.endNum) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">수집 예정:</span>{' '}
                {parseInt(formData.endNum) - parseInt(formData.startNum) + 1}개의 글
                {parseInt(formData.endNum) - parseInt(formData.startNum) > 50 && (
                  <span className="text-yellow-600 ml-2">
                    ⚠️ 많은 양의 글을 수집하면 시간이 오래 걸릴 수 있습니다.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* 수집 시작 버튼 */}
          <div className="pt-4">
            <Button
              type="button"
              fullWidth
              loading={loading}
              disabled={disabled || !isFormValid()}
              onClick={handleStartScraping}
              variant={
                isFormValid() && !disabled && !loading
                  ? 'primary'
                  : 'disabled'
              }
              className={`transition-all duration-300 ${
                isFormValid() && !disabled && !loading
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-[1.02]'
                  : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
                  수집 중...
                </span>
              ) : isFormValid() ? (
                '🚀 수집 시작!'
              ) : (
                '상단 정보를 입력해주세요'
              )}
            </Button>
          </div>

          {/* 법적 고지사항 */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-medium mb-1">⚠️ 법적 고지사항</p>
                <ul className="space-y-1 text-amber-700">
                  <li>• 수집되는 콘텐츠의 <strong>지적재산권은 원저작자</strong>에게 있습니다.</li>
                  <li>• 수집된 자료는 <strong>개인적 목적으로만</strong> 사용해야 합니다.</li>
                  <li>• 상업적 이용, 재배포, 공유 시 <strong>원저작자의 사전 동의</strong>가 필요합니다.</li>
                  <li>• 본 도구는 수집 기능만 제공하며, <strong>콘텐츠 사용에 대한 모든 책임은 사용자</strong>에게 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* 안내 사항 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📝 사용 안내</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 브런치 블로그의 공개된 글만 수집할 수 있습니다.</li>
            <li>• 한 번에 최대 50개의 글까지 수집 가능합니다.</li>
            <li>• 수집된 텍스트는 개인 용도로만 사용해주세요.</li>
            <li>• 서버 부하 방지를 위해 글 간 2-3초 간격으로 수집됩니다.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};
