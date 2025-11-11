'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
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
  XIcon
} from 'lucide-react'

export default function CreatePage() {
  const [selectedInsight, setSelectedInsight] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [articleStyle, setArticleStyle] = useState<'professional' | 'casual' | 'humorous'>('professional')
  const [articleLength, setArticleLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [targetPlatforms, setTargetPlatforms] = useState({
    wechat: true,
    xiaohongshu: true
  })
  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState({
    title: '',
    content: '',
    images: ['https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop']
  })

  const insightOptions = [
    'AI相关话题持续升温，尤其是应用层面',
    '实用性内容比理论性内容更受欢迎',
    '带有具体案例和数据支撑的文章互动率更高',
    '创业者和中小企业主是主要受众群体',
    '工具推荐和操作指南类内容需求旺盛'
  ]

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
    { phase: 'outline', message: '正在生成文章大纲...', duration: 2000 },
    { phase: 'content', message: '正在撰写文章内容...', duration: 5000 },
    { phase: 'images', message: '正在获取配图...', duration: 3000 }
  ]

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
    if (!selectedInsight && !customTopic.trim()) return

    setIsCreating(true)
    setCreationStep(0)
    setShowPreview(false)

    for (let i = 0; i < creationSteps.length; i++) {
      setCreationStep(i)
      await new Promise(resolve => setTimeout(resolve, creationSteps[i].duration))
    }

    setGeneratedArticle(mockArticle)
    setIsCreating(false)
    setShowPreview(true)
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
          {/* 左侧：创作参数设置 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 选题选择 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Wand2Icon className="w-5 h-5 text-primary-600" />
                <span>选题选择</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="insight-select"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    基于洞察点
                  </label>
                  <select
                    id="insight-select"
                    value={selectedInsight}
                    onChange={(e) => setSelectedInsight(e.target.value)}
                    className="input w-full"
                    title="选择分析结果中的洞察点作为内容创作基础"
                  >
                    <option value="">选择洞察点...</option>
                    {insightOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-center text-gray-400 text-sm">或</div>

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
                  />
                </div>
              </div>
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

          {/* 右侧：创作进度和预览 */}
          <div className="lg:col-span-2">
            {/* 创作进度 */}
            {isCreating && (
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">创作进度</h3>
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
                    <div className="flex space-x-2">
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

                  {/* 文章内容 */}
                  <div className="prose max-w-none">
                    {generatedArticle.content.split('\n').map((paragraph, index) => {
                      if (paragraph.startsWith('#')) {
                        return (
                          <h2 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                            {paragraph.replace('#', '').trim()}
                          </h2>
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
            {!isCreating && !showPreview && (
              <div className="card p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <PenToolIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">开始创作您的第一篇文章</h3>
                <p className="text-gray-500 mb-6">
                  选择选题洞察或输入自定义主题，设置创作参数，点击"开始创作"即可
                </p>
                <div className="text-sm text-gray-400">
                  <p>✨ AI将自动生成文章大纲和内容</p>
                  <p>🖼️ 自动插入相关图片</p>
                  <p>⚡ 支持多种风格和长度</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}