// 图片生成相关服务
// 硅基流动图片生成API集成

export interface ImageGenerationConfig {
  enabled: boolean;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxImagesPerRequest?: number;
  defaultStyle?: string;
  quality?: 'standard' | 'high';
  retryAttempts?: number;
  retryDelay?: number;
  fallbackMode?: 'strict' | 'standard' | 'loose';
  enableFallbackSources?: boolean;
}

export interface ImageDescription {
  id: string;
  description: string;
  style?: string;
  width?: number;
  height?: number;
  quality?: 'standard' | 'high';
  position?: number;  // 添加位置信息
}

export interface GeneratedImage {
  id: string;
  url: string;
  description: string;
  style: string;
  width: number;
  height: number;
  generationTime: number;
  cost?: number;
  source?: 'ai' | 'fallback' | 'placeholder' | 'manual';
  fallbackReason?: string;
}

// 获取图片生成服务配置
export function getImageServiceConfig(): ImageGenerationConfig {
  return {
    enabled: process.env.NEXT_PUBLIC_IMAGE_GENERATION_ENABLED === 'true',
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseURL: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn',
    model: process.env.SILICONFLOW_IMAGE_MODEL || 'Kwai-Kolors/Kolors',
    maxImagesPerRequest: parseInt(process.env.SILICONFLOW_MAX_IMAGES_PER_REQUEST || '5'),
    defaultStyle: process.env.SILICONFLOW_DEFAULT_STYLE || 'photorealistic',
    quality: (process.env.SILICONFLOW_IMAGE_QUALITY as 'standard' | 'high') || 'standard',
    retryAttempts: parseInt(process.env.IMAGE_GENERATION_RETRY_ATTEMPTS || '2'),
    retryDelay: parseInt(process.env.IMAGE_GENERATION_RETRY_DELAY || '2000'),
    fallbackMode: (process.env.IMAGE_GENERATION_FALLBACK_MODE as 'strict' | 'standard' | 'loose') || 'standard',
    enableFallbackSources: process.env.ENABLE_FALLBACK_IMAGE_SOURCES !== 'false'
  };
}

// 检查图片生成服务是否可用
export function checkImageServiceAvailability(): { available: boolean; error?: string } {
  const config = getImageServiceConfig();

  if (!config.enabled) {
    return { available: false, error: '图片生成服务未启用' };
  }

  if (!config.apiKey) {
    return { available: false, error: '未配置硅基流动API密钥' };
  }

  if (!config.baseURL) {
    return { available: false, error: '未配置硅基流动API地址' };
  }

  return { available: true };
}

