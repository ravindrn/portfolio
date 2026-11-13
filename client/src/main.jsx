import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portfolio from './Portfolio.jsx';
import Admin from './admin/Admin.jsx';
import './styles.css';
import './admin/admin.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="*" element={<Portfolio />} />
    </Routes>
  </BrowserRouter>
);
