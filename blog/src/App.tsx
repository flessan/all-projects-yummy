import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import AdminDashboard from './components/AdminDashboard';
import ArticleForm from './components/ArticleForm';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<ArticleList />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/new" element={<ArticleForm />} />
        <Route path="/admin/edit/:id" element={<ArticleForm />} />
      </Routes>
    </Router>
  );
}

export default App;