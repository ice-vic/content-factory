import { NextResponse } from 'next/server'
import { checkAIServiceAvailability, getAIConfig } from '@/services/aiService'

export async function GET() {
  try {
    const status = checkAIServiceAvailability()
    const config = getAIConfig()

    return NextResponse.json({
      success: true,
      status,
      config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      status: {
        available: false,
        error: error instanceof Error ? error.message : '未知错误',
        configured: false
      }
    }, { status: 500 })
  }
}