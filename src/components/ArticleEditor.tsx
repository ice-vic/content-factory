'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface ArticleEditorProps {
  value: string
  onChange: (content: string, htmlContent?: string) => void
  placeholder?: string
  className?: string
}

export default function ArticleEditor({
  value,
  onChange,
  placeholder = '开始编辑文章内容...',
  className = ''
}: ArticleEditorProps) {
  const quillRef = useRef<ReactQuill>(null)

  // 增强的工具栏配置，包含图片操作
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'code-block'
  ]

  // 处理图片上传
  const handleImageUpload = () => {
    // 检查是否在客户端环境
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          insertImage(imageUrl)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // 插入图片并设置默认居中
  const insertImage = (imageUrl: string) => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const range = quill.getSelection()
      const index = range?.index || 0

      // 创建居中的图片HTML
      const imageHtml = `
        <div style="text-align: center; margin: 1rem 0;">
          <img src="${imageUrl}"
               style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
               alt="图片" />
        </div>
      `

      quill.clipboard.dangerouslyPasteHTML(index, imageHtml)
    }
  }

  // 处理现有的生成图片
  const processExistingImages = () => {
    const quill = quillRef.current?.getEditor()
    if (quill && value) {
      // 检查是否有生成图片
      if (value.includes('class="generated-image"')) {
        // 处理生成图片，确保它们在编辑器中正常显示
        const processedContent = value.replace(
          /<div class="generated-image[^>]*>(.*?)<\/div>/g,
          (match, content) => {
            // 保持原有的图片结构，但确保可编辑
            return `<div class="generated-image" contenteditable="false">${content}</div>`
          }
        )

        if (processedContent !== value) {
          quill.root.innerHTML = processedContent
        }
      }
    }
  }

  // 初始化时处理现有图片
  useEffect(() => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const toolbar = quill.getModule('toolbar')
      if (toolbar) {
        toolbar.addHandler('image', handleImageUpload)
      }

      // 延迟处理现有图片，确保编辑器完全加载
      setTimeout(() => {
        processExistingImages()
      }, 100)
    }
  }, [])

  // 自定义onChange处理函数，防止页面跳转
  const handleChange = useCallback((content: string, delta: any, source: string, editor: any) => {
    if (source !== 'user') return // 只处理用户输入

    // 防止页面跳转到顶部
    const preventScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, window.scrollY)
      }
    }

    // 延迟调用防止滚动，延长延迟时间
    setTimeout(preventScroll, 50)

    // 获取HTML内容并传递给父组件
    const htmlContent = editor ? editor.root.innerHTML : content
    onChange(content, htmlContent)
  }, [onChange])

  // 监听value变化，确保内容同步
  useEffect(() => {
    if (value) {
      const quill = quillRef.current?.getEditor()
      if (quill) {
        // 检查内容是否需要更新
        const currentContent = quill.root.innerHTML
        if (currentContent !== value) {
          // 不要直接设置innerHTML，而是通过Quill的API设置内容
          if (quill.getText() === '' || !currentContent.includes(value)) {
            // 如果编辑器为空或者内容不匹配，设置新内容
            quill.clipboard.dangerouslyPasteHTML(value)
          }
          processExistingImages()
        }
      }
    }
  }, [value])

  return (
    <div className={`article-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          minHeight: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      />

      {/* 自定义样式 */}
      <style jsx global>{`
        .article-editor {
          position: relative;
        }

        .article-editor .ql-toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .article-editor .ql-container {
          border-top: none;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: white;
        }

        .article-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: block;
          margin: 1rem auto;
        }

        .article-editor .ql-editor .generated-image {
          margin: 1.5rem 0;
          text-align: center;
        }

        .article-editor .ql-editor .generated-image img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .article-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          background: #f1f5f9;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          color: #334155;
        }

        .article-editor .ql-editor pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .article-editor .ql-editor h1,
        .article-editor .ql-editor h2,
        .article-editor .ql-editor h3,
        .article-editor .ql-editor h4,
        .article-editor .ql-editor h5,
        .article-editor .ql-editor h6 {
          color: #1e293b;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .article-editor .ql-editor h1 { font-size: 2rem; }
        .article-editor .ql-editor h2 { font-size: 1.75rem; }
        .article-editor .ql-editor h3 { font-size: 1.5rem; }
        .article-editor .ql-editor h4 { font-size: 1.25rem; }
        .article-editor .ql-editor h5 { font-size: 1.125rem; }
        .article-editor .ql-editor h6 { font-size: 1rem; }

        .article-editor .ql-editor p {
          margin-bottom: 1rem;
          color: #374151;
        }

        /* 确保对齐功能正常工作 */
        .article-editor .ql-editor .ql-align-center {
          text-align: center;
        }

        .article-editor .ql-editor .ql-align-right {
          text-align: right;
        }

        .article-editor .ql-editor .ql-align-left {
          text-align: left;
        }

        .article-editor .ql-editor .ql-align-justify {
          text-align: justify;
        }

        /* 确保引用样式正确显示 */
        .article-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          background: #f1f5f9;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          color: #334155;
        }

        /* 确保代码块样式正确显示 */
        .article-editor .ql-editor pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
          font-family: 'Courier New', monospace;
          line-height: 1.5;
        }

        .article-editor .ql-editor code {
          background: #374151;
          color: #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .article-editor .ql-toolbar .ql-picker-label {
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
        }

        .article-editor .ql-toolbar button {
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          margin: 0 2px;
        }

        .article-editor .ql-toolbar button:hover {
          background: #e5e7eb;
        }

        .article-editor .ql-toolbar button.ql-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        /* 图片工具提示 */
        .article-editor .ql-tooltip {
          border-radius: 0.375rem;
          background: white;
          border: 1px solid #d1d5db;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .article-editor .ql-tooltip input {
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          padding: 0.5rem;
        }

        .article-editor .ql-tooltip a.ql-action {
          background: #3b82f6;
          color: white;
          border-radius: 0.25rem;
          padding: 0.5rem 1rem;
        }

        .article-editor .ql-tooltip a.ql-action:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  )
}