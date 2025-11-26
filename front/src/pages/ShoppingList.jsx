import { useState, useEffect } from 'react';
import './ShoppingList.css';

export default function ShoppingList() {
  const [buylist, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchShoppingList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/shopping_list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Ошибка сервера (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      // API теперь возвращает данные в правильном формате
      if (Array.isArray(data)) {
        setShoppingList(data);
      } else {
        setShoppingList([]);
      }
    } catch (err) {
      console.error('Error fetching shoppinglist:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Не удалось подключиться к серверу. Убедитесь, что сервер запущен и доступен.');
      } else {
        setError(err.message || 'Не удалось загрузить рецепты. Попробуйте обновить страницу.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, []);

  return (
    <div className = "buylist-container">
      <div className = "buylist-header">
        <h1>Список покупок</h1>
      </div>
      <div className="buylist-list">
        {buylist.length === 0 ? (
          <div className="empty-message">
            Ничего не требуется покупать
          </div>
        ) : (
          buylist.map(buylist => 
            { 
              return( <div 
              key={buylist.id} 
              className={`buylist-card`}
            >
              <div className="buylist-content">
                <h2>{buylist.name}</h2>
                <div className="ingredients-list">
                  {buylist.ingredients && buylist.ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-item">
                      <span className="ingredient-grams">{ingredient.amount}</span>
                      <span className="buylist-unit">{ingredient.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>)}
          )
        )}
      </div>
    </div>
  );
}
