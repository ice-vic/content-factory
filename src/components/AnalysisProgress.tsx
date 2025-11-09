'use client'

import { RefreshCwIcon } from 'lucide-react'

interface AnalysisProgressProps {
  currentStep: number
  totalSteps: number
  progress: number
  message: string
}

export default function AnalysisProgress({
  currentStep,
  totalSteps,
  progress,
  message
}: AnalysisProgressProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="loading-spinner"></div>
        <span className="text-gray-700">{message}</span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* 步骤指示 */}
      <div className="text-sm text-gray-500">
        {currentStep + 1} / {totalSteps} 步骤
      </div>

      {/* 步骤详情 */}
      <div className="mt-4 flex justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep >= 0
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className={`text-sm ${
              currentStep >= 0 ? 'text-primary-600 font-medium' : 'text-gray-500'
            }`}>
              获取数据
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep >= 1
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className={`text-sm ${
              currentStep >= 1 ? 'text-primary-600 font-medium' : 'text-gray-500'
            }`}>
              AI分析
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep >= 2
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <span className={`text-sm ${
              currentStep >= 2 ? 'text-primary-600 font-medium' : 'text-gray-500'
            }`}>
              生成报告
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}