// 解析文章中的图片占位符
export function parseImagePlaceholders(content: string): ImageDescription[] {
  const placeholders: ImageDescription[] = [];

  // 支持多种图片占位符格式，与route.ts中的parseGeneratedContent保持一致
  const fullwidthColon = String.fromCharCode(65306); // 全角中文冒号
  const patterns = [
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

  let id = 0;

  // 遍历每种格式模式进行匹配
  patterns.forEach((patternRegex) => {
    let match;
    // 重置正则表达式的lastIndex
    patternRegex.lastIndex = 0;

    while ((match = patternRegex.exec(content)) !== null) {
      const description = match[1].trim();

      // 避免重复添加相同的占位符
      const isDuplicate = placeholders.some(p =>
        p.description === description &&
        Math.abs((p.position || 0) - match.index) < 100
      );

      if (!isDuplicate) {
        placeholders.push({
          id: `img_${Date.now()}_${id++}`,
          description,
          style: getImageServiceConfig().defaultStyle,
          width: 1024,
          height: 1024,
          quality: getImageServiceConfig().quality,
          position: match.index  // 添加位置信息用于排序
        });
      }
    }
  });

  // 按位置排序，确保顺序正确
  placeholders.sort((a, b) => (a.position || 0) - (b.position || 0));

  console.log(`🔍 parseImagePlaceholders解析结果:`, {
    总数: placeholders.length,
    详情: placeholders.map(p => ({
      描述: p.description.substring(0, 30) + '...',
      位置: p.position
    }))
  });

  return placeholders;
}

// 调用硅基流动可灵模型API生成图片（带重试机制）
export async function generateImageWithSiliconFlow(
  description: ImageDescription
): Promise<GeneratedImage> {
  const config = getImageServiceConfig();

  if (!config.apiKey || !config.baseURL) {
    throw new Error('图片生成服务配置不完整');
  }

  const startTime = Date.now();
  const maxRetries = config.retryAttempts || 2;
  const retryDelay = config.retryDelay || 2000;
  let lastError: Error | null = null;

  console.log('🎨 开始调用硅基流动可灵模型生成图片:', {
    prompt: description.description,
    style: description.style,
    model: config.model
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 专门针对可灵模型优化提示词
      let prompt = optimizePromptForKolors(description.description, description.style);

      // 重试时简化提示词
      if (attempt > 0) {
        prompt = simplifyPromptForKolors(description.description);
        console.log(`🔄 重试第 ${attempt} 次，使用简化提示词:`, prompt);
      }

      const requestBody = {
        model: config.model, // Kwai-Kolors/Kolors
        prompt: prompt
      };

      console.log(`📡 发送API请求 (尝试 ${attempt + 1}):`, {
        url: `${config.baseURL}/v1/images/generations`,
        model: requestBody.model,
        promptLength: prompt.length
      });

      const response = await fetch(`${config.baseURL}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📥 API响应状态: ${response.status}`);

      if (!response.ok) {
        let errorMessage = '未知错误';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || '未知错误';
        } catch (jsonError) {
          errorMessage = await response.text();
        }
        console.error('❌ 硅基流动API错误:', {
          status: response.status,
          message: errorMessage
        });
        throw new Error(`硅基流动API错误: ${response.status} - ${errorMessage}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('❌ JSON解析失败:', jsonError);
        const responseText = await response.text();
        console.error('❌ 响应内容:', responseText);
        throw new Error(`API响应JSON解析失败: ${jsonError.message}`);
      }

      console.log('✅ API响应成功:', {
        imagesCount: result.images?.length || 0,
        timings: result.timings,
        seed: result.seed
      });

      if (!result.images || result.images.length === 0) {
        throw new Error('API返回结果为空');
      }

      const generationTime = Date.now() - startTime;

      const generatedImage: GeneratedImage = {
        id: description.id,
        url: result.images[0].url,
        description: description.description,
        style: description.style || config.defaultStyle || 'photorealistic',
        width: description.width || 1024,
        height: description.height || 1024,
        generationTime,
        cost: calculateImageCost(result.images[0].usage || null),
        source: 'ai'
      };

      console.log('🖼️ 图片生成成功:', {
        id: generatedImage.id,
        url: generatedImage.url,
        generationTime: generatedImage.generationTime,
        cost: generatedImage.cost
      });

      return generatedImage;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('图片生成失败');
      console.error(`❌ 图片生成失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, {
        error: lastError.message,
        prompt: description.description.substring(0, 100) + '...'
      });

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        console.log(`⏳ 等待 ${retryDelay * Math.pow(2, attempt)}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  // 所有重试都失败了
  console.error('💥 所有重试都失败了:', lastError?.message);
  throw lastError || new Error('图片生成失败');
}

// 针对可灵模型优化提示词
function optimizePromptForKolors(description: string, style?: string): string {
  // 可灵模型的特点：擅长中文提示词，理解能力强，适合商业和生活场景
  let optimizedPrompt = description;

  // 根据风格添加特定关键词
  const styleEnhancements = {
    photorealistic: '真实照片质感，高清细节，自然光线，专业摄影',
    business: '商务专业风格，现代办公环境，明亮清晰，商业摄影',
    lifestyle: '生活化场景，自然真实，温馨氛围，日常摄影',
    illustration: '插画风格，扁平设计，色彩协调，现代美学',
    'data-viz': '信息图表，清晰专业，数据可视化，商务风格'
  };

  const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || styleEnhancements.photorealistic;

  // 确保提示词包含必要的元素
  if (!optimizedPrompt.includes('高清') && !optimizedPrompt.includes('细节')) {
    optimizedPrompt += `，${enhancement}`;
  }

  // 可灵模型对中文提示词支持更好，确保提示词质量
  if (optimizedPrompt.length < 20) {
    optimizedPrompt += '，专业级视觉呈现，高质量图像输出';
  }

  return optimizedPrompt;
}

// 为可灵模型简化提示词（用于重试）
function simplifyPromptForKolors(description: string): string {
  // 保留核心概念，移除过于复杂的描述
  let simplified = description
    .split(/[，,。.!！?？；;：:、]/)
    .map(part => part.trim())
    .filter(part => part.length > 0 && part.length <= 15)
    .slice(0, 3)
    .join('，');

  // 如果简化后太短，添加基本要求
  if (simplified.length < 10) {
    simplified = `${description}，高质量，专业风格`;
  }

  return simplified;
}

// 增强图片提示词
function enhanceImagePrompt(description: string, style?: string): string {
  const stylePrompts: Record<string, string> = {
    photorealistic: 'photorealistic, high quality, detailed, professional photography',
    illustration: 'flat illustration, clean, modern style',
    business: 'business style, professional scene, office environment',
    lifestyle: 'lifestyle scene, natural light, realistic feel',
    'data-viz': 'infographic, clear, data visualization'
  };

  const basePrompt = description;
  const stylePrompt = style && stylePrompts[style] ? `, ${stylePrompts[style]}` : '';

  return `${basePrompt}${stylePrompt}, high quality, detailed`;
}

// 简化图片提示词（用于重试）
function simplifyImagePrompt(description: string): string {
  // 移除复杂的描述，保留核心关键词
  let simplified = description
    .replace(/[，,。.!！?？；;：:]*/g, ',') // 替换标点符号
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0 && part.length < 20) // 保留较短的部分
    .slice(0, 3) // 只保留前3个关键词
    .join(' ');

  // 如果简化后太短，使用通用描述
  if (simplified.length < 10) {
    simplified = `${description} professional style`;
  }

  return simplified;
}

// 免费图片源生成（无需API密钥）
async function generateFreeImage(description: ImageDescription): Promise<GeneratedImage | null> {
  try {
    // 优先尝试 Lorem Picsum（高质量随机图片）
    const picsumImage = await tryLoremPicsumImage(description);
    if (picsumImage) {
      return picsumImage;
    }
  } catch (error) {
    console.warn('Lorem Picsum 失败:', error);
  }

  try {
    // 尝试 DummyJSON（可靠的随机图片服务）
    const dummyJsonImage = await tryDummyJsonImage(description);
    if (dummyJsonImage) {
      return dummyJsonImage;
    }
  } catch (error) {
    console.warn('DummyJSON 失败:', error);
  }

  try {
    // 尝试 PlaceIMG（按分类图片，可能不可用）
    const placeImgImage = await tryPlaceImgImage(description);
    if (placeImgImage) {
      return placeImgImage;
    }
  } catch (error) {
    console.warn('PlaceIMG 失败:', error);
  }

  return null;
}

// 尝试 Lorem Picsum API（完全免费，无需密钥）
async function tryLoremPicsumImage(description: ImageDescription): Promise<GeneratedImage | null> {
  try {
    // 使用描述作为种子，确保相同描述获得相同图片
    const seed = extractSeedFromDescription(description.description);
    const width = description.width || 1024;
    const height = description.height || 1024;

    // Lorem Picsum 提供随机但基于种子的图片
    const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}.jpg`;

    return {
      id: description.id,
      url: imageUrl,
      description: description.description,
      style: description.style || 'photorealistic',
      width,
      height,
      generationTime: 0,
      source: 'fallback',
      fallbackReason: '使用Lorem Picsum免费图片源'
    };
  } catch (error) {
    console.error('Lorem Picsum API调用失败:', error);
    return null;
  }
}

// 尝试 DummyJSON API（可靠免费图片服务）
async function tryDummyJsonImage(description: ImageDescription): Promise<GeneratedImage | null> {
  try {
    const width = description.width || 1024;

    // DummyJSON 提供随机高质量图片
    // 格式：https://dummyjson.com/image/{width}x{height}
    const imageUrl = width >= 1000 ? `https://dummyjson.com/image/${width}` : `https://dummyjson.com/image/${width}x${width}`;

    return {
      id: description.id,
      url: imageUrl,
      description: description.description,
      style: description.style || 'photorealistic',
      width,
      height: width,
      generationTime: 0,
      source: 'fallback',
      fallbackReason: '使用DummyJSON免费图片源'
    };
  } catch (error) {
    console.error('DummyJSON API调用失败:', error);
    return null;
  }
}

// 尝试 PlaceIMG API（按分类，完全免费）
async function tryPlaceImgImage(description: ImageDescription): Promise<GeneratedImage | null> {
  try {
    const category = mapDescriptionToCategory(description.description);
    const width = description.width || 1024;
    const height = description.height || 1024;

    // PlaceIMG 提供按分类的随机图片
    const imageUrl = `https://placeimg.com/${width}/${height}/${category}`;

    return {
      id: description.id,
      url: imageUrl,
      description: description.description,
      style: description.style || 'placeholder',
      width,
      height,
      generationTime: 0,
      source: 'fallback',
      fallbackReason: '使用PlaceIMG分类图片源'
    };
  } catch (error) {
    console.error('PlaceIMG API调用失败:', error);
    return null;
  }
}

// 从描述中提取种子关键词（用于Lorem Picsum）
function extractSeedFromDescription(description: string): string {
  // 简单的中文到拼音映射（常用词）
  const pinyinMap: Record<string, string> = {
    '商务': 'business',
    '办公': 'office',
    '技术': 'tech',
    '电脑': 'computer',
    '生活': 'life',
    '家庭': 'home',
    '教育': 'education',
    '学习': 'study',
    '美食': 'food',
    '旅行': 'travel',
    '自然': 'nature',
    '风景': 'nature',
    '人物': 'people',
    '团队': 'team',
    '会议': 'meeting',
    '工作': 'work',
    '城市': 'city',
    '建筑': 'building',
    '现代化': 'modern',
    '办公室': 'office',
    '环境': 'environment',
    '专业': 'professional',
    '风格': 'style',
    '自然光线': 'naturallight',
    '协作': 'collaboration',
    '多元化': 'diverse',
    '讨论': 'discussion',
    '数据': 'data',
    '分析': 'analysis',
    '图表': 'chart',
    '简洁': 'simple',
    '清晰': 'clear',
    '蓝色': 'blue',
    '科技': 'technology',
    '案例': 'case',
    '展示': 'show',
    '摄影': 'photography',
    '高质量': 'highquality'
  };

  // 将描述按标点符号分割成词组
  const words = description
    .replace(/[，,。.!！?？；;：:、]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);

  // 映射每个词组到英文
  const mappedWords = words.map(word => {
    // 直接映射完整词组
    if (pinyinMap[word]) {
      return pinyinMap[word];
    }

    // 尝试映射单个字符
    const chars = word.split('');
    const mappedChars = chars.map(char => pinyinMap[char] || char);

    // 如果有映射的字符，使用映射结果
    const hasMapping = chars.some(char => pinyinMap[char]);
    if (hasMapping) {
      return mappedChars.join('');
    }

    // 如果没有映射，直接使用小写
    return word.toLowerCase();
  });

  // 过滤掉空的映射结果
  const validWords = mappedWords.filter(word => word.length > 0);

  if (validWords.length > 0) {
    // 返回前两个有效词的组合
    return validWords.slice(0, 2).join('');
  }

  // 如果没有提取到关键词，使用默认种子
  return 'default';
}

// 将描述映射到PlaceIMG分类
function mapDescriptionToCategory(description: string): string {
  const categoryMap: Record<string, string> = {
    '商务': 'tech',
    '办公': 'tech',
    '会议': 'people',
    '团队': 'people',
    '人物': 'people',
    '技术': 'tech',
    '电脑': 'tech',
    '软件': 'tech',
    '自然': 'nature',
    '风景': 'nature',
    '户外': 'nature',
    '建筑': 'arch',
    '房屋': 'arch',
    '城市': 'arch',
    '动物': 'animals',
    '宠物': 'animals'
  };

  // 查找描述中包含的分类关键词
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (description.includes(keyword)) {
      return category;
    }
  }

  // 默认使用tech分类
  return 'tech';
}

// 备用图片源生成（保持原有逻辑不变）
async function generateFallbackImage(description: ImageDescription): Promise<GeneratedImage> {
  const config = getImageServiceConfig();

  if (!config.enableFallbackSources) {
    throw new Error('备用图片源未启用');
  }

  // 首先尝试免费图片源（新增）
  try {
    const freeImage = await generateFreeImage(description);
    if (freeImage) {
      return freeImage;
    }
  } catch (error) {
    console.warn('免费图片源失败:', error);
  }

  // 保持原有的降级逻辑
  try {
    // 尝试 Unsplash API
    const unsplashImage = await tryUnsplashImage(description);
    if (unsplashImage) {
      return unsplashImage;
    }
  } catch (error) {
    console.warn('Unsplash API 失败:', error);
  }

  try {
    // 尝试 Pexels API
    const pexelsImage = await tryPexelsImage(description);
    if (pexelsImage) {
      return pexelsImage;
    }
  } catch (error) {
    console.warn('Pexels API 失败:', error);
  }

  // 最后使用占位符图片
  return generatePlaceholderImage(description);
}

// 尝试 Unsplash API
async function tryUnsplashImage(description: ImageDescription): Promise<GeneratedImage | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return null;
  }

  try {
    const keywords = extractKeywords(description.description);
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API错误: ${response.status}`);
    }

    const result = await response.json();
    if (result.results && result.results.length > 0) {
      const photo = result.results[0];
      return {
        id: description.id,
        url: photo.urls.regular,
        description: description.description,
        style: description.style || 'photorealistic',
        width: photo.width,
        height: photo.height,
        generationTime: 0,
        source: 'fallback',
        fallbackReason: 'AI生成失败，使用Unsplash备用图片'
      };
    }
  } catch (error) {
    console.error('Unsplash API调用失败:', error);
  }

  return null;
}

// 尝试 Pexels API
async function tryPexelsImage(description: ImageDescription): Promise<GeneratedImage | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const keywords = extractKeywords(description.description);
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API错误: ${response.status}`);
    }

    const result = await response.json();
    if (result.photos && result.photos.length > 0) {
      const photo = result.photos[0];
      return {
        id: description.id,
        url: photo.src.large,
        description: description.description,
        style: description.style || 'photorealistic',
        width: photo.width,
        height: photo.height,
        generationTime: 0,
        source: 'fallback',
        fallbackReason: 'AI生成失败，使用Pexels备用图片'
      };
    }
  } catch (error) {
    console.error('Pexels API调用失败:', error);
  }

  return null;
}

