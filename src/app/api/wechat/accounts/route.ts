import { NextRequest, NextResponse } from 'next/server';
import { WeChatAccountsResponse } from '@/types/wechat';

// 微信API配置
const WECHAT_API_BASE_URL = process.env.WECHAT_API_BASE_URL || 'https://wx.limyai.com/api/openapi';
const WECHAT_API_KEY = process.env.WECHAT_API_KEY;

// 错误码映射
const ERROR_MESSAGES: Record<string, string> = {
  'API_KEY_MISSING': 'API密钥未提供',
  'API_KEY_INVALID': 'API密钥无效',
  'ACCOUNT_NOT_FOUND': '公众号不存在或未授权',
  'ACCOUNT_TOKEN_EXPIRED': '公众号授权已过期',
  'INVALID_PARAMETER': '参数错误',
  'WECHAT_API_ERROR': '微信接口调用失败',
  'INTERNAL_ERROR': '服务器内部错误',
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 获取公众号列表');

    // 检查API密钥
    if (!WECHAT_API_KEY) {
      console.error('❌ 微信API密钥未配置');
      return NextResponse.json({
        success: false,
        error: '微信API密钥未配置',
        code: 'API_KEY_MISSING'
      }, { status: 500 });
    }

    console.log('📡 请求微信API获取公众号列表...');

    // 调用微信API获取公众号列表
    const response = await fetch(`${WECHAT_API_BASE_URL}/wechat-accounts`, {
      method: 'POST',
      headers: {
        'X-API-Key': WECHAT_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💥 微信API调用失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });

      return NextResponse.json({
        success: false,
        error: `微信API调用失败: ${response.status} ${response.statusText}`,
        code: 'WECHAT_API_ERROR'
      }, { status: response.status });
    }

    const result: WeChatAccountsResponse = await response.json();

    console.log('✅ 微信API响应:', {
      success: result.success,
      accountCount: result.data?.accounts?.length || 0
    });

    if (!result.success) {
      const errorMessage = ERROR_MESSAGES[result.code as keyof typeof ERROR_MESSAGES] || result.error || '获取公众号列表失败';
      console.error('❌ 微信API返回错误:', result);

      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: result.code
      }, { status: 400 });
    }

    // 验证并过滤有效的公众号
    const validAccounts = result.data?.accounts.filter(account =>
      account.status === 'active' && account.wechatAppid
    ) || [];

    console.log('✅ 过滤后的有效公众号数量:', validAccounts.length);

    return NextResponse.json({
      success: true,
      data: {
        accounts: validAccounts,
        total: validAccounts.length
      }
    });

  } catch (error) {
    console.error('💥 获取公众号列表时发生错误:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取公众号列表失败',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}