// 微信公众号相关类型定义

export interface WeChatAccount {
  name: string;
  wechatAppid: string;
  username: string;
  avatar: string;
  type: 'subscription' | 'service';
  verified: boolean;
  status: 'active' | 'revoked';
  lastAuthTime: string;
  createdAt: string;
}

export interface WeChatAccountsResponse {
  success: boolean;
  data?: {
    accounts: WeChatAccount[];
    total: number;
  };
  code?: string;
  error?: string;
}

export interface PublishRequest {
  wechatAppid: string;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  author?: string;
  contentFormat?: 'markdown' | 'html';
  articleType?: 'news' | 'newspic';
}

export interface PublishResponse {
  success: boolean;
  data?: {
    publicationId: string;
    materialId: string;
    mediaId: string;
    status: string;
    message: string;
  };
  error?: string;
  code?: string;
}

export interface PublishOptions {
  wechatAppid: string;
  articleType: 'news' | 'newspic';
}

export interface PublishRecord {
  id: string;
  articleId: string;
  platform: 'wechat';
  wechatAppid: string;
  wechatAccountName: string;
  articleType: 'news' | 'newspic';
  publicationId?: string;
  materialId?: string;
  mediaId?: string;
  status: 'pending' | 'published' | 'failed';
  errorMessage?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 发布进度状态
export type PublishStep = 'loading-accounts' | 'selecting-account' | 'publishing' | 'success' | 'error';

export interface PublishProgress {
  step: PublishStep;
  message: string;
  progress: number; // 0-100
  error?: string;
}

// 文章类型选项
export const ARTICLE_TYPE_OPTIONS = [
  { value: 'news', label: '普通文章', description: '标准的公众号文章格式，支持完整的HTML样式' },
  { value: 'newspic', label: '小绿书', description: '图文消息格式，以图片为主，文字为辅' }
] as const;

// 发布状态选项
export const PUBLISH_STATUS_OPTIONS = [
  { value: 'pending', label: '发布中', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'published', label: '已发布', color: 'bg-green-100 text-green-700' },
  { value: 'failed', label: '发布失败', color: 'bg-red-100 text-red-700' }
] as const;