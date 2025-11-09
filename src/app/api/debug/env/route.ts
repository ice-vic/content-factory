import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      AI_ANALYSIS_ENABLED: process.env.AI_ANALYSIS_ENABLED,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `已配置 (${process.env.OPENAI_API_KEY.length} 字符)` : '未配置',
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      AI_TEMPERATURE: process.env.AI_TEMPERATURE,
      AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
      AI_BATCH_SIZE: process.env.AI_BATCH_SIZE,
      DAILY_AI_ANALYSIS_LIMIT: process.env.DAILY_AI_ANALYSIS_LIMIT,
      COST_MONITORING_ENABLED: process.env.COST_MONITORING_ENABLED
    }

    return NextResponse.json({
      success: true,
      config,
      environment: 'server'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}