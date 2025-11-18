'use client'

import { useState, useEffect } from 'react'
import {
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  Loader2,
  GlobeIcon,
  UserIcon,
  CheckCircleIcon
} from 'lucide-react'
import { WeChatAccount, PublishOptions, ARTICLE_TYPE_OPTIONS } from '@/types/wechat'

interface WeChatPublishModalProps {
  isOpen: boolean
  onClose: () => void
  articleId: string
  articleTitle: string
  articleContent: string
  articleHtmlContent?: string
  onSuccess?: () => void
}

export default function WeChatPublishModal({
  isOpen,
  onClose,
  articleId,
  articleTitle,
  articleContent,
  articleHtmlContent,
  onSuccess
}: WeChatPublishModalProps) {
  // 状态管理
  const [step, setStep] = useState<'loading' | 'select' | 'publishing' | 'success' | 'error'>('loading')
  const [accounts, setAccounts] = useState<WeChatAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<WeChatAccount | null>(null)
  const [selectedType, setSelectedType] = useState<'news' | 'newspic'>('news')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [publishResult, setPublishResult] = useState<any>(null)

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setStep('loading')
      setAccounts([])
      setSelectedAccount(null)
      setSelectedType('news')
      setIsPublishing(false)
      setError('')
      setPublishResult(null)
    }
  }, [isOpen])

  // 加载公众号列表
  useEffect(() => {
    if (isOpen && step === 'loading') {
      loadWeChatAccounts()
    }
  }, [isOpen, step])

  const loadWeChatAccounts = async () => {
    try {
      console.log('🔍 加载公众号列表...')
      const response = await fetch('/api/wechat/accounts')
      const result = await response.json()

      if (result.success && result.data.accounts.length > 0) {
        setAccounts(result.data.accounts)
        setStep('select')
        console.log('✅ 公众号列表加载成功:', result.data.accounts.length)
      } else {
        throw new result.error || '获取公众号列表失败'
      }
    } catch (error) {
      console.error('💥 加载公众号列表失败:', error)
      setError(error instanceof Error ? error.message : '获取公众号列表失败')
      setStep('error')
    }
  }

  const handleAccountSelect = (account: WeChatAccount) => {
    setSelectedAccount(account)
  }

  const handlePublish = async () => {
    if (!selectedAccount) {
      setError('请选择一个公众号')
      return
    }

    setIsPublishing(true)
    setStep('publishing')
    setError('')

    try {
      console.log('📤 开始发布文章到公众号:', {
        wechatAppid: selectedAccount.wechatAppid,
        accountName: selectedAccount.name,
        articleId,
        articleType: selectedType,
        title: articleTitle,
        contentLength: (articleHtmlContent || articleContent).length
      })

      const publishData = {
        wechatAppid: selectedAccount.wechatAppid,
        title: articleTitle,
        content: articleHtmlContent || articleContent,
        articleType: selectedType,
        contentFormat: 'html'
      }

      // 如果是小绿书且有图片，添加图片说明
      if (selectedType === 'newspic') {
        const imageCount = (articleHtmlContent || articleContent).match(/<img[^>]+>/g)?.length || 0
        if (imageCount === 0) {
          setError('小绿书模式要求文章中至少包含1张图片')
          setStep('select')
          setIsPublishing(false)
          return
        }
        console.log('📷 小绿书模式，检测到图片数量:', imageCount)
      }

      const response = await fetch('/api/wechat/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData)
      })

      const result = await response.json()

      if (result.success) {
        setPublishResult(result.data)
        setStep('success')
        console.log('✅ 文章发布成功:', result.data)

        // 3秒后自动关闭弹窗
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          }
          onClose()
        }, 3000)
      } else {
        throw new Error(result.error || '发布失败')
      }
    } catch (error) {
      console.error('💥 发布失败:', error)
      setError(error instanceof Error ? error.message : '发布失败')
      setStep('select')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleClose = () => {
    if (isPublishing) return
    onClose()
  }

  const getAccountTypeLabel = (type: string) => {
    return type === 'subscription' ? '订阅号' : '服务号'
  }

  const getAccountTypeColor = (type: string) => {
    return type === 'subscription' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <GlobeIcon className="w-5 h-5 text-green-600" />
            发布到微信公众号
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isPublishing}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* 步骤1: 加载公众号列表 */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="mt-3 text-gray-600">正在获取公众号列表...</span>
            </div>
          )}

          {/* 步骤2: 选择公众号和发布类型 */}
          {step === 'select' && (
            <div className="p-6 space-y-6">
              {/* 文章信息预览 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">文章信息</h3>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-500">标题:</span>
                    <span className="ml-2 font-medium text-gray-900">{articleTitle}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">字数:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {(articleHtmlContent || articleContent).length} 字
                    </span>
                  </div>
                </div>
              </div>

              {/* 公众号选择 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <GlobeIcon className="w-4 h-4" />
                  选择公众号
                </h3>
                {accounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GlobeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无可用公众号</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {accounts.map((account) => (
                      <div
                        key={account.wechatAppid}
                        onClick={() => handleAccountSelect(account)}
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedAccount?.wechatAppid === account.wechatAppid
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <img
                          src={account.avatar}
                          alt={account.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-avatar.png'
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{account.name}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                              {getAccountTypeLabel(account.type)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            AppID: {account.wechatAppid}
                          </div>
                        </div>
                        {selectedAccount?.wechatAppid === account.wechatAppid && (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 发布类型选择 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">发布类型</h3>
                <div className="space-y-3">
                  {ARTICLE_TYPE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setSelectedType(option.value as 'news' | 'newspic')}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedType === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="radio"
                          name="articleType"
                          checked={selectedType === option.value}
                          onChange={() => setSelectedType(option.value as 'news' | 'newspic')}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤3: 发布中 */}
          {step === 'publishing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <GlobeIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <span className="mt-4 text-lg font-medium text-gray-900">正在发布到微信公众号...</span>
              <span className="mt-1 text-sm text-gray-500">
                {selectedType === 'newspic' ? '小绿书模式' : '普通文章模式'}
              </span>
              <span className="mt-1 text-xs text-gray-400">
                {selectedAccount?.name} · {selectedAccount?.wechatAppid}
              </span>
            </div>
          )}

          {/* 步骤4: 发布成功 */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-900 mb-2">发布成功！</h3>
              <p className="text-gray-600 text-center mb-4">
                文章已成功发布到<strong>{selectedAccount?.name}</strong>的草稿箱
              </p>
              {publishResult && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>发布ID: {publishResult.publicationId}</div>
                  <div>素材ID: {publishResult.materialId}</div>
                  {publishResult.mediaId && <div>媒体ID: {publishResult.mediaId}</div>}
                </div>
              )}
            </div>
          )}

          {/* 步骤5: 发布失败 */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-900 mb-2">发布失败</h3>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <button
                onClick={() => setStep('select')}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                重新尝试
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'select' && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isPublishing}
            >
              取消
            </button>
            <button
              onClick={handlePublish}
              disabled={!selectedAccount || isPublishing}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>发布中...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>确认发布</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}