import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import Menu from './pages/Menu';
import ShoppingList from './pages/ShoppingList';
import Supplies from './pages/Supplies';

export default function App(){
  return(
    <Router>
      <div className="app-container">
        <div className="top-navbar">
          <Link to="/" className="site-title">GLAKS</Link>
          <div className="nav-functions">
            <Link to="/menu" className="nav-link">Меню</Link>
            <Link to="/recipes" className="nav-link">Каталог рецептов</Link>
            <Link to="/shopping-list" className="nav-link">Список покупок</Link>
            <Link to="/reserves" className="nav-link">Запасы</Link>
          </div>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/reserves" element={<Supplies />} />
          </Routes>
        </div>
        <div className="bottom-line"></div>
      </div>
    </Router>
  );
}