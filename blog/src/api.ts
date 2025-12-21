export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: string;
}

export const getArticles = async (): Promise<Article[]> => {
  const res = await fetch('/api/articles');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export const getArticle = async (id: string): Promise<Article> => {
  const res = await fetch(`/api/articles?id=${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
};

export const saveArticle = async (article: Partial<Article>) => {
  const res = await fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
  });
  return res.json();
};

export const deleteArticle = async (id: string) => {
  await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
};