// 生成占位符图片
function generatePlaceholderImage(description: ImageDescription): GeneratedImage {
  const width = description.width || 1024;
  const height = description.height || 1024;

  // 创建SVG占位符
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="#666">
        📷 ${description.description}
      </text>
    </svg>
  `;

  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return {
    id: description.id,
    url: svgUrl,
    description: description.description,
    style: description.style || 'placeholder',
    width,
    height,
    generationTime: 0,
    source: 'placeholder',
    fallbackReason: 'AI生成失败，使用占位符图片'
  };
}


// 计算图片生成成本（可选，根据实际定价调整）
function calculateImageCost(usage: any): number {
  // 根据硅基流动的定价计算成本
  // 这里需要根据实际的API定价来调整
  return 0; // 暂时返回0，后续可根据实际定价设置
}

// 图片生成监控和统计
export class ImageGenerationMonitor {
  private static instance: ImageGenerationMonitor;
  private stats: {
    totalAttempts: number;
    successfulGenerations: number;
    fallbackUsages: number;
    failures: number;
    averageGenerationTime: number;
    lastFailureTime?: number;
    serviceHealthStatus: 'healthy' | 'degraded' | 'down';
  };

  private constructor() {
    this.stats = {
      totalAttempts: 0,
      successfulGenerations: 0,
      fallbackUsages: 0,
      failures: 0,
      averageGenerationTime: 0,
      serviceHealthStatus: 'healthy'
    };
  }

  static getInstance(): ImageGenerationMonitor {
    if (!ImageGenerationMonitor.instance) {
      ImageGenerationMonitor.instance = new ImageGenerationMonitor();
    }
    return ImageGenerationMonitor.instance;
  }

  // 记录生成结果
  recordGenerationResult(result: GeneratedImage | null, generationTime: number, error?: Error): void {
    this.stats.totalAttempts++;

    if (result && result.source === 'ai') {
      this.stats.successfulGenerations++;
      this.updateAverageGenerationTime(generationTime);
    } else if (result && (result.source === 'fallback' || result.source === 'placeholder')) {
      this.stats.fallbackUsages++;
    } else {
      this.stats.failures++;
      this.stats.lastFailureTime = Date.now();
    }

    this.updateServiceHealthStatus();
  }

  // 更新平均生成时间
  private updateAverageGenerationTime(newTime: number): void {
    const successful = this.stats.successfulGenerations;
    this.stats.averageGenerationTime =
      (this.stats.averageGenerationTime * (successful - 1) + newTime) / successful;
  }

  // 更新服务健康状态
  private updateServiceHealthStatus(): void {
    const successRate = this.getSuccessRate();
    const fallbackRate = this.getFallbackRate();

    if (successRate >= 0.8) {
      this.stats.serviceHealthStatus = 'healthy';
    } else if (successRate >= 0.5 || fallbackRate <= 0.3) {
      this.stats.serviceHealthStatus = 'degraded';
    } else {
      this.stats.serviceHealthStatus = 'down';
    }
  }

  // 获取成功率
  getSuccessRate(): number {
    return this.stats.totalAttempts > 0
      ? this.stats.successfulGenerations / this.stats.totalAttempts
      : 0;
  }

  // 获取备用方案使用率
  getFallbackRate(): number {
    return this.stats.totalAttempts > 0
      ? this.stats.fallbackUsages / this.stats.totalAttempts
      : 0;
  }

  // 获取统计信息
  getStats() {
    return { ...this.stats };
  }

  // 检查服务是否应该暂时禁用AI生成
  shouldTemporarilyDisableAIGeneration(): boolean {
    // 如果最近失败率很高，建议暂时使用备用方案
    const recentFailures = this.stats.failures;
    const totalRecent = this.stats.totalAttempts;

    if (totalRecent < 5) return false; // 样本太少

    const failureRate = recentFailures / totalRecent;
    return failureRate > 0.7; // 失败率超过70%时建议禁用
  }

  // 重置统计信息
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulGenerations: 0,
      fallbackUsages: 0,
      failures: 0,
      averageGenerationTime: 0,
      serviceHealthStatus: 'healthy'
    };
  }
}

// 导出监控实例
export const imageMonitor = ImageGenerationMonitor.getInstance();

// 根据文章内容生成智能图片提示词
export async function generateImagePromptsFromContent(
  content: string,
  articleTheme: string,
  imageStyle: string,
  maxImages: number,
  targetPlatforms: { wechat: boolean; xiaohongshu: boolean }
): Promise<string[]> {
  console.log('🎨 开始生成智能图片提示词:', {
    文章主题: articleTheme,
    图片风格: imageStyle,
    数量: maxImages,
    平台: targetPlatforms
  });

  try {
    // 分割文章为段落
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);

    // 提取关键信息和主题
    const contentAnalysis = analyzeContentForImages(content, articleTheme);

    // 生成提示词
    const prompts = await generateContextualPrompts(
      contentAnalysis,
      imageStyle,
      maxImages,
      targetPlatforms
    );

    console.log('✅ 智能提示词生成完成:', {
      生成的提示词数量: prompts.length,
      提示词: prompts
    });

    return prompts;
  } catch (error) {
    console.error('❌ 智能提示词生成失败:', error);
    // 降级到通用提示词
    return generateFallbackPrompts(articleTheme, imageStyle, maxImages);
  }
}

// 分析文章内容用于图片生成
function analyzeContentForImages(content: string, articleTheme: string): {
  keywords: string[];
  concepts: string[];
  emotions: string[];
  scenarios: string[];
  platform: string;
  targetAudience: string;
} {
  // 关键词提取
  const keywords = extractKeywords(content);

  // 概念提取
  const concepts = extractConcepts(content, articleTheme);

  // 情感倾向分析
  const emotions = extractEmotions(content);

  // 场景识别
  const scenarios = extractScenarios(content);

  // 平台特性
  const platform = detectPlatformStyle(content);

  // 目标受众
  const targetAudience = detectTargetAudience(content);

  return {
    keywords,
    concepts,
    emotions,
    scenarios,
    platform,
    targetAudience
  };
}

// 提取关键词
function extractKeywords(content: string): string[] {
  // 移除Markdown标记和标点符号
  const cleanText = content
    .replace(/[#*`\[\]()]/g, ' ')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .toLowerCase();

  // 分词并过滤
  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length > 1)
    .filter(word => !isStopWord(word));

  // 统计词频并返回高频词
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

