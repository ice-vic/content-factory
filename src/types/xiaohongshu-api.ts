// 小红书API响应类型定义

export interface XiaohongshuApiResponse {
  code: number;
  cost: number;
  has_more: boolean;
  items: XiaohongshuApiItem[];
  remain_money: number;
  [property: string]: any;
}

export interface XiaohongshuApiItem {
  id: string;
  model_type: string;
  note_card?: XiaohongshuNoteCard;
  xsec_token: string;
  [property: string]: any;
}

export interface XiaohongshuNoteCard {
  corner_tag_info: XiaohongshuCornerTagInfo[];
  cover: XiaohongshuCover;
  display_title?: string;
  image_list: XiaohongshuImageList[];
  interact_info: XiaohongshuInteractInfo;
  type: string;
  user: XiaohongshuUser;
  [property: string]: any;
}

export interface XiaohongshuCornerTagInfo {
  text: string;
  type: string;
  [property: string]: any;
}

export interface XiaohongshuCover {
  height: number;
  url_default: string;
  url_pre: string;
  width: number;
  [property: string]: any;
}

export interface XiaohongshuImageList {
  height: number;
  info_list: XiaohongshuInfoList[];
  width: number;
  [property: string]: any;
}

export interface XiaohongshuInfoList {
  image_scene: string;
  url: string;
  [property: string]: any;
}

export interface XiaohongshuInteractInfo {
  collected: boolean;
  collected_count: string;
  comment_count: string;
  liked: boolean;
  liked_count: string;
  shared_count: string;
  [property: string]: any;
}

export interface XiaohongshuUser {
  avatar: string;
  nick_name: string;
  nickname: string;
  user_id: string;
  xsec_token: string;
  [property: string]: any;
}