import { NextRequest, NextResponse } from 'next/server';
import { callOpenAIWithMessages, checkAIServiceAvailability } from '@/services/aiService';

interface GenerationRequest {
  topic: string;
  insight?: {
    title: string;
    coreFinding: string;
    recommendedTopics: string[];
    targetAudience: string[];
    contentStrategy: string[];
  };
  parameters: {
    style: 'professional' | 'casual' | 'humorous';
    length: 'short' | 'medium' | 'long';
    platforms: {
      wechat: boolean;
      xiaohongshu: boolean;
    };
    customInstructions?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始文章生成请求');

    // 首先检查AI服务可用性
    const aiStatus = checkAIServiceAvailability();
    if (!aiStatus.available) {
      console.error('❌ AI服务不可用:', aiStatus.error);
      return NextResponse.json(
        {
          success: false,
          error: `AI服务不可用: ${aiStatus.error || '未知错误'}`,
          fallback: generateFallbackArticle()
        },
        { status: 503 }
      );
    }

    const body: GenerationRequest = await request.json();
    const { topic, insight, parameters } = body;

    console.log('📝 文章生成参数:', { topic, hasInsight: !!insight, parameters });

    // 构建文章生成提示词
    const systemPrompt = buildSystemPrompt(parameters);
    const userPrompt = buildUserPrompt(topic, insight, parameters);

    console.log('🤖 开始调用AI生成文章');

    // 调用AI生成文章
    const response = await callOpenAIWithMessages([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('AI生成失败：返回结果为空');
    }

    const generatedContent = response.choices[0].message.content;
    console.log('✅ AI文章生成成功，内容长度:', generatedContent?.length || 0);

    // 解析生成的内容
    const parsedArticle = parseGeneratedContent(generatedContent);

    return NextResponse.json({
      success: true,
      data: {
        article: parsedArticle,
        usage: response.usage,
        metadata: {
          model: response.model,
          generatedAt: new Date().toISOString(),
          parameters: parameters
        }
      }
    });

  } catch (error) {
    console.error('❌ 文章生成失败:', error);

    // 根据错误类型提供不同的错误信息
    let errorMessage = '文章生成失败';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('API密钥无效')) {
        errorMessage = 'AI服务认证失败，请检查API密钥配置';
        statusCode = 401;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'AI服务请求超时，请稍后重试';
        statusCode = 408;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'AI服务调用频率过高，请稍后重试';
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        fallback: generateFallbackArticle()
      },
      { status: statusCode }
    );
  }
}

// 生成备用文章
function generateFallbackArticle() {
  return {
    title: 'AI文章生成暂时不可用',
    content: `# AI文章生成暂时不可用

很抱歉，AI文章生成服务暂时不可用。可能的原因：
- API服务暂时中断
- API密钥配置问题
- 网络连接问题

## 建议解决方案

1. **检查API配置**
   - 确认API密钥是否正确配置
   - 验证API服务是否正常

2. **稍后重试**
   - 过几分钟后再次尝试
   - 刷新页面重新加载

3. **联系管理员**
   - 如果问题持续存在，请联系技术支持

## 手动创作建议

您可以基于以下结构手动创作内容：
1. **标题设计** - 吸引目标受众注意
2. **引言部分** - 简要介绍主题背景
3. **正文内容** - 分段阐述核心观点
4. **总结结尾** - 总结要点并给出建议

感谢您的理解和耐心。`,
    sections: ['问题说明', '解决方案', '手动创作建议'],
    estimatedReadingTime: 2
  };
}

function buildSystemPrompt(parameters: GenerationRequest['parameters']): string {
  const { style, length, platforms } = parameters;

  // 风格配置
  const styleMap = {
    professional: '专业严谨，用词准确，逻辑清晰，适合正式场合',
    casual: '轻松活泼，通俗易懂，贴近生活，适合日常分享',
    humorous: '幽默有趣，适当运用比喻和夸张，增加可读性和趣味性'
  };

  // 长度配置
  const lengthMap = {
    short: '500字左右，重点突出，简洁明了',
    medium: '1000字左右，内容充实，有适当的展开',
    long: '2000字左右，深度分析，内容丰富详实'
  };

  // 平台特性
  const platformFeatures = [];
  if (platforms.wechat) {
    platformFeatures.push('微信公众号：适合深度阅读，注重实用性和专业性');
  }
  if (platforms.xiaohongshu) {
    platformFeatures.push('小红书：注重视觉效果，语言活泼，强调用户体验和分享');
  }

  return `你是一位专业的内容创作者，擅长根据指定要求创作高质量的文章。

写作风格：${styleMap[style]}
文章长度：${lengthMap[length]}
目标平台：${platformFeatures.join('；') || '通用平台'}

请确保生成的内容：
1. 符合指定的风格和长度要求
2. 结构清晰，包含标题、引言、正文和总结
3. 内容原创且有价值，避免空洞和套话
4. 适当使用数据和案例支撑观点
5. 考虑目标平台的特性和用户喜好

输出格式要求：
- 标题：吸引人且准确反映内容
- 正文：分段合理，逻辑清晰
- 使用markdown格式，包括适当的标题层级
- 在适当位置加入图片占位符 [图片：描述内容]

请确保返回的内容可以直接发布使用。`;
}

function buildUserPrompt(
  topic: string,
  insight?: GenerationRequest['insight'],
  parameters?: GenerationRequest['parameters']
): string {
  let prompt = `请为我创作一篇关于"${topic}"的文章。\n\n`;

  if (insight) {
    prompt += `参考洞察信息：
标题：${insight.title}
核心发现：${insight.coreFinding}
推荐选题方向：${insight.recommendedTopics.join('、')}
目标受众：${insight.targetAudience.join('、')}
内容策略：${insight.contentStrategy.join('、')}

请基于以上洞察信息，创作有针对性的内容。
`;
  }

  if (parameters?.customInstructions) {
    prompt += `\n特殊要求：${parameters.customInstructions}\n`;
  }

  prompt += `
请确保文章内容：
1. 紧扣主题，不偏离核心内容
2. 提供有价值的信息和观点
3. 结构清晰，易于阅读
4. 符合目标平台的传播特点
5. 具有实用性和可操作性

现在请开始创作：`;

  return prompt;
}

function parseGeneratedContent(content: string): {
  title: string;
  content: string;
  sections: string[];
  estimatedReadingTime: number;
} {
  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '未命名文章';

  // 计算预计阅读时间（按每分钟300字计算）
  const wordCount = content.replace(/[#*`\[\]]/g, '').length;
  const estimatedReadingTime = Math.ceil(wordCount / 300);

  // 提取章节
  const sectionMatches = content.match(/^##\s+(.+)$/gm);
  const sections = sectionMatches ? sectionMatches.map(section => section.replace(/^##\s+/, '').trim()) : [];

  return {
    title,
    content,
    sections,
    estimatedReadingTime
  };
}