// 提取概念
function extractConcepts(content: string, theme: string): string[] {
  const conceptMap = {
    '商务': ['团队合作', '商务会议', '办公室环境', '专业服务', '商业策略', '市场营销', '客户关系'],
    '技术': ['软件开发', '人工智能', '数据分析', '云计算', '网络安全', '数字化', '创新技术'],
    '生活': ['日常生活', '家庭场景', '健康生活', '休闲娱乐', '社交互动', '消费体验', '品质生活'],
    '教育': ['学习环境', '知识传授', '技能培训', '教育技术', '成长发展', '教学方法', '学习资源'],
    '营销': ['品牌推广', '用户互动', '市场策略', '广告创意', '客户体验', '销售转化', '营销活动'],
    '创意': ['设计创作', '艺术表达', '视觉创意', '创新思维', '美学设计', '灵感来源', '创意产品']
  };

  const concepts = [];
  const themeConcepts = conceptMap[theme] || conceptMap['商务'];

  // 检查内容中出现的概念
  themeConcepts.forEach(concept => {
    if (content.includes(concept)) {
      concepts.push(concept);
    }
  });

  // 如果没有找到具体概念，返回主题相关的通用概念
  return concepts.length > 0 ? concepts : themeConcepts.slice(0, 3);
}

// 提取情感倾向
function extractEmotions(content: string): string[] {
  const emotionMap = {
    '积极': ['成功', '优秀', '精彩', '完美', '卓越', '出色', '惊喜', '快乐', '满足', '兴奋'],
    '专业': '专业严谨稳重可靠权威标准规范',
    '温暖': ['温馨', '关怀', '舒适', '亲切', '温暖', '贴心', '友善', '和谐', '包容'],
    '创新': ['创新', '前沿', '先进', '独特', '新颖', '革命性', '突破', '领先', '原创'],
    '实用': ['实用', '有效', '高效', '便捷', '简单', '快速', '经济', '节省', '优化']
  };

  const detectedEmotions = [];

  Object.entries(emotionMap).forEach(([emotion, keywords]) => {
    const keywordList = Array.isArray(keywords) ? keywords : [keywords];
    const foundKeywords = keywordList.filter(keyword => content.includes(keyword));

    if (foundKeywords.length > 0) {
      detectedEmotions.push(emotion);
    }
  });

  return detectedEmotions.length > 0 ? detectedEmotions : ['积极'];
}

