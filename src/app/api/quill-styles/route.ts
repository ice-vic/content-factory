import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  // 提供Quill编辑器的CSS样式
  const css = `
/* Quill Editor Styles */
.ql-container {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.42;
  height: 100%;
  box-sizing: border-box;
}

.ql-toolbar {
  font-family: inherit;
  font-size: 12px;
  line-height: 24px;
  padding: 8px;
  border: 1px solid #ccc;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  background: #f8fafc;
  box-sizing: border-box;
}

.ql-container {
  border: 1px solid #ccc;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  border-top: none;
  background: white;
}

.ql-editor {
  padding: 12px 15px;
  min-height: 200px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.ql-editor.ql-blank::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  font-style: italic;
}

/* Toolbar button styling */
.ql-toolbar button {
  margin: 1px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px;
  background: white;
}

.ql-toolbar button:hover {
  background: #f3f4f6;
}

.ql-toolbar button.ql-active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Dropdown styling */
.ql-toolbar .ql-picker {
  color: #374151;
}

.ql-toolbar .ql-picker-label {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 4px;
}

.ql-toolbar .ql-picker-options {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Content styling */
.ql-editor h1 { font-size: 2em; }
.ql-editor h2 { font-size: 1.5em; }
.ql-editor h3 { font-size: 1.17em; }
.ql-editor h4 { font-size: 1em; }
.ql-editor h5 { font-size: 0.83em; }
.ql-editor h6 { font-size: 0.75em; }

.ql-editor blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
  background: #f9fafb;
  padding: 0.5em 1em;
}

.ql-editor pre {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1em;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  margin: 1em 0;
}

.ql-editor code {
  background: #e5e7eb;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.ql-editor ul, .ql-editor ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.ql-editor li {
  margin-bottom: 0.25em;
}

.ql-editor a {
  color: #3b82f6;
  text-decoration: underline;
}

.ql-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}

/* Alignment */
.ql-editor .ql-align-center {
  text-align: center;
}

.ql-editor .ql-align-right {
  text-align: right;
}

.ql-editor .ql-align-justify {
  text-align: justify;
}

/* Font sizes */
.ql-editor .ql-size-small {
  font-size: 0.75em;
}

.ql-editor .ql-size-large {
  font-size: 1.5em;
}

.ql-editor .ql-size-huge {
  font-size: 2.5em;
}

/* Font families */
.ql-editor .ql-font-serif {
  font-family: Georgia, 'Times New Roman', serif;
}

.ql-editor .ql-font-monospace {
  font-family: 'Courier New', monospace;
}

/* Text colors and backgrounds */
.ql-editor .ql-color-red { color: #e60000; }
.ql-editor .ql-color-green { color: #00a02c; }
.ql-editor .ql-color-blue { color: #007bff; }
.ql-editor .ql-color-yellow { color: #ff0; }
.ql-editor .ql-color-gray { color: #6c757d; }

.ql-editor .ql-background-yellow { background-color: #ff0; }
.ql-editor .ql-background-green { background-color: #00ff00; }
.ql-editor .ql-background-blue { background-color: #007bff; }
.ql-editor .ql-background-gray { background-color: #6c757d; }
`

  return new Response(css, {
    status: 200,
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}