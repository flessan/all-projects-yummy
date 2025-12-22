import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArticle, type Article } from '../api';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getArticle(id).then(setArticle).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div className="container">
      <h1>{article.title}</h1>
      <small>{new Date(article.createdAt).toLocaleDateString()}</small>
      <div style={{ marginTop: '2rem', whiteSpace: 'pre-wrap' }}>
        {article.content}
      </div>
    </div>
  );
}
