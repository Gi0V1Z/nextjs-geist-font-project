import { NextRequest, NextResponse } from 'next/server'
import { generateQRCodeForAPI, qrCodeStyles } from '@/app/helpers/qr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, style = 'default' } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL è richiesto' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL non valido' },
        { status: 400 }
      )
    }

    // Generate QR code with specified style
    const qrCodeData = await generateQRCodeForAPI(url)

    return NextResponse.json({
      success: true,
      data: qrCodeData
    })

  } catch (error: any) {
    console.error('QR Code generation error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Errore nella generazione del QR code',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const style = searchParams.get('style') || 'default'

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter è richiesto' },
      { status: 400 }
    )
  }

  try {
    // Validate URL format
    new URL(url)

    // Generate QR code
    const qrCodeData = await generateQRCodeForAPI(url)

    return NextResponse.json({
      success: true,
      data: qrCodeData
    })

  } catch (error: any) {
    console.error('QR Code generation error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Errore nella generazione del QR code',
        success: false 
      },
      { status: 500 }
    )
  }
}
