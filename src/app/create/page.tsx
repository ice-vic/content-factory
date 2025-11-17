'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import InsightSelector from '@/components/InsightSelector'
import KeywordInsightViewer from '@/components/KeywordInsightViewer'
import PlatformSelector from '@/components/PlatformSelector'
import RichTextEditor from '@/components/RichTextEditor'
import ArticleEditor from '@/components/ArticleEditor'
import {
  PenToolIcon,
  Wand2Icon,
  ImageIcon,
  SettingsIcon,
  PlayIcon,
  RefreshCwIcon,
  EyeIcon,
  Edit3Icon,
  SaveIcon,
  DownloadIcon,
  CheckIcon,
  XIcon,
  SparklesIcon,
  CameraIcon,
  LayersIcon
} from 'lucide-react'
import { generateArticle, recommendParameters } from '@/services/contentService'

export default function CreatePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<'wechat' | 'xiaohongshu' | null>(null)
  const [selectedInsightId, setSelectedInsightId] = useState('')
  const [selectedInsightDetail, setSelectedInsightDetail] = useState<any>(null)
  const [selectedInsight, setSelectedInsight] = useState<any>(null)
  const [selectedTopicDirection, setSelectedTopicDirection] = useState('') // 选中的选题方向
  const [customTopic, setCustomTopic] = useState('')
  const [articleStyle, setArticleStyle] = useState<'professional' | 'casual' | 'humorous'>('professional')
  const [articleLength, setArticleLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [targetPlatforms, setTargetPlatforms] = useState({
    wechat: true,
    xiaohongshu: true
  })
  const [customInstructions, setCustomInstructions] = useState('')

  // 配图功能状态
  const [enableImages, setEnableImages] = useState(false)
  const [imageDensity, setImageDensity] = useState<'sparse' | 'medium' | 'dense'>('medium')
  const [imageStyle, setImageStyle] = useState<'business' | 'lifestyle' | 'illustration' | 'data-viz' | 'photorealistic'>('photorealistic')
  const [imagePosition, setImagePosition] = useState<'after-paragraph' | 'after-section' | 'mixed'>('after-paragraph')
  const [maxImages, setMaxImages] = useState(3)
  const [smartImageCount, setSmartImageCount] = useState(true) // 智能调整图片数量

  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<{
    title: string;
    content: string;
    sections: string[];
    estimatedReadingTime: number;
    hasImages?: boolean;
    imageCount?: number;
    imageGenerationSummary?: any;
  }>({
    title: '',
    content: '',
    sections: [],
    estimatedReadingTime: 0
  })
  const [errorMessage, setErrorMessage] = useState('')

  // 保存相关状态
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>('success')

  // 编辑相关状态
  const [isEditing, setIsEditing] = useState(false)
  const [editableContent, setEditableContent] = useState('')
  const [editableTitle, setEditableTitle] = useState('')

  // 图片重新生成状态管理
  const [regeneratingImages, setRegeneratingImages] = useState<Set<string>>(new Set())
  const [regenerateErrors, setRegenerateErrors] = useState<Map<string, string>>(new Map())

  const styleOptions = [
    { value: 'professional', label: '专业严谨', desc: '适合正式场合，内容严谨专业' },
    { value: 'casual', label: '轻松活泼', desc: '适合日常分享，语言轻松易懂' },
    { value: 'humorous', label: '幽默有趣', desc: '适合娱乐内容，增加趣味性' }
  ]

  const lengthOptions = [
    { value: 'short', label: '短篇', desc: '约500字，快速阅读' },
    { value: 'medium', label: '中篇', desc: '约1000字，内容适中' },
    { value: 'long', label: '长篇', desc: '约2000字，深度解析' }
  ]

  const creationSteps = [
    { phase: 'analyzing', message: '正在分析创作要求...', duration: 1000 },
    { phase: 'outline', message: '正在生成文章大纲...', duration: 3000 },
    { phase: 'content', message: '正在撰写文章内容...', duration: 8000 },
    { phase: 'formatting', message: '正在格式化文章...', duration: 2000 }
  ]

  // 平台选择处理
  const handlePlatformChange = useCallback((platform: 'wechat' | 'xiaohongshu') => {
    setSelectedPlatform(platform)
    // 切换平台时清除已选择的洞察
    setSelectedInsightId('')
    setSelectedInsightDetail(null)
    setSelectedInsight(null)
    // 切换平台时重置选题方向选择
    setSelectedTopicDirection('')

    // 自动调整目标平台设置
    setTargetPlatforms({
      wechat: platform === 'wechat',
      xiaohongshu: platform === 'xiaohongshu'
    })

    setErrorMessage('')
  }, [])

  // 文章长度变化时，智能调整配图数量
  const handleArticleLengthChange = useCallback((length: 'short' | 'medium' | 'long') => {
    setArticleLength(length)

    // 根据文章长度智能调整最大图片数
    let suggestedMaxImages = 3
    if (length === 'short') {
      suggestedMaxImages = 2 // 短篇最多2张图
    } else if (length === 'medium') {
      suggestedMaxImages = 4 // 中篇最多4张图
    } else {
      suggestedMaxImages = 6 // 长篇最多6张图
    }

    // 如果当前设置的图片数超过建议值，自动调整
    if (maxImages > suggestedMaxImages) {
      setMaxImages(suggestedMaxImages)
    }
  }, [maxImages])

  // 洞察选择处理
  const handleInsightSelect = useCallback(async (insightId: string, insightDetail?: any) => {
    setSelectedInsightId(insightId)
    setSelectedInsightDetail(insightDetail)
    // 切换洞察时重置选题方向选择
    setSelectedTopicDirection('')

    if (insightDetail && insightDetail.structuredTopicInsights?.length > 0) {
      // 默认选择第一个洞察
      setSelectedInsight(insightDetail.structuredTopicInsights[0])

      // 基于洞察推荐创作参数
      const recommendations = recommendParameters(insightDetail.structuredTopicInsights[0])

      if (recommendations.style) setArticleStyle(recommendations.style)
      if (recommendations.length) setArticleLength(recommendations.length)
      if (recommendations.platforms) setTargetPlatforms(recommendations.platforms)
    } else {
      setSelectedInsight(null)
    }

    setErrorMessage('')
  }, [])

  // 选题方向选择处理
  const handleTopicDirectionSelect = useCallback((topicDirection: string) => {
    setSelectedTopicDirection(topicDirection)
    setErrorMessage('') // 清除之前的错误信息
  }, [])

  // 具体洞察选择处理
  const handleSpecificInsightSelect = useCallback((insight: any) => {
    setSelectedInsight(insight)

    // 基于选中的具体洞察重新推荐参数
    const recommendations = recommendParameters(insight)
    if (recommendations.style) setArticleStyle(recommendations.style)
    if (recommendations.length) setArticleLength(recommendations.length)
    if (recommendations.platforms) setTargetPlatforms(recommendations.platforms)
  }, [])

  const mockArticle = {
    title: '2024年AI创业必备的5个工具推荐',
    content: `# 2024年AI创业必备的5个工具推荐

在AI技术快速发展的今天，创业者需要借助各种AI工具来提升效率和竞争力。本文将为您推荐5个在2024年不可错过的AI创业工具。

## 1. ChatGPT - 智能对话助手

![AI助手](https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop)

作为目前最受欢迎的AI对话工具，ChatGPT在内容创作、客户服务、代码编写等多个方面都有出色表现。对于创业者来说，它可以：

- 快速生成营销文案
- 提供商业建议
- 辅助决策分析
- 自动化客服回复

## 2. Midjourney - AI图像生成

![AI图像](https://images.unsplash.com/photo-1668042532669-9586226c9c0b?w=800&h=400&fit=crop)

对于需要大量视觉内容的创业项目，Midjourney提供了高质量的AI图像生成服务。无论是产品原型、营销海报还是社交媒体内容，都能快速生成。

## 3. Notion AI - 智能文档管理

Notion AI将AI能力集成到了文档管理中，帮助团队更好地组织和处理信息。

## 4. Grammarly - 智能写作助手

专业的写作辅助工具，确保您的内容质量。

## 5. Canva AI - 设计助手

即使是设计新手，也能通过Canva AI快速制作专业的设计作品。

## 总结

选择合适的AI工具能够大大提升创业效率。建议根据具体需求选择最适合的工具组合。`,
    images: [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1668042532669-9586226c9c0b?w=800&h=400&fit=crop'
    ]
  }

  const handleStartCreation = async () => {
    if (!selectedPlatform) {
      setErrorMessage('请先选择内容平台')
      return
    }
    if (!selectedInsight && !customTopic.trim()) {
      setErrorMessage('请选择洞察报告或输入自定义主题')
      return
    }

    // 如果选择了洞察报告，验证是否选择了选题方向
    if (selectedInsight && !selectedTopicDirection.trim()) {
      setErrorMessage('请选择一个选题方向')
      return
    }

    setIsCreating(true)
    setCreationStep(0)
    setShowPreview(false)
    setErrorMessage('')

    try {
      // 确定创作主题
      const topic = selectedInsight?.recommendedTopics?.[0] || customTopic.trim()

      // 构建生成参数
      const parameters = {
        style: articleStyle,
        length: articleLength,
        platforms: targetPlatforms,
        customInstructions: customInstructions.trim() || undefined,
        // 选题方向
        topicDirection: selectedTopicDirection.trim() || undefined,
        // 配图参数
        enableImages,
        imageDensity,
        imageStyle,
        imagePosition,
        maxImages: enableImages ? maxImages : 0,
        smartImageCount
      }

      // 逐步执行创作流程
      for (let i = 0; i < creationSteps.length; i++) {
        setCreationStep(i)

        if (i === creationSteps.length - 1) {
          // 最后一步执行实际的AI生成
          const result = await generateArticle(topic, selectedInsight, parameters)

          if (result.success && result.article) {
            setGeneratedArticle(result.article)
          } else {
            // 如果AI生成失败，但有备选方案，则使用备选方案
            if (result.fallback) {
              console.log('🔄 使用备选文章方案')
              setGeneratedArticle(result.fallback)
              setErrorMessage('AI服务暂时不可用，已为您生成备用内容')
            } else {
              throw new Error(result.error || '文章生成失败')
            }
          }
          break
        }

        // 模拟前面步骤的等待时间
        await new Promise(resolve => setTimeout(resolve, creationSteps[i].duration))
      }

      setShowPreview(true)
    } catch (error) {
      console.error('文章生成失败:', error)
      setErrorMessage(error instanceof Error ? error.message : '文章生成失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveToPublish = async () => {
    if (!generatedArticle.title || !generatedArticle.content) {
      setErrorMessage('没有可保存的文章内容')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      // 构建配图配置对象
      const imageConfig = enableImages ? {
        density: imageDensity,
        style: imageStyle,
        position: imagePosition,
        maxImages,
        smartImageCount
      } : null

      // 准备保存的数据
      const saveData = {
        title: generatedArticle.title,
        content: generatedArticle.content,
        htmlContent: generatedArticle.content, // 直接保存内容，因为内容可能已经包含HTML
        platform: selectedPlatform || 'wechat',
        style: articleStyle,
        length: articleLength,
        targetPlatforms: Object.keys(targetPlatforms).filter(key => targetPlatforms[key as keyof typeof targetPlatforms]),
        customInstructions: customInstructions.trim() || null,
        insightId: selectedInsightId || null,
        topicDirection: selectedTopicDirection || null,
        hasImages: generatedArticle.hasImages || false,
        imageConfig,
        estimatedReadingTime: generatedArticle.estimatedReadingTime,
        sections: generatedArticle.sections || null
      }

      console.log('🔄 准备保存文章到发布管理:', {
        title: saveData.title,
        platform: saveData.platform,
        hasImages: saveData.hasImages,
        sectionsCount: saveData.sections?.length || 0
      })

      const response = await fetch('/api/content/save-to-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSaveMessage(`文章已成功保存到发布管理！文章ID: ${result.articleId}`)
        setSaveMessageType('success')
        console.log('✅ 文章保存成功:', result)

        // 3秒后清除成功消息
        setTimeout(() => {
          setSaveMessage('')
        }, 5000)

      } else {
        throw new Error(result.error || '保存失败')
      }

    } catch (error) {
      console.error('💥 保存文章失败:', error)
      setSaveMessage(error instanceof Error ? error.message : '保存文章失败，请稍后重试')
      setSaveMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerate = () => {
    setShowPreview(false)
    handleStartCreation()
  }

  // 编辑功能处理函数
  const handleStartEdit = () => {
    setIsEditing(true)
    setEditableTitle(generatedArticle.title)

    // 处理内容：如果包含HTML图片，保持HTML格式；否则使用原始内容
    const content = generatedArticle.content
    const hasHtmlImages = content.includes('class="generated-image"') ||
                        content.includes('data-image-id=') ||
                        content.includes('<img src=')

    if (hasHtmlImages) {
      // 如果有HTML图片，直接使用HTML内容
      setEditableContent(content)
    } else {
      // 如果是纯Markdown内容，可以转换为HTML或保持原样
      setEditableContent(content)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditableTitle('')
    setEditableContent('')
  }

  const handleSaveEdit = () => {
    setGeneratedArticle(prev => ({
      ...prev,
      title: editableTitle,
      content: editableContent
    }))
    setIsEditing(false)
    console.log('✅ 文章编辑已保存 - 富文本内容长度:', editableContent.length)
  }

  // 单张图片重新生成函数
  const regenerateSingleImage = async (imageId: string, description: string, style?: string) => {
    if (regeneratingImages.has(imageId)) {
      console.log(`⚠️ 图片 ${imageId} 正在重新生成中，跳过重复请求`);
      return;
    }

    console.log('🔄 开始重新生成图片:', {
      imageId,
      description,
      style,
      timestamp: new Date().toISOString()
    });

    try {
      // 添加到正在重新生成状态
      setRegeneratingImages(prev => new Set(Array.from(prev).concat([imageId])));
      // 清除之前的错误
      setRegenerateErrors(prev => {
        const newMap = new Map(Array.from(prev.entries()));
        newMap.delete(imageId);
        return newMap;
      });

      // 显示加载状态
      const imageElement = document.querySelector(`[data-image-id="${imageId}"]`) as HTMLElement;
      if (imageElement) {
        const buttonElement = imageElement.querySelector('.image-regenerate-controls button') as HTMLButtonElement;
        if (buttonElement) {
          buttonElement.textContent = '🔄 生成中...';
          buttonElement.disabled = true;
          buttonElement.style.background = '#9ca3af';
          buttonElement.style.cursor = 'not-allowed';
        }
      }

      // 调用重新生成API
      const response = await fetch('/api/content/regenerate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          description,
          style: style || 'photorealistic'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ 图片重新生成成功:', {
          imageId,
          hasHtml: !!result.data.html,
          isFallback: !!result.data.fallback,
          generationTime: result.data.generationTime
        });

        // 更新页面上的图片HTML - 使用React状态更新方式
        if (result.data.html) {
          try {
            // 解析新HTML获取图片URL
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result.data.html;
            const newImageElement = tempDiv.firstChild;

            if (newImageElement) {
              const newImg = (newImageElement as Element).querySelector('img');
              if (newImg && newImg.src) {
                // 更新文章内容中的图片URL
                const newImageUrl = newImg.src;
                console.log('🔍 准备更新文章内容中的图片URL:', {
                  imageId,
                  newImageUrl: newImageUrl.substring(0, 50) + '...'
                });

                // 使用React状态更新 - 更新生成的文章内容
                setGeneratedArticle(prev => {
                  if (!prev) return prev;

                  // 在文章内容中查找并替换对应的图片
                  const updatedContent = prev.content.replace(
                    new RegExp(`<div class="generated-image[^>]*data-image-id="${imageId}"[^>]*>[\\s\\S]*?<img[^>]*src="[^"]*"[^>]*>`, 'g'),
                    (match) => {
                      // 保留原有的div结构和属性，只更新img的src
                      const divMatch = match.match(/^(<div[^>]*data-image-id="${imageId}"[^>]*>)/);
                      const imgMatch = match.match(/(<img[^>]*src=")[^"]*("[^>]*>)/);

                      if (divMatch && imgMatch) {
                        const imgRest = match.match(/src="[^"]*"([^>]*)>$/);
                        const newImgTag = `<img${imgRest ? imgRest[1] : ''}src="${newImageUrl}"${imgMatch[2]}`;
                        return divMatch[1] + newImgTag;
                      }
                      return match;
                    }
                  );

                  return {
                    ...prev,
                    content: updatedContent
                  };
                });

                console.log('✅ 文章内容中的图片URL已更新');

                // 强制重新渲染页面上的图片
                setTimeout(() => {
                  const imgElements = document.querySelectorAll(`[data-image-id="${imageId}"] img`);
                  imgElements.forEach((img: any) => {
                    // 强制刷新图片以绕过缓存
                    const originalSrc = img.src;
                    img.src = '';
                    img.src = originalSrc + '?_force=' + Date.now();
                  });
                }, 100);

              } else {
                console.error('❌ 新HTML中未找到图片元素');
              }
            } else {
              console.error('❌ 无法解析新图片HTML');
            }
          } catch (error) {
            console.error('💥 图片更新失败:', error);
            setRegenerateErrors(prev => new Map(Array.from(prev.entries()).concat([[imageId, '图片更新失败']])));
          }
        } else {
          console.warn('⚠️ 图片重新生成响应异常:', result);
          setRegenerateErrors(prev => new Map(Array.from(prev.entries()).concat([[imageId, '图片更新失败']])));
        }

      } else {
        console.error('❌ 图片重新生成API失败:', {
          imageId,
          error: result.error,
          details: result.details,
          status: response.status
        });

        setRegenerateErrors(prev => new Map(Array.from(prev.entries()).concat([[imageId, result.error || '重新生成失败']])));

        // 恢复按钮状态
        if (imageElement) {
          const buttonElement = imageElement.querySelector('.image-regenerate-controls button') as HTMLButtonElement;
          if (buttonElement) {
            buttonElement.textContent = '❌ 重试';
            buttonElement.disabled = false;
            buttonElement.style.background = '#ef4444';
          }
        }
      }
    } catch (error) {
      console.error('💥 图片重新生成网络错误:', {
        imageId,
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined
      });

      setRegenerateErrors(prev => new Map(Array.from(prev.entries()).concat([[imageId, '网络错误，请检查连接']])));

      // 恢复按钮状态
      const imageElement = document.querySelector(`[data-image-id="${imageId}"]`) as HTMLElement;
      if (imageElement) {
        const buttonElement = imageElement.querySelector('.image-regenerate-controls button') as HTMLButtonElement;
        if (buttonElement) {
          buttonElement.textContent = '❌ 重试';
          buttonElement.disabled = false;
          buttonElement.style.background = '#ef4444';
        }
      }

    } finally {
      // 从正在重新生成状态中移除
      setRegeneratingImages(prev => {
        const newArray = Array.from(prev).filter(id => id !== imageId);
        return new Set(newArray);
      });
    }
  };

  // 将函数暴露到全局作用域，供HTML中的onclick调用
  useEffect(() => {
    (window as any).regenerateImage = regenerateSingleImage;

    // 清理函数
    return () => {
      delete (window as any).regenerateImage;
    };
  }, [regenerateSingleImage]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">内容创作</h1>
          <p className="text-gray-600">基于选题洞察，AI自动创作高质量文章内容</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：洞察选择和创作参数设置 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 平台选择 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-primary-600" />
                <span>平台选择</span>
              </h3>

              <PlatformSelector
                selectedPlatform={selectedPlatform}
                onPlatformChange={handlePlatformChange}
                disabled={isCreating}
              />
            </div>

            {/* 洞察选择 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Wand2Icon className="w-5 h-5 text-primary-600" />
                <span>洞察报告选择</span>
              </h3>

              <InsightSelector
                selectedInsight={selectedInsightId}
                onInsightSelect={handleInsightSelect}
                disabled={isCreating}
                platform={selectedPlatform}
                selectedTopicDirection={selectedTopicDirection}
                onTopicDirectionSelect={handleTopicDirectionSelect}
              />

              <div className="text-center text-gray-400 text-sm my-4">或</div>

              <div>
                <label
                  htmlFor="custom-topic"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  自定义主题
                </label>
                <input
                  id="custom-topic"
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="输入自定义主题..."
                  className="input w-full"
                  title="输入自定义主题进行内容创作"
                  disabled={isCreating}
                />
              </div>

              {/* 智能推荐提示 */}
              {selectedInsight && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">已根据选中的洞察智能推荐创作参数</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI创作参数 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-primary-600" />
                <span>创作参数</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文章风格
                  </label>
                  <div className="space-y-2">
                    {styleOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="style"
                          value={option.value}
                          checked={articleStyle === option.value}
                          onChange={(e) => setArticleStyle(e.target.value as any)}
                          className="text-primary-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文章长度
                  </label>
                  <div className="space-y-2">
                    {lengthOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="length"
                          value={option.value}
                          checked={articleLength === option.value}
                          onChange={(e) => handleArticleLengthChange(e.target.value as any)}
                          className="text-primary-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标平台
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={targetPlatforms.wechat}
                        onChange={(e) => setTargetPlatforms(prev => ({
                          ...prev,
                          wechat: e.target.checked
                        }))}
                        className="text-primary-600"
                      />
                      <span>公众号</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={targetPlatforms.xiaohongshu}
                        onChange={(e) => setTargetPlatforms(prev => ({
                          ...prev,
                          xiaohongshu: e.target.checked
                        }))}
                        className="text-primary-600"
                      />
                      <span>小红书</span>
                    </label>
                  </div>
                </div>

                {/* 配图功能 */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CameraIcon className="w-4 h-4 text-gray-500" />
                    <input
                      type="checkbox"
                      id="enableImages"
                      checked={enableImages}
                      onChange={(e) => setEnableImages(e.target.checked)}
                      className="text-primary-600"
                    />
                    <label htmlFor="enableImages" className="text-sm font-medium text-gray-700">
                      启用自动配图
                    </label>
                  </div>

                  {enableImages && (
                    <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                      {/* 配图密度 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          配图密度
                        </label>
                        <select
                          value={imageDensity}
                          onChange={(e) => setImageDensity(e.target.value as any)}
                          className="input text-sm"
                        >
                          <option value="sparse">稀疏 (1-2张)</option>
                          <option value="medium">适中 (3-5张)</option>
                          <option value="dense">密集 (6-8张)</option>
                        </select>
                      </div>

                      {/* 图片风格 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          图片风格
                        </label>
                        <select
                          value={imageStyle}
                          onChange={(e) => setImageStyle(e.target.value as any)}
                          className="input text-sm"
                        >
                          <option value="photorealistic">真实照片</option>
                          <option value="business">商务风格</option>
                          <option value="lifestyle">生活化场景</option>
                          <option value="illustration">插画风格</option>
                          <option value="data-viz">信息图表</option>
                        </select>
                      </div>

                      {/* 配图位置 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          配图位置
                        </label>
                        <select
                          value={imagePosition}
                          onChange={(e) => setImagePosition(e.target.value as any)}
                          className="input text-sm"
                        >
                          <option value="after-paragraph">段落后</option>
                          <option value="after-section">章节后</option>
                          <option value="mixed">混合布局</option>
                        </select>
                      </div>

                      {/* 最大图片数量 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大图片数量
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="smartImageCount"
                              checked={smartImageCount}
                              onChange={(e) => setSmartImageCount(e.target.checked)}
                              className="text-primary-600"
                            />
                            <label htmlFor="smartImageCount" className="text-sm text-gray-600">
                              智能调整数量（推荐）
                            </label>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={maxImages}
                            onChange={(e) => setMaxImages(parseInt(e.target.value) || 5)}
                            className="input text-sm"
                            disabled={smartImageCount}
                            placeholder={smartImageCount ? "将根据文章长度智能调整" : "手动设置图片数量"}
                          />
                          {smartImageCount && (
                            <p className="text-xs text-gray-500">
                              系统将根据文章长度和内容自动调整最合适的图片数量
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 自定义说明 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Edit3Icon className="w-5 h-5 text-primary-600" />
                <span>自定义说明</span>
              </h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="输入额外的创作要求，比如：需要包含具体案例、面向特定行业等..."
                className="input w-full h-24 resize-none"
                disabled={isCreating}
              />
            </div>

            {/* 错误提示 */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <XIcon className="w-4 h-4" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* 开始创作按钮 */}
            <button
              onClick={handleStartCreation}
              disabled={!selectedPlatform || (!selectedInsight && !customTopic.trim()) || isCreating}
              className="btn btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>创作中...</span>
                </>
              ) : (
                <>
                  <PenToolIcon className="w-4 h-4" />
                  <span>开始创作</span>
                </>
              )}
            </button>
          </div>

          {/* 右侧：关键词洞察和创作进度预览 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 关键词洞察查看器 */}
            {selectedInsightDetail && !showPreview && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Wand2Icon className="w-5 h-5 text-primary-600" />
                  <span>选题洞察分析</span>
                </h3>
                <KeywordInsightViewer
                  insightDetail={selectedInsightDetail}
                  selectedInsightId={selectedInsightId}
                  onInsightSelect={handleSpecificInsightSelect}
                />
              </div>
            )}

            {/* 创作进度 */}
            {isCreating && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI创作进度</h3>
                <div className="space-y-4">
                  {creationSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        index <= creationStep ? 'bg-primary-50' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          index < creationStep
                            ? 'bg-green-500 text-white'
                            : index === creationStep
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {index < creationStep ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={
                          index <= creationStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }
                      >
                        {step.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 文章预览 */}
            {showPreview && (
              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">文章预览</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        预计阅读时间: {generatedArticle.estimatedReadingTime}分钟
                      </div>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="btn btn-secondary"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* 文章标题 */}
                  <div className="mb-6">
                    <input
                      type="text"
                      value={isEditing ? editableTitle : generatedArticle.title}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      readOnly={!isEditing}
                      className={`text-2xl font-bold text-gray-900 w-full rounded px-2 py-1 transition-colors ${
                        isEditing
                          ? 'border-2 border-primary-300 outline-none focus:ring-2 focus:ring-primary-500 bg-white'
                          : 'border-none outline-none focus:ring-2 focus:ring-primary-500 bg-transparent cursor-pointer hover:bg-gray-50'
                      }`}
                      placeholder="请输入文章标题"
                    />
                  </div>

                  {/* 编辑控制按钮 */}
                  {isEditing && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800 font-medium">✏️ 正在编辑模式</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="btn btn-primary flex items-center space-x-2 text-sm"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>保存</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn btn-secondary flex items-center space-x-2 text-sm"
                          >
                            <XIcon className="w-4 h-4" />
                            <span>取消</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 文章目录（如果有章节） */}
                  {!isEditing && generatedArticle.sections && generatedArticle.sections.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">文章目录</h4>
                      <div className="space-y-1">
                        {generatedArticle.sections.map((section, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {index + 1}. {section}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 文章内容 */}
                  <div className="prose max-w-none">
                    {isEditing ? (
                      // 编辑模式：使用富文本编辑器
                      <div>
                        {/* 标题编辑 */}
                        <div className="mb-6">
                          <input
                            type="text"
                            value={editableTitle}
                            onChange={(e) => setEditableTitle(e.target.value)}
                            className="text-3xl font-bold text-gray-900 w-full rounded px-3 py-2 border-2 border-primary-300 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="请输入文章标题"
                          />
                        </div>

                        {/* 富文本内容编辑器 */}
                        <ArticleEditor
                          value={editableContent}
                          onChange={setEditableContent}
                          placeholder="请输入文章内容..."
                          className="border-2 border-primary-300 rounded-lg"
                        />
                      </div>
                    ) : (
                      // 预览模式：正常渲染内容
                      (() => {
                        const content = generatedArticle.content;

                        // 多重检测确保HTML图片存在
                        const hasGeneratedImage =
                          content.includes('class="generated-image"') ||
                          content.includes('data-image-id=') ||
                          content.includes('<img src=');

                        console.log('🔍 前端HTML检测:', {
                          hasGeneratedImage,
                          contentLength: content.length,
                          containsClass: content.includes('class="generated-image"'),
                          containsDataId: content.includes('data-image-id='),
                          containsImgTag: content.includes('<img src='),
                          contentPreview: content.substring(0, 200) + '...'
                        });

                        // 如果内容包含HTML图片，直接渲染整个内容
                        if (hasGeneratedImage) {
                          return <div dangerouslySetInnerHTML={{ __html: content }} />;
                        }

                        // 否则使用原来的分割逻辑处理Markdown
                        const parts = content.split(/(\n+#{1,6}\s+.*\n*|\n+)/);

                        return parts.map((part, index) => {
                          if (!part || part.match(/^\n+$/)) return null;

                          // 处理标题
                          const titleMatch = part.match(/^(#{1,6})\s+(.+)$/m);
                          if (titleMatch) {
                            const level = titleMatch[1].length;
                            const text = titleMatch[2].trim();
                            const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
                            return (
                              <HeadingTag key={index} className="text-gray-900 mt-6 mb-3 font-semibold">
                                {text}
                              </HeadingTag>
                            );
                          }

                          // 处理Markdown图片
                          const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
                          if (imageMatch) {
                            const altText = imageMatch[1] || '生成的图片';
                            return (
                              <div key={index} className="my-6">
                                <img
                                  src={imageMatch[2]}
                                  alt={altText}
                                  className="w-full rounded-lg shadow-sm"
                                />
                                <p className="text-sm text-gray-500 mt-2 text-center">{altText}</p>
                              </div>
                            );
                          }

                          // 处理普通段落
                          const trimmedPart = part.trim();
                          if (trimmedPart) {
                            return (
                              <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                                {trimmedPart}
                              </p>
                            );
                          }

                          return null;
                        });
                      })()
                    )}
                  </div>

                  {/* 保存状态消息 */}
                  {saveMessage && (
                    <div className={`mb-4 p-4 rounded-lg border ${
                      saveMessageType === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {saveMessageType === 'success' ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <XIcon className="w-5 h-5" />
                        )}
                        <span className="font-medium">{saveMessage}</span>
                      </div>
                      {saveMessageType === 'success' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <a
                            href="/publish"
                            className="text-green-700 underline text-sm hover:text-green-800"
                          >
                            前往发布管理页面查看
                          </a>
                          <button
                            onClick={() => setSaveMessage('')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            关闭
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 操作按钮 - 只在非编辑模式下显示 */}
                  {!isEditing && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={handleStartEdit}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <Edit3Icon className="w-4 h-4" />
                        <span>编辑</span>
                      </button>
                      <button
                        onClick={handleRegenerate}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <RefreshCwIcon className="w-4 h-4" />
                        <span>重新生成</span>
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn btn-secondary flex items-center space-x-2">
                        <SaveIcon className="w-4 h-4" />
                        <span>保存草稿</span>
                      </button>
                      <button
                        onClick={handleSaveToPublish}
                        disabled={isSaving}
                        className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCwIcon className="w-4 h-4 animate-spin" />
                            <span>保存中...</span>
                          </>
                        ) : (
                          <>
                            <EyeIcon className="w-4 h-4" />
                            <span>保存到发布管理</span>
                          </>
                        )}
                      </button>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 初始状态提示 */}
            {!isCreating && !showPreview && !selectedInsightDetail && (
              <div className="card p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <PenToolIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">开始创作您的第一篇文章</h3>
                <p className="text-gray-500 mb-6">
                  选择内容平台，选择洞察报告或输入自定义主题，设置创作参数，点击"开始创作"即可
                </p>
                <div className="text-sm text-gray-400">
                  <p>🎯 基于历史洞察报告智能创作</p>
                  <p>📱 支持公众号和小红书平台</p>
                  <p>🔍 实时查看关键词分析和选题洞察</p>
                  <p>✨ AI自动推荐最佳创作参数</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}