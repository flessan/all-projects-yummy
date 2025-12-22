import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, deleteArticle, type Article } from '../api';

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    getArticles().then(setArticles).finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await deleteArticle(id);
      fetchArticles();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <Link to="/admin/new" className="btn">Create New Article</Link>
      </div>
      
      {articles.map(article => (
        <div key={article.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>{article.title}</h3>
            <small>{new Date(article.createdAt).toLocaleDateString()}</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/admin/edit/${article.id}`} className="btn">Edit</Link>
            <button onClick={() => handleDelete(article.id)} className="btn btn-danger">Delete</button>
          </div>
        </div>
      ))}
       {articles.length === 0 && <p>No articles found. Create one!</p>}
    </div>
  );
}
