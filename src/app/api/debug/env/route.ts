import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    env: {
      AI_ANALYSIS_ENABLED: process.env.AI_ANALYSIS_ENABLED,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '已配置' : '未配置',
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      AI_TEMPERATURE: process.env.AI_TEMPERATURE,
      AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
      AI_BATCH_SIZE: process.env.AI_BATCH_SIZE
    },
    timestamp: new Date().toISOString()
  })
}