// 提取场景
function extractScenarios(content: string): string[] {
  const scenarioPatterns = [
    /办公室|工作|会议|团队/g,
    /家庭|居家|生活|日常/g,
    /户外|自然|风景|环境/g,
    /技术|电脑|网络|数字/g,
    /社交|互动|交流|沟通/g,
    /创意|设计|艺术|创作/g
  ];

  const scenarios = [];
  scenarioPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      scenarios.push(matches[0]);
    }
  });

  return scenarios.length > 0 ? scenarios : ['商务场景'];
}

// 检测平台风格
function detectPlatformStyle(content: string): string {
  if (content.includes('小红书') || content.length < 1000) {
    return 'xiaohongshu';
  }
  return 'wechat';
}

// 检测目标受众
function detectTargetAudience(content: string): string {
  const audienceMap = {
    '职场人士': ['职场', '工作', '职业', '商务', '企业', '管理'],
    '创业者': ['创业', '创新', '商业', '投资', '市场', '产品'],
    '普通用户': ['生活', '日常', '消费', '体验', '使用', '购买'],
    '学生': ['学习', '教育', '学校', '课程', '知识', '技能'],
    '技术人员': ['技术', '开发', '编程', '软件', '系统', '数据']
  };

  let maxScore = 0;
  let targetAudience = '普通用户';

  Object.entries(audienceMap).forEach(([audience, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (content.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      targetAudience = audience;
    }
  });

  return targetAudience;
}

// 生成上下文相关的提示词
async function generateContextualPrompts(
  analysis: any,
  imageStyle: string,
  maxImages: number,
  targetPlatforms: { wechat: boolean; xiaohongshu: boolean }
): Promise<string[]> {
  const stylePrompts = {
    photorealistic: '真实照片风格，高清细节，自然光线',
    business: '专业商务风格，现代办公环境，简洁明亮',
    lifestyle: '生活化场景，温馨自然，真实感强',
    illustration: '扁平插画风格，简洁现代，色彩协调',
    'data-viz': '信息图表风格，清晰专业，数据可视化'
  };

  const baseStyle = stylePrompts[imageStyle] || stylePrompts.photorealistic;

  const prompts = [];
  const { keywords, concepts, emotions, scenarios, platform, targetAudience } = analysis;

  // 为每个图片生成独特的提示词
  for (let i = 0; i < maxImages; i++) {
    // 选择不同的关键词和概念组合
    const selectedKeywords = keywords.slice(i * 2, (i + 1) * 2 + 1);
    const selectedConcept = concepts[i % concepts.length];
    const selectedEmotion = emotions[i % emotions.length];
    const selectedScenario = scenarios[i % scenarios.length];

    // 构建提示词
    let prompt = `${selectedScenario}，${selectedConcept}，${selectedEmotion}氛围`;

    // 添加目标受众特征
    if (targetAudience !== '普通用户') {
      prompt += `，适合${targetAudience}`;
    }

    // 添加风格描述
    prompt += `，${baseStyle}`;

    // 针对不同平台调整
    if (targetPlatforms.xiaohongshu) {
      prompt += '，小红书风格，活泼明亮，吸引力强';
    } else if (targetPlatforms.wechat) {
      prompt += '，微信公众号风格，专业稳重，品质感强';
    }

    // 添加技术细节
    prompt += '，高质量，细节丰富，专业摄影';

    prompts.push(prompt);
  }

  return prompts;
}

// 生成备用提示词
function generateFallbackPrompts(theme: string, imageStyle: string, maxImages: number): string[] {
  const fallbackTemplates = {
    photorealistic: [
      '专业商务场景，现代办公环境，自然光线，高质量摄影',
      '团队协作画面，多元化团队成员，专业讨论氛围',
      '现代化工作空间，整洁有序，商务专业风格',
      '商业概念表达，清晰简洁，专业视觉效果',
      '成功案例展示，高质量呈现，商务风格'
    ],
    business: [
      '商务会议场景，专业讨论氛围，现代办公室',
      '团队协作场景，多元化成员，专业环境',
      '商业数据展示，清晰专业，商务风格',
      '办公环境，整洁现代，专业氛围',
      '商业成功案例，高质量呈现'
    ],
    lifestyle: [
      '自然光线下的生活化场景，温馨舒适',
      '真实自然的生活方式，轻松愉悦氛围',
      '温暖色调的生活化画面，真实感强',
      '日常活动场景，自然生动，生活气息',
      '舒适环境氛围，温馨自然，生活化'
    ],
    illustration: [
      '简洁现代的扁平设计风格，色彩鲜明',
      '创意概念可视化表达，清晰信息图表',
      '现代美学插画风格，色彩协调设计',
      '清晰的信息图表设计，现代风格表现',
      '创意视觉表达，简洁现代插画'
    ],
    'data-viz': [
      '简洁清晰的数据信息图表，专业展示',
      '专业的可视化数据展示，结构化表达',
      '现代设计风格的数据图表，色彩协调',
      '结构化的信息图形表达，清晰明了',
      '色彩协调的数据可视化，专业设计'
    ]
  };

  const templates = fallbackTemplates[imageStyle] || fallbackTemplates.photorealistic;
  const prompts = [];

  for (let i = 0; i < maxImages; i++) {
    prompts.push(templates[i % templates.length]);
  }

  return prompts;
}

// 停用词判断
function isStopWord(word: string): boolean {
  const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
  return stopWords.includes(word) || word.length < 2;
}

// 导出免费图片源相关函数（用于测试）
export { generateFreeImage, tryLoremPicsumImage, tryDummyJsonImage, tryPlaceImgImage };

// 批量生成图片（带降级机制）
export async function generateImagesBatch(
  descriptions: ImageDescription[],
  maxConcurrent: number = 3
): Promise<GeneratedImage[]> {
  const config = getImageServiceConfig();

  if (descriptions.length > (config.maxImagesPerRequest || 5)) {
    descriptions = descriptions.slice(0, config.maxImagesPerRequest);
  }

  const results: GeneratedImage[] = [];
  const failedDescriptions: ImageDescription[] = [];

  // 分批处理，避免并发过高
  for (let i = 0; i < descriptions.length; i += maxConcurrent) {
    const batch = descriptions.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (desc) => {
      const startTime = Date.now();
      let result: GeneratedImage | null = null;
      let error: Error | undefined;

      // 首先检查AI服务是否可用
      const aiServiceAvailable = checkImageServiceAvailability().available;

      if (aiServiceAvailable) {
        try {
          // 首先尝试AI生成
          result = await generateImageWithSiliconFlow(desc);

          // 记录成功的AI生成
          imageMonitor.recordGenerationResult(result, Date.now() - startTime);
          return result;

        } catch (aiError) {
          error = aiError instanceof Error ? aiError : new Error('AI生成失败');
          console.warn(`AI图片生成失败，切换到免费图片源 (${desc.description}):`, error);

          // AI生成失败，使用免费图片源
          try {
            result = await generateFreeImage(desc);
            if (result) {
              imageMonitor.recordGenerationResult(result, Date.now() - startTime);
              return result;
            }
          } catch (freeError) {
            console.warn(`免费图片源失败，尝试传统备用方案 (${desc.description}):`, freeError);
          }

          // 继续使用原有的备用方案
          try {
            result = await generateFallbackImage(desc);
            imageMonitor.recordGenerationResult(result, Date.now() - startTime);
            return result;
          } catch (fallbackError) {
            const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error('备用图片生成失败');
            console.error(`所有图片源都失败 (${desc.description}):`, fallbackErr);

            // 强制生成占位符，确保始终有结果
            result = generatePlaceholderImage({
              ...desc,
              description: `[图片：${desc.description}]`
            });
            imageMonitor.recordGenerationResult(result, Date.now() - startTime, fallbackErr);
            return result;
          }
        }
      } else {
        // AI服务不可用，直接使用免费图片源
        console.log(`AI服务不可用，直接使用免费图片源 (${desc.description})`);

        try {
          result = await generateFreeImage(desc);
          if (result) {
            imageMonitor.recordGenerationResult(result, Date.now() - startTime);
            return result;
          }
        } catch (freeError) {
          console.warn(`免费图片源失败，尝试传统备用方案 (${desc.description}):`, freeError);
        }

        // 免费图片源失败，使用原有的备用方案
        try {
          result = await generateFallbackImage(desc);
          imageMonitor.recordGenerationResult(result, Date.now() - startTime);
          return result;
        } catch (fallbackError) {
          const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error('备用图片生成失败');
          console.error(`所有图片源都失败 (${desc.description}):`, fallbackErr);

          if (config.fallbackMode === 'standard') {
            imageMonitor.recordGenerationResult(null, Date.now() - startTime, fallbackErr);
            failedDescriptions.push(desc);
            return null;
          }

          // loose模式：保留占位符
          result = generatePlaceholderImage({
            ...desc,
            description: `[图片：${desc.description}]`
          });
          imageMonitor.recordGenerationResult(result, Date.now() - startTime);
          return result;
        }
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // 分离成功和失败的结果
    batchResults.forEach(result => {
      if (result) {
        results.push(result);
      }
    });

    // 批次间短暂延迟，避免API限流
    if (i + maxConcurrent < descriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 记录失败统计
  if (failedDescriptions.length > 0) {
    console.warn(`共有 ${failedDescriptions.length} 张图片生成失败:`,
      failedDescriptions.map(d => d.description));
  }

  return results;
}

// 将文章中的图片占位符替换为实际图片
export function replaceImagePlaceholders(
  content: string,
  generatedImages: GeneratedImage[]
): { processedContent: string; summary: ImageGenerationSummary } {
  let processedContent = content;

  // 检查内容是否已经被处理过（防止重复替换）
  const hasProcessedImages = processedContent.includes('class="generated-image"');
  if (hasProcessedImages) {
    console.log('⚠️ 内容已经被处理过，跳过重复替换');
    const placeholders = parseImagePlaceholders(content);
    return {
      processedContent,
      summary: {
        total: placeholders.length,
        successful: 0,
        fallback: 0,
        failed: 0,
        details: []
      }
    };
  }

  const placeholders = parseImagePlaceholders(content);
  const summary: ImageGenerationSummary = {
    total: placeholders.length,
    successful: 0,
    fallback: 0,
    failed: 0,
    details: []
  };

  placeholders.forEach((placeholder, index) => {
    const image = generatedImages[index];

    if (image) {
      // 统计不同类型的图片生成结果
      if (image.source === 'ai') {
        summary.successful++;
      } else if (image.source === 'fallback' || image.source === 'placeholder') {
        summary.fallback++;
      }

      // 生成图片HTML，根据来源添加不同的样式和提示
      const imageHtml = generateImageHtml(image, placeholder);

      // 尝试多种占位符格式的替换
      const fullwidthColon = String.fromCharCode(65306); // 全角中文冒号
      const replacementPatterns = [
        `[图片${fullwidthColon}${placeholder.description}]`,
        `[图片:${placeholder.description}]`,
        `[图片: ${placeholder.description}]`,
        `[image:${placeholder.description}]`,
        `[image: ${placeholder.description}]`,
        `[Image:${placeholder.description}]`,
        `[Image: ${placeholder.description}]`,
        `{图片${fullwidthColon}${placeholder.description}}`,
        `{图片:${placeholder.description}}`,
        `{图片: ${placeholder.description}}`
      ];

      let replaced = false;
      for (const pattern of replacementPatterns) {
        if (processedContent.includes(pattern)) {
          // 使用replace而不是replaceAll，确保每个占位符只被替换一次
          // 在替换前先检查是否已经被处理过（避免重复嵌套）
          if (!processedContent.includes('data-image-id="' + image.id + '"')) {
            processedContent = processedContent.replace(pattern, imageHtml);
            replaced = true;
            break;
          } else {
            console.log(`⚠️ 图片 ${image.id} 已经被替换过，跳过`);
            replaced = true;
            break;
          }
        }
      }

      if (!replaced) {
        console.warn(`⚠️ 无法找到匹配的占位符: ${placeholder.description}`);
        summary.failed++;
      }

      // 记录详细信息
      summary.details.push({
        description: placeholder.description,
        source: image.source || 'unknown',
        fallbackReason: image.fallbackReason,
        generationTime: image.generationTime
      });
    } else {
      // 处理完全失败的情况
      summary.failed++;
      const fallbackHtml = generateFailedImageHtml(placeholder);

      // 同样尝试多种格式的替换
      const fullwidthColon = String.fromCharCode(65306); // 全角中文冒号
      const replacementPatterns = [
        `[图片${fullwidthColon}${placeholder.description}]`,
        `[图片:${placeholder.description}]`,
        `[图片: ${placeholder.description}]`,
        `[image:${placeholder.description}]`,
        `[image: ${placeholder.description}]`,
        `[Image:${placeholder.description}]`,
        `[Image: ${placeholder.description}]`,
        `{图片${fullwidthColon}${placeholder.description}}`,
        `{图片:${placeholder.description}}`,
        `{图片: ${placeholder.description}}`
      ];

      for (const pattern of replacementPatterns) {
        if (processedContent.includes(pattern)) {
          // 检查是否已经被处理过，避免重复替换
          if (!processedContent.includes('class="failed-image"')) {
            processedContent = processedContent.replace(pattern, fallbackHtml);
            break;
          }
        }
      }

      summary.details.push({
        description: placeholder.description,
        source: 'failed',
        fallbackReason: '图片生成失败',
        generationTime: 0
      });
    }
  });

  console.log(`✅ 图片替换完成:`, {
    总数: summary.total,
    成功: summary.successful,
    备用: summary.fallback,
    失败: summary.failed
  });

  // 调试：输出处理后内容的前1000个字符
  console.log('🔍 处理后的内容预览:', processedContent.substring(0, 1000));

  return { processedContent, summary };
}

// 图片生成结果摘要
export interface ImageGenerationSummary {
  total: number;
  successful: number;
  fallback: number;
  failed: number;
  details: Array<{
    description: string;
    source: string;
    fallbackReason?: string;
    generationTime: number;
  }>;
}

// 生成图片HTML
function generateImageHtml(image: GeneratedImage, placeholder: ImageDescription): string {
  let imageClass = 'generated-image';
  let imageStyle = 'width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin: 20px 0;';
  let additionalInfo = '';

  // 根据图片来源调整样式和提示
  switch (image.source) {
    case 'ai':
      imageClass += ' ai-generated';
      break;
    case 'fallback':
      imageClass += ' fallback-image';
      imageStyle += ' border: 2px dashed #ffa500;';
      additionalInfo = `<p style="text-align: center; color: #ffa500; font-size: 12px; margin-top: 4px;">
        📸 使用备用图片源 (${image.fallbackReason})
      </p>`;
      break;
    case 'placeholder':
      imageClass += ' placeholder-image';
      imageStyle += ' border: 2px solid #ccc;';
      additionalInfo = `<p style="text-align: center; color: #666; font-size: 12px; margin-top: 4px;">
        📝 占位符图片 (${image.fallbackReason})
      </p>`;
      break;
  }

  // 确保所有引号都是标准ASCII引号，避免中文引号混用
  // 注意：在HTML属性中，我们只需要避免破坏HTML结构的特殊字符
  const cleanDescription = (image.description || '')
    .replace(/[""]/g, '"')  // 替换中文引号为标准ASCII引号
    .replace(/"/g, '"')     // 确保是标准ASCII引号
    .replace(/</g, '&lt;')  // 只转义可能破坏HTML结构的字符
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;'); // 转义&符号

  const cleanUrl = image.url
    .replace(/[""]/g, '"')  // 替换中文引号
    .replace(/"/g, '"');    // 确保是标准ASCII引号

  const cleanImageStyle = imageStyle.replace(/[""]/g, '"');

  return `<div class="${imageClass}" data-image-id="${image.id}" data-source="${image.source}">
    <img src="${cleanUrl}" alt="${cleanDescription}"
         style="${cleanImageStyle}"
         loading="lazy" />
    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 8px;">
      ${cleanDescription}
    </p>
    ${additionalInfo}
  </div>`;
}

// 生成失败图片的HTML
function generateFailedImageHtml(placeholder: ImageDescription): string {
  return `<div class="failed-image" data-description="${placeholder.description}">
    <div style="width: 100%; max-width: 600px; height: 200px; border: 2px dashed #ff4444; border-radius: 8px; margin: 20px 0; display: flex; align-items: center; justify-content: center; background-color: #fff5f5;">
      <div style="text-align: center; color: #ff4444;">
        <div style="font-size: 48px; margin-bottom: 8px;">❌</div>
        <div style="font-size: 16px; font-weight: bold;">图片生成失败</div>
        <div style="font-size: 14px; margin-top: 4px;">${placeholder.description}</div>
        <div style="font-size: 12px; margin-top: 8px; color: #888;">请稍后重试或手动上传图片</div>
      </div>
    </div>
    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 8px;">
      [图片：${placeholder.description}]
    </p>
  </div>`;
}