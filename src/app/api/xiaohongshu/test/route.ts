import { NextRequest, NextResponse } from 'next/server'

// 简单的测试端点，用于验证API配置
export async function GET() {
  try {
    const testResponse = await fetch('https://www.dajiala.com/fbmain/monitor/v3/xhs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'JZL3729556ba1f901a2',
        type: 1,
        keyword: '护肤',
        page: 1,
        sort: 'general',
        note_type: 'image',
        note_time: '7天内',
        note_range: '不限',
        proxy: ''
      }),
      signal: AbortSignal.timeout(10000) // 10秒超时
    })

    const responseText = await testResponse.text()

    return NextResponse.json({
      success: testResponse.ok,
      status: testResponse.status,
      statusText: testResponse.statusText,
      responsePreview: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}