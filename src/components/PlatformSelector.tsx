'use client'

import { MonitorIcon, SmartphoneIcon, CheckIcon } from 'lucide-react'

interface PlatformSelectorProps {
  selectedPlatform: 'wechat' | 'xiaohongshu' | null
  onPlatformChange: (platform: 'wechat' | 'xiaohongshu') => void
  disabled?: boolean
}

export default function PlatformSelector({ selectedPlatform, onPlatformChange, disabled = false }: PlatformSelectorProps) {
  const platforms = [
    {
      value: 'wechat' as const,
      label: '公众号',
      description: '微信公众号内容创作',
      icon: MonitorIcon,
      color: 'blue'
    },
    {
      value: 'xiaohongshu' as const,
      label: '小红书',
      description: '小红书平台内容创作',
      icon: SmartphoneIcon,
      color: 'red'
    }
  ]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        选择内容平台
      </label>
      <div className="space-y-2">
        {platforms.map((platform) => {
          const Icon = platform.icon
          const isSelected = selectedPlatform === platform.value

          return (
            <label
              key={platform.value}
              className={`
                relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                ${isSelected
                  ? `border-${platform.color}-500 bg-${platform.color}-50`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="platform"
                value={platform.value}
                checked={isSelected}
                onChange={() => onPlatformChange(platform.value)}
                disabled={disabled}
                className="sr-only"
              />

              {/* 选中状态指示器 */}
              <div className={`
                absolute right-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected
                  ? `border-${platform.color}-500 bg-${platform.color}-500`
                  : 'border-gray-300 bg-white'
                }
              `}>
                {isSelected && (
                  <CheckIcon className="w-3 h-3 text-white" />
                )}
              </div>

              {/* 平台图标和信息 */}
              <div className="flex items-center space-x-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isSelected
                    ? `bg-${platform.color}-500 text-white`
                    : `bg-${platform.color}-100 text-${platform.color}-600`
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-medium ${
                    isSelected ? `text-${platform.color}-900` : 'text-gray-900'
                  }`}>
                    {platform.label}
                  </div>
                  <div className={`text-sm ${
                    isSelected ? `text-${platform.color}-700` : 'text-gray-500'
                  }`}>
                    {platform.description}
                  </div>
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {selectedPlatform && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckIcon className="w-4 h-4" />
            <span className="text-sm">
              已选择 {selectedPlatform === 'wechat' ? '公众号' : '小红书'} 平台，将显示对应的洞察报告
            </span>
          </div>
        </div>
      )}
    </div>
  )
}