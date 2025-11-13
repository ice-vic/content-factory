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

  // 匹配格式：[图片：描述文字]
  const regex = /\[图片：([^]]+)\]/g;
  let match;
  let id = 0;

  while ((match = regex.exec(content)) !== null) {
    const description = match[1].trim();
    placeholders.push({
      id: `img_${Date.now()}_${id++}`,
      description,
      style: getImageServiceConfig().defaultStyle,
      width: 1024,
      height: 1024,
      quality: getImageServiceConfig().quality
    });
  }

  return placeholders;
}

// 调用硅基流动API生成图片（带重试机制）
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

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 尝试简化提示词（重试时）
      let prompt = enhanceImagePrompt(description.description, description.style);
      if (attempt > 0) {
        prompt = simplifyImagePrompt(description.description);
      }

      const requestBody = {
        model: config.model,
        prompt: prompt
      };

      const response = await fetch(`${config.baseURL}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`硅基流动API错误: ${response.status} - ${errorData.error?.message || '未知错误'}`);
      }

      const result = await response.json();

      if (!result.images || result.images.length === 0) {
        throw new Error('API返回结果为空');
      }

      const generationTime = Date.now() - startTime;

      return {
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

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('图片生成失败');
      console.error(`图片生成失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, lastError.message);

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  // 所有重试都失败了
  throw lastError || new Error('图片生成失败');
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

// 备用图片源生成
async function generateFallbackImage(description: ImageDescription): Promise<GeneratedImage> {
  const config = getImageServiceConfig();

  if (!config.enableFallbackSources) {
    throw new Error('备用图片源未启用');
  }

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

// 从描述中提取关键词
function extractKeywords(description: string): string {
  // 简单的关键词提取逻辑
  const keywords = description
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ') // 保留中文、英文、数字和空格
    .split(/\s+/)
    .filter(word => word.length > 1)
    .slice(0, 3); // 只取前3个关键词

  return keywords.length > 0 ? keywords.join(' ') : 'business';
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

      try {
        // 首先尝试AI生成
        result = await generateImageWithSiliconFlow(desc);

        // 记录成功的AI生成
        imageMonitor.recordGenerationResult(result, Date.now() - startTime);
        return result;

      } catch (aiError) {
        error = aiError instanceof Error ? aiError : new Error('AI生成失败');
        console.warn(`AI图片生成失败 (${desc.description}):`, error);

        // 根据配置决定是否使用备用方案
        if (config.fallbackMode === 'strict') {
          imageMonitor.recordGenerationResult(null, Date.now() - startTime, error);
          throw error;
        }

        try {
          // 尝试备用图片源
          result = await generateFallbackImage(desc);
          imageMonitor.recordGenerationResult(result, Date.now() - startTime);
          return result;

        } catch (fallbackError) {
          const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error('备用图片生成失败');
          console.error(`备用图片生成也失败 (${desc.description}):`, fallbackErr);

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
    const placeholderText = `[图片：${placeholder.description}]`;

    if (image) {
      // 统计不同类型的图片生成结果
      if (image.source === 'ai') {
        summary.successful++;
      } else if (image.source === 'fallback' || image.source === 'placeholder') {
        summary.fallback++;
      }

      // 生成图片HTML，根据来源添加不同的样式和提示
      const imageHtml = generateImageHtml(image, placeholder);
      processedContent = processedContent.replace(placeholderText, imageHtml);

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
      processedContent = processedContent.replace(placeholderText, fallbackHtml);

      summary.details.push({
        description: placeholder.description,
        source: 'failed',
        fallbackReason: '图片生成失败',
        generationTime: 0
      });
    }
  });

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

  return `<div class="${imageClass}" data-image-id="${image.id}" data-source="${image.source}">
    <img src="${image.url}" alt="${image.description}"
         style="${imageStyle}"
         loading="lazy" />
    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 8px;">
      ${image.description}
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