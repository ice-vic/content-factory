import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PublishRequest, PublishResponse } from '@/types/wechat';

// 微信API配置
const WECHAT_API_BASE_URL = process.env.WECHAT_API_BASE_URL || 'https://wx.limyai.com/api/openapi';
const WECHAT_API_KEY = process.env.WECHAT_API_KEY;

// 全局Prisma实例
let prisma: PrismaClient;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  return prisma;
}

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

// 处理图片URL，将相对路径转换为绝对路径
function processImageUrls(content: string, baseUrl?: string): string {
  // 处理相对路径图片
  return content.replace(
    /src="[^"]*\.(jpg|jpeg|png|gif|webp)"/gi,
    (match) => {
      const relativePath = match.slice(5, -1); // 去掉 src=" 和 "
      if (relativePath.startsWith('http')) {
        return match; // 已经是绝对路径
      }

      // 构建绝对路径
      const absoluteUrl = baseUrl ? `${baseUrl}/${relativePath}` : `/${relativePath}`;
      return `src="${absoluteUrl}"`;
    }
  );
}

// 提取文章中的第一张图片作为封面图
function extractCoverImage(content: string): string | undefined {
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : undefined;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 开始发布文章到公众号');

    // 检查API密钥
    if (!WECHAT_API_KEY) {
      console.error('❌ 微信API密钥未配置');
      return NextResponse.json({
        success: false,
        error: '微信API密钥未配置',
        code: 'API_KEY_MISSING'
      }, { status: 500 });
    }

    const body: PublishRequest = await request.json();

    // 验证必需参数
    if (!body.wechatAppid || !body.title || !body.content) {
      console.error('❌ 缺少必需参数:', {
        wechatAppid: !!body.wechatAppid,
        title: !!body.title,
        content: !!body.content
      });

      return NextResponse.json({
        success: false,
        error: '缺少必需参数：公众号AppID、标题或内容',
        code: 'INVALID_PARAMETER'
      }, { status: 400 });
    }

    // 验证标题长度
    if (body.title.length > 64) {
      console.error('❌ 标题过长:', body.title.length);
      return NextResponse.json({
        success: false,
        error: '标题长度不能超过64个字符',
        code: 'INVALID_PARAMETER'
      }, { status: 400 });
    }

    // 验证摘要长度
    if (body.summary && body.summary.length > 120) {
      console.error('❌ 摘要过长:', body.summary.length);
      return NextResponse.json({
        success: false,
        error: '摘要长度不能超过120个字符',
        code: 'INVALID_PARAMETER'
      }, { status: 400 });
    }

    console.log('📝 发布参数:', {
      wechatAppid: body.wechatAppid,
      title: body.title,
      contentLength: body.content.length,
      articleType: body.articleType || 'news',
      contentFormat: body.contentFormat || 'html'
    });

    // 处理图片URL
    const processedContent = processImageUrls(
      body.content,
      process.env.NEXT_PUBLIC_BASE_URL
    );

    // 如果没有指定封面图，自动提取第一张图片
    const coverImage = body.coverImage || extractCoverImage(processedContent);

    // 构建发布请求
    const publishData = {
      wechatAppid: body.wechatAppid,
      title: body.title,
      content: processedContent,
      summary: body.summary,
      coverImage: coverImage,
      author: body.author,
      contentFormat: body.contentFormat || 'html',
      articleType: body.articleType || 'news'
    };

    console.log('📡 调用微信API发布文章...');

    // 调用微信API发布文章
    const response = await fetch(`${WECHAT_API_BASE_URL}/wechat-publish`, {
      method: 'POST',
      headers: {
        'X-API-Key': WECHAT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publishData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💥 微信API调用失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });

      // 记录失败的发布记录
      try {
        const prismaClient = getPrismaClient();
        await prismaClient.publishRecord.create({
          data: {
            articleId: 0, // 需要从请求中获取，暂时使用默认值
            platform: 'wechat',
            status: 'failed',
            errorMessage: `HTTP ${response.status}: ${response.statusText}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (recordError) {
        console.error('❌ 记录发布失败记录时出错:', recordError);
      }

      return NextResponse.json({
        success: false,
        error: `微信API调用失败: ${response.status} ${response.statusText}`,
        code: 'WECHAT_API_ERROR'
      }, { status: response.status });
    }

    const result: PublishResponse = await response.json();

    console.log('✅ 微信API响应:', {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
      code: result.code
    });

    if (!result.success) {
      const errorMessage = ERROR_MESSAGES[result.code as keyof typeof ERROR_MESSAGES] || result.error || '发布文章失败';
      console.error('❌ 微信API返回错误:', result);

      // 记录失败的发布记录
      try {
        const prismaClient = getPrismaClient();
        await prismaClient.publishRecord.create({
          data: {
            articleId: 0, // 需要从请求中获取，暂时使用默认值
            platform: 'wechat',
            status: 'failed',
            errorMessage: errorMessage,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (recordError) {
        console.error('❌ 记录发布失败记录时出错:', recordError);
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: result.code
      }, { status: 400 });
    }

    // 记录成功的发布记录
    try {
      const prismaClient = getPrismaClient();
      await prismaClient.publishRecord.create({
        data: {
          articleId: 0, // 需要从请求中获取，暂时使用默认值
          platform: 'wechat',
          status: 'published',
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ 发布记录已保存到数据库');
    } catch (recordError) {
      console.error('❌ 记录发布成功记录时出错:', recordError);
      // 即使记录失败，也返回成功结果，因为发布本身是成功的
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: '文章已成功发布到公众号草稿箱'
    });

  } catch (error) {
    console.error('💥 发布文章时发生错误:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '发布文章失败',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}