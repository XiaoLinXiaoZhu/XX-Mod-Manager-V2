/**
 * 图片处理类型定义
 */

// 更精确的类型定义
export type FilePath = string;
export type HttpUrl = string;
export type BlobUrl = string;
export type Base64DataUrl = string;
export type ImageUrl = BlobUrl | Base64DataUrl | HttpUrl;

// 路径或URL的联合类型
export type PathOrUrl = FilePath | HttpUrl;

// URL类型枚举
export type UrlType = "blob" | "http" | "base64" | "pathOrUnknown";

// 空图片的 Base64 Data URL
export const EmptyImage: Base64DataUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
