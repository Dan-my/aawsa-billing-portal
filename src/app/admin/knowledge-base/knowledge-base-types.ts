
export interface KnowledgeBaseArticle {
  id: number;
  created_at: string;
  title: string;
  content: string;
  category?: string;
  keywords?: string[];
}

export type KnowledgeBaseArticleInsert = Omit<KnowledgeBaseArticle, 'id' | 'created_at'>;
export type KnowledgeBaseArticleUpdate = Partial<KnowledgeBaseArticleInsert>;
