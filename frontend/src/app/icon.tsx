// frontend/src/app/icon.tsx
// Next.js 13+ автоматически генерирует favicon из этого файла
// и отдаёт его по /favicon.ico без лишних настроек

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #00E5FF 0%, #7B2FBE 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 20,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        N
      </div>
    ),
    { ...size }
  )
}
