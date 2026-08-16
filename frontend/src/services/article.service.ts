import { api, unwrap } from "./api";
import type {
  Article,
  ArticleListParams,
  Comment,
  Paginated,
} from "@/types";

export const articleService = {
  list(params: ArticleListParams = {}) {
    return unwrap<Paginated<Article>>(
      api.get("/articles", { params: { pageSize: 12, ...params } })
    );
  },
  getBySlug(slug: string) {
    return unwrap<Article>(api.get(`/articles/${slug}`));
  },
  related(slug: string) {
    return unwrap<Article[]>(api.get(`/articles/${slug}/related`));
  },
  breaking() {
    return unwrap<Article[]>(api.get("/articles/breaking"));
  },
  featured(limit = 5) {
    return unwrap<Article[]>(api.get("/articles/featured", { params: { limit } }));
  },
  latest(limit = 12) {
    return unwrap<Article[]>(api.get("/articles/latest", { params: { limit } }));
  },
  popular(limit = 5) {
    return unwrap<Article[]>(api.get("/articles/popular", { params: { limit } }));
  },
  byCategory(slug: string, page = 1) {
    return unwrap<Paginated<Article>>(
      api.get(`/categories/${slug}/articles`, { params: { page } })
    );
  },
  byAuthor(authorId: number | string, page = 1) {
    return unwrap<Paginated<Article>>(
      api.get(`/authors/${authorId}/articles`, { params: { page, pageSize: 12 } })
    );
  },
  comments(articleId: number) {
    return unwrap<Comment[]>(api.get("/comments", { params: { articleId } }));
  },
  submitComment(payload: { articleId: number; name: string; email: string; content: string }) {
    return unwrap<Comment>(api.post("/comments", payload));
  },
};
