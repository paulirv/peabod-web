// Shared types for peabod.com

export interface Article {
  id: number;
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string; // ISO date string
  image?: string; // R2 object key, e.g., "images/2026/01/my-image.jpg"
  updated_at: string;
  published: boolean;
  created_at: string;
  tags?: Tag[];
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  updated_at: string;
  published: boolean;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleTag {
  article_id: number;
  tag_id: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Create/Update DTOs
export interface CreateArticle {
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  image?: string;
  published?: boolean;
  tag_ids?: number[];
}

export interface UpdateArticle {
  slug?: string;
  title?: string;
  body?: string;
  author?: string;
  authored_on?: string;
  image?: string;
  published?: boolean;
  tag_ids?: number[];
}

export interface CreatePage {
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  published?: boolean;
}

export interface UpdatePage {
  slug?: string;
  title?: string;
  body?: string;
  author?: string;
  authored_on?: string;
  published?: boolean;
}

export interface CreateTag {
  name: string;
  slug: string;
}
