# 硅基流动图片生成API配置指南

## 概述

本指南将帮助您配置硅基流动(SiliconFlow)的图片生成API，以便在文章创作过程中自动生成配图。

## 配置步骤

### 1. 获取硅基流动API密钥

1. 访问 [硅基流动官网](https://siliconflow.cn/)
2. 注册账号并登录
3. 进入控制台，找到API密钥管理页面
4. 创建新的API密钥，记录下来

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入您的硅基流动API配置：

```env
# 硅基流动API配置 (用于图片生成)
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn
SILICONFLOW_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
SILICONFLOW_MAX_IMAGES_PER_REQUEST=5
SILICONFLOW_DEFAULT_STYLE=photorealistic
SILICONFLOW_IMAGE_QUALITY=standard

# 图片生成服务开关
NEXT_PUBLIC_IMAGE_GENERATION_ENABLED=true
```

### 3. 参数说明

#### 必填参数

- `SILICONFLOW_API_KEY`: 您的硅基流动API密钥

#### 可选参数

- `SILICONFLOW_BASE_URL`: API地址，默认为 `https://api.siliconflow.cn`
- `SILICONFLOW_IMAGE_MODEL`: 使用的图片生成模型，默认为 `black-forest-labs/FLUX.1-dev`
- `SILICONFLOW_MAX_IMAGES_PER_REQUEST`: 单次请求最大图片数量，默认为5
- `SILICONFLOW_DEFAULT_STYLE`: 默认图片风格，默认为 `photorealistic`
- `SILICONFLOW_IMAGE_QUALITY`: 图片质量，可选值为 `standard` 或 `high`
- `NEXT_PUBLIC_IMAGE_GENERATION_ENABLED`: 是否启用图片生成功能，设置为 `true` 启用

### 4. 支持的图片风格

- `photorealistic`: 真实照片风格
- `business`: 商务风格
- `lifestyle`: 生活化场景
- `illustration`: 插画风格
- `data-viz`: 信息图表

### 5. 支持的配图密度

- `sparse`: 稀疏配图（1-2张）
- `medium`: 适中配图（3-5张）
- `dense`: 密集配图（6-8张）

### 6. 支持的配图位置

- `after-paragraph`: 在每个主要段落后插入配图
- `after-section`: 在每个小章节后插入配图
- `mixed`: 混合布局，在段落后和章节后灵活插入配图

## 使用方法

1. 在内容创作页面，勾选"启用自动配图"
2. 选择您需要的配图参数：
   - 配图密度
   - 图片风格
   - 配图位置
   - 最大图片数量
3. 设置其他文章创作参数
4. 点击"开始创作"
5. AI将自动生成文章并插入配图占位符
6. 系统会自动调用硅基流动API生成实际图片

## 成本控制

- 图片生成会产生API调用费用
- 建议设置合理的 `SILICONFLOW_MAX_IMAGES_PER_REQUEST` 限制
- 系统会根据配图密度自动控制图片数量
- 可以在用户界面中设置最大图片数量限制

## 故障排除

### 常见问题

1. **API密钥无效**
   - 检查 `SILICONFLOW_API_KEY` 是否正确
   - 确认API密钥是否有效且未过期

2. **图片生成失败**
   - 检查网络连接
   - 确认API调用额度是否充足
   - 查看控制台错误日志

3. **配置不生效**
   - 确认 `.env.local` 文件存在
   - 重启开发服务器使配置生效

### 测试配置

您可以通过以下方式测试配置是否正确：

1. 访问内容创作页面
2. 查看控制台日志，确认图片生成服务配置状态
3. 尝试生成一篇带有配图的文章

## 安全注意事项

- 不要在代码中硬编码API密钥
- 使用 `.env.local` 文件存储敏感信息
- 将 `.env.local` 添加到 `.gitignore` 文件中
- 定期更新API密钥

## 支持的模型

当前支持的主要图片生成模型：

- `black-forest-labs/FLUX.1-dev` (默认)
- `stabilityai/stable-diffusion-xl-base-1.0`
- `stabilityai/stable-diffusion-2-1`

更多模型请参考硅基流动官方文档。