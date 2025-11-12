import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // 直接调用AI服务进行测试
    const { callOpenAIWithMessages } = await import('@/services/aiService');

    console.log('🧪 开始测试AI服务调用...');

    const response = await callOpenAIWithMessages([
      {
        role: 'system',
        content: '你是一个测试助手，请用中文回复。'
      },
      {
        role: 'user',
        content: '请简单回复"测试成功"，不要有其他内容。'
      }
    ]);

    console.log('✅ AI调用成功:', {
      hasChoices: !!response.choices,
      choicesCount: response.choices?.length || 0,
      hasContent: !!response.choices?.[0]?.message?.content
    });

    return NextResponse.json({
      success: true,
      message: 'AI服务测试成功',
      response: response.choices?.[0]?.message?.content || '无响应内容'
    });

  } catch (error) {
    console.error('❌ AI服务测试失败:', error);
    return NextResponse.json({
      success: false,
      error: 'AI服务测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}