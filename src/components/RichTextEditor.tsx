'use client'

import { useState, useEffect, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '开始编辑文章内容...',
  readOnly = false,
  className = ''
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null)

  // 自定义工具栏配置
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  }

  // 自定义格式配置
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
          const quill = quillRef.current?.getEditor()
          if (quill) {
            const range = quill.getSelection()
            quill.insertEmbed(range?.index || 0, 'image', imageUrl)
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // 自定义图片处理
  useEffect(() => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const toolbar = quill.getModule('toolbar')
      if (toolbar) {
        toolbar.addHandler('image', handleImageUpload)
      }
    }
  }, [])

  // 处理图片对齐功能
  const insertAlignedImage = (imageUrl: string, alignment: 'left' | 'center' | 'right') => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const range = quill.getSelection()
      const index = range?.index || 0

      let imageHtml = `<img src="${imageUrl}" style="max-width: 100%; height: auto;"`

      switch (alignment) {
        case 'center':
          imageHtml += ' style="display: block; margin: 0 auto;"'
          break
        case 'left':
          imageHtml += ' style="float: left; margin-right: 1rem;"'
          break
        case 'right':
          imageHtml += ' style="float: right; margin-left: 1rem;"'
          break
      }

      imageHtml += '>'

      quill.clipboard.dangerouslyPasteHTML(index, imageHtml)
    }
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          minHeight: '300px',
          maxHeight: '600px',
          overflow: 'auto'
        }}
      />

      {/* 自定义样式 */}
      <style jsx>{`
        .rich-text-editor :global(.ql-editor) {
          font-size: 16px;
          line-height: 1.6;
          padding: 1rem;
        }

        .rich-text-editor :global(.ql-toolbar) {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .rich-text-editor :global(.ql-container) {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: white;
        }

        .rich-text-editor :global(.ql-editor img) {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .rich-text-editor :global(.ql-editor blockquote) {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          background: #f8fafc;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
        }

        .rich-text-editor :global(.ql-editor pre) {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  )
}