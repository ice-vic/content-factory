'use client'

import Navigation from '@/components/Navigation'
import { useState } from 'react'
import {
  SettingsIcon,
  KeyIcon,
  ZapIcon,
  SaveIcon,
  TestTubeIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon
} from 'lucide-react'

// 类型定义
interface ShowApiKeys {
  [key: string]: boolean
}

interface TestStatuses {
  [key: string]: string
}

interface ApiConfig {
  [key: string]: string | number
}

export default function SettingsPage() {
  // API配置状态
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    openaiApiKey: '',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiModel: 'gpt-3.5-turbo',
    claudeApiKey: '',
    claudeBaseUrl: 'https://api.anthropic.com',
    claudeModel: 'claude-3-sonnet-20240229',
    geminiApiKey: '',
    geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    geminiModel: 'gemini-pro'
  })

  // 显示状态
  const [showApiKeys, setShowApiKeys] = useState<ShowApiKeys>({
    openai: false,
    claude: false,
    gemini: false
  })

  // 测试状态
  const [testStatus, setTestStatus] = useState<TestStatuses>({
    openai: 'idle',
    claude: 'idle',
    gemini: 'idle'
  })

  // 保存状态
  const [saveStatus, setSaveStatus] = useState('idle')

  // AI模型配置
  const aiModels = [
    {
      provider: 'OpenAI',
      key: 'openai',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
      ]
    },
    {
      provider: 'Anthropic',
      key: 'claude',
      models: [
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
      ]
    },
    {
      provider: 'Google',
      key: 'gemini',
      models: [
        { id: 'gemini-pro', name: 'Gemini Pro' },
        { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
      ]
    }
  ]

  // 处理输入变化
  const handleInputChange = (field: string, value: string | number) => {
    setApiConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 测试API连接
  const testApiConnection = async (provider: string) => {
    setTestStatus(prev => ({ ...prev, [provider]: 'loading' }))

    // 模拟API测试
    setTimeout(() => {
      const success = Math.random() > 0.3
      setTestStatus(prev => ({
        ...prev,
        [provider]: success ? 'success' : 'error'
      }))

      // 3秒后重置状态
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [provider]: 'idle' }))
      }, 3000)
    }, 2000)
  }

  // 保存配置
  const saveConfig = async () => {
    setSaveStatus('loading')

    // 模拟保存操作
    setTimeout(() => {
      const success = true
      setSaveStatus(success ? 'success' : 'error')

      // 3秒后重置状态
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }, 1500)
  }

  // 切换API密钥显示
  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* 页面头部 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API设置</h1>
            <p className="text-gray-600 mt-1">配置AI模型和API接口</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={saveConfig}
              className="btn btn-primary flex items-center space-x-2"
            >
              <SaveIcon className="w-4 h-4" />
              <span>保存配置</span>
            </button>
          </div>
        </div>

        {/* 保存状态提示 */}
        {saveStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckIcon className="w-5 h-5 text-green-600" />
            <span className="text-green-800">配置保存成功！</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <XIcon className="w-5 h-5 text-red-600" />
            <span className="text-red-800">配置保存失败，请重试。</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* API配置 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">AI模型配置</h2>
              <p className="text-sm text-gray-600 mt-1">配置各个AI服务提供商的API密钥和模型参数</p>
            </div>

            <div className="p-6 space-y-8">
              {aiModels.map((provider) => (
                <div key={provider.key} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{provider.provider}</h3>
                    <button
                      onClick={() => testApiConnection(provider.key)}
                      className="btn btn-secondary flex items-center space-x-2 text-sm"
                      disabled={testStatus[provider.key] === 'loading'}
                    >
                      <TestTubeIcon className="w-4 h-4" />
                      <span>
                        {testStatus[provider.key] === 'loading' ? '测试中...' : '测试连接'}
                      </span>
                    </button>
                  </div>

                  {/* 测试状态提示 */}
                  {testStatus[provider.key] === 'success' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">连接测试成功！</span>
                    </div>
                  )}

                  {testStatus[provider.key] === 'error' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                      <XIcon className="w-4 h-4 text-red-600" />
                      <span className="text-red-800 text-sm">连接测试失败，请检查配置。</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`${provider.key}-api-key`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        API密钥
                      </label>
                      <div className="relative">
                        <input
                          id={`${provider.key}-api-key`}
                          type={showApiKeys[provider.key] ? 'text' : 'password'}
                          value={apiConfig[`${provider.key}ApiKey`]}
                          onChange={(e) => handleInputChange(`${provider.key}ApiKey`, e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder={`输入${provider.provider} API密钥`}
                          title={`${provider.provider} API密钥，用于身份验证`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleApiKeyVisibility(provider.key)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiKeys[provider.key] ? (
                            <EyeOffIcon className="w-4 h-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`${provider.key}-model`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        模型选择
                      </label>
                      <select
                        id={`${provider.key}-model`}
                        value={apiConfig[`${provider.key}Model`]}
                        onChange={(e) => handleInputChange(`${provider.key}Model`, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        title={`选择${provider.provider}的AI模型`}
                      >
                        {provider.models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor={`${provider.key}-base-url`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        API基础URL
                      </label>
                      <input
                        id={`${provider.key}-base-url`}
                        type="url"
                        value={apiConfig[`${provider.key}BaseUrl`]}
                        onChange={(e) => handleInputChange(`${provider.key}BaseUrl`, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="输入API基础URL"
                        title={`${provider.provider}的API基础URL地址`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 配置说明 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">配置说明</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-3">
                <AlertCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">获取API密钥</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    您需要访问各个AI服务提供商的官方网站，注册账号并获取API密钥。
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <KeyIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">安全提示</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    API密钥是敏感信息，请妥善保管。不要在不安全的环境中分享或存储密钥。
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <ZapIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">使用建议</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    建议配置多个AI服务提供商，以便在某个服务不可用时使用备用服务。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}