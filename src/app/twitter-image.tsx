import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = '브런치 텍스트 수집기'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#161F2F',
          position: 'relative',
        }}
      >
        {/* 배경 그라데이션 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #161F2F 0%, #2D3748 50%, #4A5568 100%)',
          }}
        />
        
        {/* 상단 브런치 로고와 타이틀 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
            zIndex: 1,
          }}
        >
          {/* 브런치 로고 */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 25,
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#FF6B35',
                fontFamily: 'system-ui',
              }}
            >
              br
            </div>
          </div>
          
          {/* 타이틀 */}
          <div
            style={{
              color: 'white',
              fontSize: 56,
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            브런치 텍스트 수집기
          </div>
        </div>
        
        {/* 설명 */}
        <div
          style={{
            color: '#E2E8F0',
            fontSize: 28,
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
            zIndex: 1,
          }}
        >
          브런치 글을 쉽게 수집하고 텍스트 파일로 다운로드
        </div>
        
        {/* 기능 태그들 */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            zIndex: 1,
          }}
        >
          <div
            style={{
              backgroundColor: '#4FD1C7',
              color: '#161F2F',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            📚 최대 50개 수집
          </div>
          <div
            style={{
              backgroundColor: '#63B3ED',
              color: '#161F2F',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            📊 실시간 진행률
          </div>
          <div
            style={{
              backgroundColor: '#68D391',
              color: '#161F2F',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            💾 텍스트 다운로드
          </div>
        </div>
        
        {/* 하단 URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            color: '#A0AEC0',
            fontSize: 20,
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          #브런치 #텍스트수집 #스크래핑
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
