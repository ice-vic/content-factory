'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import InsightSelector from '@/components/InsightSelector'
import KeywordInsightViewer from '@/components/KeywordInsightViewer'
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
  SparklesIcon
} from 'lucide-react'
import { generateArticle, recommendParameters } from '@/services/contentService'

export default function CreatePage() {
  const [selectedInsightId, setSelectedInsightId] = useState('')
  const [selectedInsightDetail, setSelectedInsightDetail] = useState<any>(null)
  const [selectedInsight, setSelectedInsight] = useState<any>(null)
  const [customTopic, setCustomTopic] = useState('')
  const [articleStyle, setArticleStyle] = useState<'professional' | 'casual' | 'humorous'>('professional')
  const [articleLength, setArticleLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [targetPlatforms, setTargetPlatforms] = useState({
    wechat: true,
    xiaohongshu: true
  })
  const [customInstructions, setCustomInstructions] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState({
    title: '',
    content: '',
    sections: [],
    estimatedReadingTime: 0
  })
  const [errorMessage, setErrorMessage] = useState('')

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

  // 洞察选择处理
  const handleInsightSelect = useCallback(async (insightId: string, insightDetail?: any) => {
    setSelectedInsightId(insightId)
    setSelectedInsightDetail(insightDetail)

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
    if (!selectedInsight && !customTopic.trim()) {
      setErrorMessage('请选择洞察报告或输入自定义主题')
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
        customInstructions: customInstructions.trim() || undefined
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
            throw new Error(result.error || '文章生成失败')
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

  const handleSaveToPublish = () => {
    // 这里将来会调用API保存到发布管理
    alert('文章已保存到发布管理！')
  }

  const handleRegenerate = () => {
    setShowPreview(false)
    handleStartCreation()
  }

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
                          onChange={(e) => setArticleLength(e.target.value as any)}
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
              disabled={(!selectedInsight && !customTopic.trim()) || isCreating}
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
                      value={generatedArticle.title}
                      onChange={(e) => setGeneratedArticle(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      className="text-2xl font-bold text-gray-900 w-full border-none outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    />
                  </div>

                  {/* 文章目录（如果有章节） */}
                  {generatedArticle.sections && generatedArticle.sections.length > 0 && (
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
                    {generatedArticle.content.split('\n').map((paragraph, index) => {
                      if (paragraph.startsWith('#')) {
                        const level = paragraph.match(/^#+/)?.[0].length || 1
                        const text = paragraph.replace(/^#+\s*/, '').trim()
                        const HeadingTag = `h${Math.min(level + 1, 6)}` as keyof JSX.IntrinsicElements
                        return (
                          <HeadingTag key={index} className="text-gray-900 mt-6 mb-3 font-semibold">
                            {text}
                          </HeadingTag>
                        )
                      }
                      if (paragraph.includes('![')) {
                        const match = paragraph.match(/!\[(.*?)\]\((.*?)\)/)
                        if (match) {
                          const altText = match[1] || '生成的图片'
                          return (
                            <div key={index} className="my-6">
                              <img
                                src={match[2]}
                                alt={altText}
                                className="w-full rounded-lg shadow-sm"
                              />
                              <p className="text-sm text-gray-500 mt-2 text-center">{altText}</p>
                            </div>
                          )
                        }
                      }
                      if (paragraph.trim()) {
                        return (
                          <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                            {paragraph}
                          </p>
                        )
                      }
                      return null
                    })}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button className="btn btn-secondary flex items-center space-x-2">
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
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>保存到发布管理</span>
                      </button>
                    </div>
                  </div>
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
                  选择洞察报告或输入自定义主题，设置创作参数，点击"开始创作"即可
                </p>
                <div className="text-sm text-gray-400">
                  <p>🎯 基于12小时内的洞察报告智能创作</p>
                  <p>🔍 实时查看关键词分析和选题洞察</p>
                  <p>✨ AI自动推荐最佳创作参数</p>
                  <p>⚡ 支持多种风格和平台适配</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}