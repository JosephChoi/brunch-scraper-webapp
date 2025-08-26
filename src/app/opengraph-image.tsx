import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = '브런치 텍스트 수집기'
export const size = {
  width: 1200,
  height: 630,
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
          fontSize: 60,
          fontWeight: 700,
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
        
        {/* 브런치 로고 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
            zIndex: 1,
          }}
        >
          {/* 로고 배경 원형 */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 30,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            {/* 브런치 로고 텍스트 (실제 이미지 대신) */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#FF6B35',
                fontFamily: 'system-ui',
              }}
            >
              br
            </div>
          </div>
          
          {/* 메인 타이틀 */}
          <div
            style={{
              color: 'white',
              fontSize: 72,
              fontWeight: 900,
              textAlign: 'left',
              lineHeight: 1.1,
            }}
          >
            브런치<br />텍스트 수집기
          </div>
        </div>
        
        {/* 설명 텍스트 */}
        <div
          style={{
            color: '#E2E8F0',
            fontSize: 32,
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.3,
            zIndex: 1,
          }}
        >
          브런치 글을 쉽게 수집하고<br />
          텍스트 파일로 다운로드하세요
        </div>
        
        {/* 기능 아이콘들 */}
        <div
          style={{
            display: 'flex',
            marginTop: 50,
            gap: 60,
            zIndex: 1,
          }}
        >
          {/* 수집 아이콘 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#4FD1C7',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>글 수집</div>
          </div>
          
          {/* 진행률 아이콘 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#63B3ED',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>실시간 진행률</div>
          </div>
          
          {/* 다운로드 아이콘 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#68D391',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>💾</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>텍스트 다운로드</div>
          </div>
        </div>
        
        {/* 하단 URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            color: '#A0AEC0',
            fontSize: 24,
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          brunch-scraper-webapp.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
