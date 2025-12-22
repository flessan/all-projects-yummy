import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, type Article } from '../api';

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles().then(setArticles).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>Blog Posts</h1>
      {articles.map(article => (
        <div key={article.id} className="card">
          <h2>{article.title}</h2>
          <small>{new Date(article.createdAt).toLocaleDateString()}</small>
          <p>{article.excerpt}</p>
          <Link to={`/article/${article.id}`} className="btn">Read More</Link>
        </div>
      ))}
      {articles.length === 0 && <p>No articles found.</p>}
    </div>
  );
}
