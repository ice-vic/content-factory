// 单张图片重新生成API端点
// 硅基流动图片生成API集成

import { NextRequest, NextResponse } from 'next/server';
import { getImageServiceConfig, generateImageWithSiliconFlow } from '@/services/imageService';

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 开始处理单张图片重新生成请求...');

    const body = await request.json();
    const { imageId, description, style } = body;

    // 验证请求参数
    if (!imageId || !description) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：imageId 和 description'
      }, { status: 400 });
    }

    console.log('📸 图片重新生成参数:', {
      imageId,
      description,
      style,
      descriptionLength: description?.length || 0
    });

    // 检查图片生成服务配置
    const config = getImageServiceConfig();
    if (!config.enabled) {
      return NextResponse.json({
        success: false,
        error: '图片生成服务未启用'
      }, { status: 503 });
    }

    if (!config.apiKey) {
      return NextResponse.json({
        success: false,
        error: '未配置图片生成API密钥'
      }, { status: 500 });
    }

    // 构建图片描述对象
    const imageDescription = {
      id: imageId,
      description: description,
      style: style || config.defaultStyle || 'photorealistic',
      width: 1024,
      height: 1024,
      quality: config.quality
    };

    console.log('🔄 开始重新生成图片:', {
      imageId: imageDescription.id,
      prompt: imageDescription.description,
      style: imageDescription.style
    });

    const startTime = Date.now();

    try {
      // 调用图片生成API
      const newImage = await generateImageWithSiliconFlow(imageDescription);
      const generationTime = Date.now() - startTime;

      console.log('✅ 图片重新生成成功:', {
        imageId: newImage.id,
        url: newImage.url,
        generationTime,
        source: newImage.source
      });

      // 生成新的HTML
      const newImageHtml = generateImageHtml(newImage, imageDescription);

      console.log('🔍 新生成的图片HTML:', {
        htmlLength: newImageHtml.length,
        containsDataId: newImageHtml.includes('data-image-id='),
        htmlPreview: newImageHtml.substring(0, 200) + '...'
      });

      return NextResponse.json({
        success: true,
        data: {
          image: newImage,
          html: newImageHtml,
          generationTime
        }
      });

    } catch (generationError) {
      const error = generationError instanceof Error ? generationError : new Error('图片生成失败');
      const generationTime = Date.now() - startTime;

      console.error('❌ 图片重新生成失败:', {
        error: error.message,
        imageId,
        generationTime,
        description: description.substring(0, 100) + '...'
      });

      // 即使生成失败，也尝试生成备用图片
      try {
        console.log('🔄 尝试生成备用图片...');
        const fallbackImage = await generateFallbackImage(imageDescription);
        const fallbackTime = Date.now() - startTime;

        const fallbackHtml = generateImageHtml(fallbackImage, imageDescription);

        console.log('⚠️ 使用备用图片:', {
          source: fallbackImage.source,
          fallbackReason: fallbackImage.fallbackReason,
          totalTime: fallbackTime
        });

        return NextResponse.json({
          success: true,
          data: {
            image: fallbackImage,
            html: fallbackHtml,
            generationTime: fallbackTime,
            fallback: true,
            fallbackReason: fallbackImage.fallbackReason
          }
        });

      } catch (fallbackError) {
        console.error('💥 备用图片生成也失败:', fallbackError);

        return NextResponse.json({
          success: false,
          error: `图片生成失败: ${error.message}`,
          details: {
            generationTime,
            originalError: error.message,
            fallbackError: fallbackError instanceof Error ? fallbackError.message : '未知错误'
          }
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('💥 API请求处理失败:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
      details: {
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
      }
    }, { status: 500 });
  }
}

// 生成备用图片（从imageService.ts复制）
async function generateFallbackImage(description: any): Promise<any> {
  // 这里实现备用图片生成逻辑
  // 可以使用免费图片源或占位符
  const config = getImageServiceConfig();

  // 简单的占位符实现
  const width = description.width || 1024;
  const height = description.height || 1024;

  return {
    id: description.id,
    url: `https://picsum.photos/seed/${description.id}/${width}/${height}.jpg`,
    description: description.description,
    style: description.style || 'placeholder',
    width,
    height,
    generationTime: 0,
    source: 'fallback',
    fallbackReason: 'AI生成失败，使用备用图片源'
  };
}

// 生成图片HTML（从imageService.ts复制）
function generateImageHtml(image: any, placeholder: any): string {
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

  // 确保所有引号都是标准ASCII引号
  const cleanDescription = (image.description || '')
    .replace(/[""]/g, '"')
    .replace(/"/g, '"')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;');

  const cleanUrl = image.url
    .replace(/[""]/g, '"')
    .replace(/"/g, '"');

  const cleanImageStyle = imageStyle.replace(/[""]/g, '"');

  return `<div class="${imageClass}" data-image-id="${image.id}" data-source="${image.source}">
    <img src="${cleanUrl}" alt="${cleanDescription}"
         style="${cleanImageStyle}"
         loading="lazy" />
    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 8px;">
      ${cleanDescription}
    </p>
    ${additionalInfo}
    <!-- 重新生成按钮容器 -->
    <div class="image-regenerate-controls" style="text-align: center; margin-top: 8px;">
      <button
        onclick="regenerateImage('${image.id}', '${cleanDescription.replace(/'/g, "\\'")}', '${image.style || ''}')"
        style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; margin: 0 4px;"
        onmouseover="this.style.background='#2563eb'"
        onmouseout="this.style.background='#3b82f6'"
      >
        🔄 重新生成
      </button>
    </div>
  </div>`;
}