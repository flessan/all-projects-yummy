import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getArticle, saveArticle, type Article } from '../api';

export default function ArticleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    excerpt: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getArticle(id).then(article => {
        setFormData(article);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await saveArticle({ ...formData, id }); // id is undefined for new, present for edit
    navigate('/admin');
  };

  if (loading && id) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>{id ? 'Edit Article' : 'New Article'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            required 
          />
        </div>
        <div>
          <label>Excerpt</label>
          <input 
            type="text" 
            value={formData.excerpt} 
            onChange={e => setFormData({...formData, excerpt: e.target.value})} 
            required 
          />
        </div>
        <div>
          <label>Content</label>
          <textarea 
            value={formData.content} 
            onChange={e => setFormData({...formData, content: e.target.value})} 
            required 
          />
        </div>
        <button type="submit" disabled={loading} className="btn">
          {loading ? 'Saving...' : 'Save Article'}
        </button>
      </form>
    </div>
  );
}
