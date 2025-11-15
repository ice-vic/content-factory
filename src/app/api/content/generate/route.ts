import { NextRequest, NextResponse } from 'next/server';
import { callOpenAIWithMessages, checkAIServiceAvailability } from '@/services/aiService';
import {
  parseImagePlaceholders,
  generateImagesBatch,
  replaceImagePlaceholders,
  checkImageServiceAvailability,
  getImageServiceConfig,
  ImageGenerationSummary,
  generateImagePromptsFromContent
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
    smartImageCount?: boolean; // 智能调整图片数量
    topicDirection?: string; // 选题方向
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
      enableImages: parameters.enableImages,
      originalMaxImages: parameters.maxImages
    });

    // 智能调整配图参数
    const adjustedParameters = await adjustImageParameters(parameters, parsedArticle.content);

    console.log('🔧 智能调整配图参数:', {
      原始最大图片数: parameters.maxImages,
      智能调整: parameters.smartImageCount,
      调整后最大图片数: adjustedParameters.maxImages,
      文章长度: parsedArticle.content.length
    });

    // 处理图片生成
    let imageGenerationResult: {
      processedContent: string;
      summary: ImageGenerationSummary;
    } | null = null;

    // 检查是否需要生成图片占位符
    const needsImageGeneration = parameters.enableImages &&
      (!parsedArticle.hasImages || parsedArticle.imagePlaceholders.length === 0);

    if (needsImageGeneration) {
      console.log('🚨 AI未生成图片占位符，启用强制生成机制');

      // 强制插入图片占位符
      const contentWithPlaceholders = insertImagePlaceholders(parsedArticle.content, adjustedParameters);

      console.log('✅ 强制插入占位符完成，新的内容长度:', contentWithPlaceholders.length);

      // 更新解析结果
      const updatedParsedArticle = parseGeneratedContent(contentWithPlaceholders);

      console.log('🔍 强制生成后的解析结果:', {
        hasImages: updatedParsedArticle.hasImages,
        imageCount: updatedParsedArticle.imageCount,
        imagePlaceholdersLength: updatedParsedArticle.imagePlaceholders?.length || 0,
        contentLength: updatedParsedArticle.content.length
      });

      if (updatedParsedArticle.hasImages && updatedParsedArticle.imagePlaceholders) {
        console.log('🖼️ 开始处理强制生成的图片，占位符数量:', updatedParsedArticle.imagePlaceholders.length);

        try {
          // 检查图片生成服务可用性
          const imageStatus = checkImageServiceAvailability();
          if (!imageStatus.available) {
            console.warn('⚠️ 图片生成服务不可用:', imageStatus.error);
          } else {
            // 根据文章内容生成智能图片提示词
            console.log('🧠 开始生成智能图片提示词...');
            const articleTheme = analyzeArticleTheme(parsedArticle.content);
            const imagePrompts = await generateImagePromptsFromContent(
              parsedArticle.content,
              articleTheme,
              adjustedParameters.imageStyle || 'photorealistic',
              adjustedParameters.maxImages || 3,
              adjustedParameters.platforms
            );

            if (imagePrompts.length > 0) {
              console.log('🎨 使用智能提示词生成图片，数量:', imagePrompts.length);

              // 将提示词转换为ImageDescription格式
              const imageDescriptions = imagePrompts.map((prompt, index) => ({
                id: `smart_img_${Date.now()}_${index}`,
                description: prompt,
                style: adjustedParameters.imageStyle || 'photorealistic',
                width: 1024,
                height: 1024,
                quality: 'standard' as const
              }));

              // 批量生成图片（优先使用硅基流动可灵模型）
              const generatedImages = await generateImagesBatch(imageDescriptions);

              // 替换占位符为实际图片
              imageGenerationResult = replaceImagePlaceholders(updatedParsedArticle.content, generatedImages);

              console.log('✅ 智能图片生成完成:', {
                total: imageGenerationResult.summary.total,
                successful: imageGenerationResult.summary.successful,
                fallback: imageGenerationResult.summary.fallback,
                failed: imageGenerationResult.summary.failed
              });

              // 使用处理后的内容
              parsedArticle.content = imageGenerationResult.processedContent;
            }
          }
        } catch (error) {
          console.error('❌ 智能图片生成过程中出错:', error);
          // 如果智能生成失败，尝试使用占位符生成
          try {
            const imageDescriptions = parseImagePlaceholders(updatedParsedArticle.content);
            if (imageDescriptions.length > 0) {
              console.log('🔄 降级使用占位符生成图片');
              const generatedImages = await generateImagesBatch(imageDescriptions);
              imageGenerationResult = replaceImagePlaceholders(updatedParsedArticle.content, generatedImages);
              parsedArticle.content = imageGenerationResult.processedContent;
            }
          } catch (fallbackError) {
            console.error('❌ 降级图片生成也失败:', fallbackError);
            parsedArticle.content = contentWithPlaceholders;
          }
        }
      } else {
        console.warn('⚠️ 强制插入占位符后，解析仍然未检测到占位符');
        // 即使解析失败，也使用包含占位符的内容
        parsedArticle.content = contentWithPlaceholders;
        console.log('📝 使用包含占位符的内容作为fallback');
      }
    } else if (parameters.enableImages && parsedArticle.hasImages && parsedArticle.imagePlaceholders) {
      console.log('🖼️ 开始处理AI生成的图片，占位符数量:', parsedArticle.imagePlaceholders.length);

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
    professional: '专业严谨，用词准确，逻辑清晰',
    casual: '轻松活泼，通俗易懂，贴近生活',
    humorous: '幽默有趣，增加可读性和趣味性'
  };

  // 长度配置
  const lengthMap = {
    short: '500字左右，重点突出，简洁明了',
    medium: '1000字左右，内容充实，有适当展开',
    long: '2000字左右，深度分析，内容丰富详实'
  };

  // 平台特性
  const platformFeatures = [];
  if (platforms.wechat) {
    platformFeatures.push('微信公众号：适合深度阅读，注重实用性');
  }
  if (platforms.xiaohongshu) {
    platformFeatures.push('小红书：注重视觉效果，语言活泼，强调用户体验');
  }

  let imageRequirements = '';
  if (enableImages) {
    imageRequirements = `
⚠️ 重要要求：必须在文章中插入图片占位符！
✅ 格式：[图片：描述文字]（使用中文冒号）
✅ 数量：${parameters.maxImages || 3}个
✅ 描述：15-30字，包含场景、环境、风格
✅ 示例：[图片：现代化办公室环境，自然光线，专业商务风格]`;
  }

  return `你是一位专业的内容创作者。

写作风格：${styleMap[style]}
文章长度：${lengthMap[length]}
目标平台：${platformFeatures.join('；') || '通用平台'}
${imageRequirements}

内容要求：
1. 结构清晰：标题、引言、正文、总结
2. 内容原创：有价值的信息和观点
3. 语言流畅：符合目标平台特点

${enableImages ? `
📋 图片占位符是强制要求，必须完成！
📌 插入位置：引言后、段落后、总结前
📌 确保每个占位符都有具体描述` : ''}

请直接返回可以发布的内容。`;
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
📋 图片占位符要求：
- 必须插入 ${parameters.maxImages || 3} 个图片占位符
- 格式：[图片：详细描述]（使用中文冒号）
- 示例：[图片：现代化办公室环境，自然光线，专业商务风格]`;

    prompt += imageGuidance;
  }

  prompt += `

