import { NextRequest, NextResponse } from 'next/server';
import { callOpenAIWithMessages, checkAIServiceAvailability } from '@/services/aiService';
import {
  parseImagePlaceholders,
  generateImagesBatch,
  replaceImagePlaceholders,
  checkImageServiceAvailability,
  getImageServiceConfig,
  ImageGenerationSummary
} from '@/services/imageService';

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
    // 配图功能参数
    enableImages?: boolean;
    imageDensity?: 'sparse' | 'medium' | 'dense';
    imageStyle?: 'business' | 'lifestyle' | 'illustration' | 'data-viz' | 'photorealistic';
    imagePosition?: 'after-paragraph' | 'after-section' | 'mixed';
    maxImages?: number;
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

    console.log('📋 文章解析结果:', {
      hasImages: parsedArticle.hasImages,
      imageCount: parsedArticle.imageCount,
      imagePlaceholders: parsedArticle.imagePlaceholders?.length || 0,
      enableImages: parameters.enableImages
    });

    // 处理图片生成
    let imageGenerationResult: {
      processedContent: string;
      summary: ImageGenerationSummary;
    } | null = null;

    if (parameters.enableImages && parsedArticle.hasImages && parsedArticle.imagePlaceholders) {
      console.log('🖼️ 开始处理图片生成，占位符数量:', parsedArticle.imagePlaceholders.length);

      try {
        // 检查图片生成服务可用性
        const imageStatus = checkImageServiceAvailability();
        if (!imageStatus.available) {
          console.warn('⚠️ 图片生成服务不可用:', imageStatus.error);
          // 继续处理，但使用占位符
        } else {
          // 解析图片占位符
          const imageDescriptions = parseImagePlaceholders(parsedArticle.content);

          if (imageDescriptions.length > 0) {
            console.log('🎨 开始生成图片，数量:', imageDescriptions.length);

            // 批量生成图片（使用降级机制）
            const generatedImages = await generateImagesBatch(imageDescriptions);

            // 替换占位符为实际图片
            imageGenerationResult = replaceImagePlaceholders(parsedArticle.content, generatedImages);

            console.log('✅ 图片生成完成:', {
              total: imageGenerationResult.summary.total,
              successful: imageGenerationResult.summary.successful,
              fallback: imageGenerationResult.summary.fallback,
              failed: imageGenerationResult.summary.failed
            });
          }
        }
      } catch (error) {
        console.error('❌ 图片生成过程中出错:', error);
        // 继续处理，使用原始内容（包含占位符）
      }
    }

    // 如果没有图片生成，使用原始内容
    const finalContent = imageGenerationResult?.processedContent || parsedArticle.content;

    return NextResponse.json({
      success: true,
      data: {
        article: {
          ...parsedArticle,
          content: finalContent, // 使用处理后的内容（图片已替换）
          imageGenerationSummary: imageGenerationResult?.summary || null
        },
        usage: response.usage,
        metadata: {
          model: response.model,
          generatedAt: new Date().toISOString(),
          parameters: parameters,
          imageServiceConfig: parameters.enableImages ? {
            enabled: true,
            config: getImageServiceConfig(),
            availability: checkImageServiceAvailability()
          } : {
            enabled: false
          }
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
  const { style, length, platforms, enableImages } = parameters;

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

  // 图片相关配置
  const imageDensityMap = {
    sparse: '稀疏配图（1-2张），只在关键段落插入',
    medium: '适中配图（3-5张），每个主要段落都配图',
    dense: '密集配图（6-8张），几乎每个段落都配图'
  };

  const imageStyleMap = {
    photorealistic: '真实照片风格，追求真实感和细节',
    business: '商务风格，专业场景，办公室环境',
    lifestyle: '生活化场景，自然光，真实感',
    illustration: '插画风格，扁平设计，简洁现代',
    'data-viz': '信息图表风格，数据可视化，清晰明了'
  };

  const imagePositionMap = {
    'after-paragraph': '在每个主要段落后插入配图',
    'after-section': '在每个小章节后插入配图',
    'mixed': '混合布局，在段落后和章节后灵活插入配图'
  };

  // 配图要求
  let imageRequirements = '';
  if (enableImages) {
    imageRequirements = `
配图要求：
- ${imageDensityMap[parameters.imageDensity || 'medium']}
- 图片风格：${imageStyleMap[parameters.imageStyle || 'photorealistic']}
- 配图位置：${imagePositionMap[parameters.imagePosition || 'after-paragraph']}
- 最大图片数量：${parameters.maxImages || 5}张`;
  }

  return `你是一位专业的内容创作者和配图设计师。

${enableImages ? `
🚨 重要：必须在文章中插入图片占位符！
📋 要求：必须生成 ${parameters.maxImages || 5} 个图片占位符
📝 格式：严格使用 [图片：详细描述] 格式（使用中文冒号）
✅ 示例：[图片：现代化办公室场景，商务人士讨论数据分析]` : ''}

写作风格：${styleMap[style]}
文章长度：${lengthMap[length]}
目标平台：${platformFeatures.join('；') || '通用平台'}
${imageRequirements}

${enableImages ? `
🎯 配图占位符要求（必须执行）：
1. 必须在文章中插入 ${parameters.maxImages || 5} 个图片占位符
2. 严格使用格式：[图片：详细描述文字]（注意使用中文冒号：）
3. 占位符位置：${imagePositionMap[parameters.imagePosition || 'after-paragraph']}
4. 图片风格：${imageStyleMap[parameters.imageStyle || 'photorealistic']}
5. 每个占位符描述要具体、生动，包含场景、环境、色调等细节

📌 占位符插入规则：
- 在引言后插入1个占位符
- 每个主要段落后插入1-2个占位符
- 在总结前插入1个占位符
- 确保占位符与前后内容主题相关

⚠️ 检查清单：
- 是否使用了正确的格式 [图片：描述]？
- 是否生成了足够数量的占位符？
- 占位符描述是否具体详细？
- 占位符位置是否合理？` : ''}

内容要求：
1. 符合指定的风格和长度要求
2. 结构清晰，包含标题、引言、正文和总结
3. 内容原创且有价值，避免空洞和套话
4. 适当使用数据和案例支撑观点
5. 考虑目标平台的特性和用户喜好

${enableImages ? `
🔥 关键提醒：文章必须包含图片占位符！这是强制要求！
格式示例：
# 标题

引言内容...

[图片：现代化办公室环境，自然光线，专业商务风格]

## 正文段落

正文内容...

[图片：数据分析图表，简洁清晰，蓝色科技风格]

更多正文...

[图片：团队协作场景，多元化团队，现代办公环境]

## 总结

总结内容...

[图片：成功案例展示，专业摄影风格，高质量]` : ''}

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

  if (parameters?.enableImages) {
    const imageGuidance = `
🚨 图片占位符要求（必须执行）：

📋 强制要求：
- 必须在文章中插入 ${parameters.maxImages || 5} 个图片占位符
- 严格使用格式：[图片：详细描述]（使用中文冒号）
- 这不是可选项，是必须完成的任务！

📝 占位符插入计划：
1. 在引言段落后立即插入第1个占位符
2. 在第一个主要段落后插入第2个占位符
3. 在第二个主要段落后插入第3个占位符
4. 在第三个主要段落后插入第4个占位符（如果有）
5. 在总结段落后插入第5个占位符（如果需要达到最大数量）

🎨 占位符描述要求：
- 每个描述15-30个字
- 包含：场景 + 环境 + 风格 + 氛围
- 针对${parameters.imageStyle || 'photorealistic'}风格优化
- 避免具体人物肖像和品牌logo

📌 占位符格式模板：
[图片：场景描述，环境说明，风格要求，色调氛围]

✅ 具体示例：
- 商务类：[图片：现代化办公室环境，自然光线照射，专业商务风格，蓝色调]
- 技术类：[图片：简洁的技术界面，数据可视化展示，科技感设计，蓝白色调]
- 教育类：[图片：明亮的教室环境，学员专注学习，教育场景，温暖色调]

⚠️ 质量检查：
完成写作后，请检查：
1. 文章中是否有 [图片：...] 格式的占位符？
2. 占位符数量是否达到 ${parameters.maxImages || 5} 个？
3. 是否使用了中文冒号：？
4. 每个占位符描述是否足够详细？

如果以上有任何问题，请立即修正！`;

    prompt += imageGuidance;
  }

  prompt += `
请确保文章内容：
1. 紧扣主题，不偏离核心内容
2. 提供有价值的信息和观点
3. 结构清晰，易于阅读
4. 符合目标平台的传播特点
5. 具有实用性和可操作性
${parameters?.enableImages ? '6. 智能插入配图占位符，提升文章视觉效果' : ''}

现在请开始创作：`;

  return prompt;
}

function parseGeneratedContent(content: string): {
  title: string;
  content: string;
  sections: string[];
  estimatedReadingTime: number;
  hasImages: boolean;
  imageCount: number;
  imagePlaceholders?: Array<{
    id: string;
    description: string;
    position: number;
  }>;
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

  // 检查和解析图片占位符（支持多种格式）
  const imagePatterns = [
    /\[图片：([^]]+)\]/g,  // 中文冒号（主要格式）
    /\[图片: ([^]]+)\]/g,  // 英文冒号 + 空格
    /\[图片:([^]]+)\]/g,   // 英文冒号（无空格）
    /\[image: ([^]]+)\]/g, // 英文（小写） + 空格
    /\[image:([^]]+)\]/g,  // 英文（小写）（无空格）
    /\[Image: ([^]]+)\]/g, // 英文（大写） + 空格
    /\[Image:([^]]+)\]/g,  // 英文（大写）（无空格）
    /\{图片：([^}]+)\}/g,  // 花括号 + 中文冒号
    /\{图片:([^}]+)\}/g    // 花括号 + 英文冒号
  ];

  const imagePlaceholders: Array<{
    id: string;
    description: string;
    position: number;
    originalFormat: string; // 记录原始格式
  }> = [];
  let id = 0;

  // 尝试每种格式模式
  imagePatterns.forEach((pattern, patternIndex) => {
    let match;
    // 重置正则表达式的lastIndex
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      imagePlaceholders.push({
        id: `img_${Date.now()}_${id++}`,
        description: match[1].trim(),
        position: match.index,
        originalFormat: match[0] // 保存原始匹配的格式
      });
    }
  });

  // 按位置排序，确保顺序正确
  imagePlaceholders.sort((a, b) => a.position - b.position);

  // 输出调试信息
  if (imagePlaceholders.length > 0) {
    console.log('🖼️ 检测到图片占位符:', {
      总数: imagePlaceholders.length,
      格式分布: imagePlaceholders.map(p => p.originalFormat),
      详情: imagePlaceholders.map(p => ({
        位置: p.position,
        描述: p.description.substring(0, 30) + '...',
        原始格式: p.originalFormat
      }))
    });
  }

  const hasImages = imagePlaceholders.length > 0;
  const imageCount = imagePlaceholders.length;

  return {
    title,
    content,
    sections,
    estimatedReadingTime,
    hasImages,
    imageCount,
    imagePlaceholders: hasImages ? imagePlaceholders : undefined
  };
}