请开始创作文章，确保内容专业、有价值。`;

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

  // 清理内容：移除可能的不可见字符
  const cleanContent = content.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 检查和解析图片占位符（支持多种格式）
  const fullwidthColon = String.fromCharCode(65306); // 全角中文冒号
  const imagePatterns = [
    new RegExp(`\\[图片${fullwidthColon}([^\\]]+)\\]`, 'g'),  // 中文冒号
    /\[图片:\s*([^]]+)\]/g,    // 英文冒号 + 空格
    /\[图片:([^]]+)\]/g,      // 英文冒号（无空格）
    /\[image:\s*([^]]+)\]/g,   // 英文（小写） + 空格
    /\[image:([^]]+)\]/g,     // 英文（小写）（无空格）
    /\[Image:\s*([^]]+)\]/g,   // 英文（大写） + 空格
    /\[Image:([^]]+)\]/g,     // 英文（大写）（无空格）
    new RegExp(`\\{图片${fullwidthColon}([^\\}]+)\\}`, 'g'), // 花括号 + 中文冒号
    /\{图片:\s*([^}]+)\}/g,   // 花括号 + 英文冒号 + 空格
    /\{图片:([^}]+)\}/g       // 花括号 + 英文冒号（无空格）
  ];

  // 调试：检查内容中是否包含图片占位符
  const hasImageKeywords = cleanContent.includes('[图片：') || cleanContent.includes('[图片:');
  console.log('🔍 内容调试检查:', {
    contentLength: content.length,
    cleanContentLength: cleanContent.length,
    hasImageKeywords,
    contentPreview: content.substring(0, 200) + '...'
  });

  const imagePlaceholders: Array<{
    id: string;
    description: string;
    position: number;
    originalFormat: string; // 记录原始格式
  }> = [];
  let id = 0;

  // 尝试每种格式模式
  imagePatterns.forEach((patternRegex, patternIndex) => {
    let match;
    // 重置正则表达式的lastIndex并直接使用原始模式
    patternRegex.lastIndex = 0;

    while ((match = patternRegex.exec(cleanContent)) !== null) {
      imagePlaceholders.push({
        id: `img_${Date.now()}_${id++}`,
        description: match[1].trim(),
        position: match.index,
        originalFormat: match[0] // 保存原始匹配的格式
      });
    }
  });

  // 调试：正则匹配结果
  console.log('🔍 正则匹配结果:', {
    检测到的图片数量: imagePlaceholders.length,
    匹配到的占位符: imagePlaceholders.map(p => ({
      格式: p.originalFormat,
      描述: p.description,
      位置: p.position
    }))
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

// 智能调整配图参数
async function adjustImageParameters(parameters: GenerationRequest['parameters'], content: string): Promise<GenerationRequest['parameters']> {
  const contentLength = content.length;
  let optimalMaxImages = parameters.maxImages;

  // 如果启用智能调整，根据文章长度和内容特征调整图片数量
  if (parameters.smartImageCount) {
    if (contentLength < 600) {
      // 短篇：最多2张图片
      optimalMaxImages = Math.min(parameters.maxImages, 2);
    } else if (contentLength < 1200) {
      // 中篇：最多4张图片
      optimalMaxImages = Math.min(parameters.maxImages, 4);
    } else if (contentLength < 2000) {
      // 长篇：最多6张图片
      optimalMaxImages = Math.min(parameters.maxImages, 6);
    } else {
      // 超长篇：最多8张图片
      optimalMaxImages = Math.min(parameters.maxImages, 8);
    }

    console.log(`🧠 智能调整模式：文章长度 ${contentLength} 字，建议图片数量 ${optimalMaxImages}`);
  } else {
    console.log(`📊 手动设置模式：使用用户指定的图片数量 ${optimalMaxImages}`);
  }

  // 根据平台特性进一步调整
  const platformAdjustment = getPlatformAdjustment(parameters.platforms);
  if (platformAdjustment !== 1) {
    optimalMaxImages = Math.round(optimalMaxImages * platformAdjustment);
    console.log(`🎯 平台调整：${Object.keys(parameters.platforms).filter(k => parameters.platforms[k as keyof typeof parameters.platforms]).join(', ')}，调整系数 ${platformAdjustment}`);
  }

  // 确保最少1张，最多10张
  optimalMaxImages = Math.max(1, Math.min(10, optimalMaxImages));

  return {
    ...parameters,
    maxImages: optimalMaxImages
  };
}

// 获取平台调整系数
function getPlatformAdjustment(platforms: { wechat: boolean; xiaohongshu: boolean }): number {
  if (platforms.wechat && platforms.xiaohongshu) {
    return 1.2; // 多平台发布需要更多图片
  } else if (platforms.xiaohongshu) {
    return 1.3; // 小红书更注重视觉
  } else {
    return 1.0; // 微信公众号保持正常
  }
}

// 强制插入图片占位符
function insertImagePlaceholders(content: string, parameters: GenerationRequest['parameters']): string {
  console.log('🔧 开始智能插入图片占位符');

  const maxImages = parameters.maxImages || 3;
  const imageStyle = parameters.imageStyle || 'photorealistic';

  // 分割内容为段落
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  if (paragraphs.length === 0) {
    return content;
  }

  // 创建图片描述模板
  const imageTemplates = getImageTemplates(imageStyle, maxImages);
  let insertedCount = 0;
  const result: string[] = [];

  // 分析文章主题
  const articleTheme = analyzeArticleTheme(content);
  console.log(`🎯 文章主题分析: ${articleTheme}`);

  // 遍历段落，智能插入占位符
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];

    result.push(paragraph);

    // 插入策略：在关键段落后插入占位符
    if (insertedCount < maxImages) {
      // 在第一段（引言）后插入
      if (i === 0 && paragraphs.length > 1) {
        const template = imageTemplates[insertedCount % imageTemplates.length];
        result.push(`\n\n[图片：${template}]`);
        insertedCount++;
        console.log(`📷 在引言后插入图片 ${insertedCount}: ${template}`);
      }
      // 在中间段落按间隔插入
      else if (i > 0 && i < paragraphs.length - 1 && i % Math.ceil(paragraphs.length / maxImages) === 0) {
        const template = imageTemplates[insertedCount % imageTemplates.length];
        result.push(`\n\n[图片：${template}]`);
        insertedCount++;
        console.log(`📷 在段落 ${i+1} 后插入图片 ${insertedCount}: ${template}`);
      }
      // 在最后一段前插入（如果还差图片）
      else if (i === paragraphs.length - 2 && insertedCount < maxImages - 1) {
        const template = imageTemplates[insertedCount % imageTemplates.length];
        result.push(`\n\n[图片：${template}]`);
        insertedCount++;
        console.log(`📷 在结尾前插入图片 ${insertedCount}: ${template}`);
      }
    }
  }

  console.log(`✅ 成功插入 ${insertedCount} 个图片占位符`);
  return result.join('\n\n');
}

// 分析文章主题
function analyzeArticleTheme(content: string): string {
  const lowerContent = content.toLowerCase();

  const themes = {
    '商务': ['商务', '办公', '职场', '会议', '团队', '管理', '营销'],
    '技术': ['技术', '开发', '编程', '软件', '系统', '数据', '算法'],
    '生活': ['生活', '家庭', '日常', '健康', '美食', '旅行', '娱乐'],
    '教育': ['教育', '学习', '培训', '学校', '知识', '技能', '成长'],
    '营销': ['营销', '推广', '品牌', '市场', '销售', '广告', '传播'],
    '创意': ['创意', '设计', '艺术', '灵感', '美学', '视觉', '创作']
  };

  let maxScore = 0;
  let dominantTheme = '通用';

  for (const [theme, keywords] of Object.entries(themes)) {
    const score = keywords.reduce((count, keyword) => {
      return count + (lowerContent.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      dominantTheme = theme;
    }
  }

  return dominantTheme;
}

// 获取图片描述模板
function getImageTemplates(style: string, count: number): string[] {
  const templates = {
    'photorealistic': [
      '专业摄影风格，高质量商务场景',
      '自然光线照射的现代办公环境',
      '清晰的商业概念视觉表达',
      '简洁专业的数据可视化图表',
      '现代化团队协作工作场景'
    ],
    'business': [
      '商务会议场景，专业讨论氛围',
      '现代办公室环境，整洁有序',
      '商业数据图表展示，专业清晰',
      '团队协作场景，多元化成员',
      '商务成功案例，高质量呈现'
    ],
    'lifestyle': [
      '自然光线下的生活化场景',
      '温馨舒适的生活环境氛围',
      '真实自然的生活方式展现',
      '轻松愉悦的日常活动场景',
      '温暖色调的生活化画面'
    ],
    'illustration': [
      '简洁现代的扁平设计风格',
      '色彩鲜明的插画作品展示',
      '创意概念可视化表达',
      '清晰的信息图表设计',
      '现代美学插画风格表现'
    ],
    'data-viz': [
      '简洁清晰的数据信息图表',
      '专业的可视化数据展示',
      '结构化的信息图形表达',
      '现代设计风格的数据图表',
      '色彩协调的数据可视化'
    ]
  };

  const styleTemplates = templates[style as keyof typeof templates] || templates.photorealistic;

  // 循环使用模板，确保有足够的描述
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(styleTemplates[i % styleTemplates.length]);
  }

  return result;
}