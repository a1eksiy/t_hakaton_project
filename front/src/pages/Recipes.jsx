import { useState, useEffect } from 'react';
import './Recipes.css';

export default function Recipes() { 
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для загрузки рецептов из API
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/receipts/display', {
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
        setRecipes(data);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Не удалось подключиться к серверу. Убедитесь, что сервер запущен и доступен.');
      } else {
        setError(err.message || 'Не удалось загрузить рецепты. Попробуйте обновить страницу.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Загружаем рецепты из API при монтировании компонента
  useEffect(() => {
    fetchRecipes();
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    ingredients: [
      { name: "", amount: "", unit: "г" },
      { name: "", amount: "", unit: "г" },
      { name: "", amount: "", unit: "г" }
    ]
  });

  const handleAddIngredient = (isEditing = false) => {
    if (isEditing && editingRecipe) {
      setEditingRecipe({
        ...editingRecipe,
        ingredients: [...editingRecipe.ingredients, { name: "", amount: "", unit: "г" }]
      });
    } else {
      setNewRecipe({
        ...newRecipe,
        ingredients: [...newRecipe.ingredients, { name: "", amount: "", unit: "г" }]
      });
    }
  };

  const handleRemoveIngredient = (index, isEditing = false) => {
    if (isEditing && editingRecipe) {
      const updatedIngredients = editingRecipe.ingredients.filter((_, i) => i !== index);
      setEditingRecipe({
        ...editingRecipe,
        ingredients: updatedIngredients
      });
    } else {
      const updatedIngredients = newRecipe.ingredients.filter((_, i) => i !== index);
      setNewRecipe({
        ...newRecipe,
        ingredients: updatedIngredients
      });
    }
  };

  const handleIngredientChange = (index, field, value, isEditing = false) => {
    if (isEditing && editingRecipe) {
      const updatedIngredients = [...editingRecipe.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      };
      setEditingRecipe({
        ...editingRecipe,
        ingredients: updatedIngredients
      });
    } else {
      const updatedIngredients = [...newRecipe.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      };
      setNewRecipe({
        ...newRecipe,
        ingredients: updatedIngredients
      });
    }
  };

  const handleRecipeClick = (recipe) => {
    if (isEditMode) {
      setEditingRecipe({ ...recipe });
    } else {
      setViewingRecipe(recipe);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecipe || editingRecipe.name.trim() === "") return;
    
    const filteredIngredients = editingRecipe.ingredients.filter(
      ing => ing.name.trim() !== ""
    ).map(ing => ({
      name: ing.name,
      amount: parseInt(ing.amount) || 0,
      unit: ing.unit || "г"
    }));
    
    try {
      const response = await fetch(`http://localhost:8000/receipts/update/${editingRecipe.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingRecipe.name,
          ingredients: filteredIngredients
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при обновлении рецепта');
      }
      
      setEditingRecipe(null);
      setIsEditMode(false);
      // Перезагружаем рецепты из API
      await fetchRecipes();
    } catch (err) {
      console.error('Error updating recipe:', err);
      alert('Ошибка при обновлении рецепта: ' + err.message);
    }
  };

  const handleDeleteRecipe = async () => {
    if (editingRecipe && window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      try {
        const response = await fetch(`http://localhost:8000/receipts/delete/${editingRecipe.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Ошибка при удалении рецепта');
        }
        
        setEditingRecipe(null);
        setIsEditMode(false);
        // Перезагружаем рецепты из API
        await fetchRecipes();
      } catch (err) {
        console.error('Error deleting recipe:', err);
        alert('Ошибка при удалении рецепта: ' + err.message);
      }
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (newRecipe.name.trim() === "") return;
    
    const filteredIngredients = newRecipe.ingredients.filter(
      ing => ing.name.trim() !== ""
    ).map(ing => ({
      name: ing.name,
      amount: parseInt(ing.amount) || 0,
    }));
    
    try {
      const response = await fetch('http://localhost:8000/receipts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: filteredIngredients
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при добавлении рецепта');
      }
      
      setNewRecipe({
        name: "",
        ingredients: [
          { name: "", amount: "", unit: "g" },
          { name: "", amount: "", unit: "g" },
          { name: "", amount: "", unit: "g" }
        ]
      });
      setShowAddForm(false);
      
      // Перезагружаем рецепты из API
      await fetchRecipes();
    } catch (err) {
      console.error('Error adding recipe:', err);
      alert('Ошибка при добавлении рецепта: ' + err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewRecipe({
      name: "",
      ingredients: [
        { name: "", amount: "", unit: "g" },
        { name: "", amount: "", unit: "g" },
        { name: "", amount: "", unit: "g" }
      ]
    });
  };

  return (
    <div className="recipes-container">
      <div className="recipes-header">
        <h1>Каталог рецептов</h1>
      </div>

      {editingRecipe && (
        <form className="add-recipe-form edit-recipe-form" onSubmit={handleSaveEdit}>
          <button 
            type="button" 
            className="close-form-button"
            onClick={() => {
              setEditingRecipe(null);
              setIsEditMode(false);
            }}
          >
            ✕
          </button>
          <input
            type="text"
            placeholder="Название рецепта"
            value={editingRecipe.name}
            onChange={(e) => setEditingRecipe({...editingRecipe, name: e.target.value})}
            required
          />
          <div className="ingredients-form">
            <h3>Ингредиенты:</h3>
            {editingRecipe.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  placeholder="Название ингредиента"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value, true)}
                />
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Количество"
                    value={ingredient.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      handleIngredientChange(index, 'amount', value, true);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="remove-ingredient-button"
                  onClick={() => handleRemoveIngredient(index, true)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="add-ingredient-button"
              onClick={() => handleAddIngredient(true)}
            >
              + Добавить ингредиент
            </button>
          </div>
          <div className="add-form-buttons">
            <button type="button" className="delete-recipe-button" onClick={handleDeleteRecipe}>
              Удалить рецепт
            </button>
            <button type="submit" className="submit-button">Сохранить изменения</button>
          </div>
        </form>
      )}

      {showAddForm && !editingRecipe && (
        <form className="add-recipe-form" onSubmit={handleAddRecipe}>
          <input
            type="text"
            placeholder="Название рецепта"
            value={newRecipe.name}
            onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
            required
          />
          <div className="ingredients-form">
            <h3>Ингредиенты:</h3>
            {newRecipe.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  placeholder="Название ингредиента"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                />
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Количество"
                    value={ingredient.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      handleIngredientChange(index, 'amount', value);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="remove-ingredient-button"
                  onClick={() => handleRemoveIngredient(index, false)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="add-ingredient-button"
              onClick={handleAddIngredient}
            >
              + Добавить ингредиент
            </button>
          </div>
          <div className="add-form-buttons">
            <button type="button" className="cancel-button" onClick={handleCancelAdd}>
              Отмена
            </button>
            <button type="submit" className="submit-button">Сохранить</button>
          </div>
        </form>
      )}

      {viewingRecipe && (
        <div className="recipe-view-overlay">
          <div className="recipe-view-content">
            <button 
              className="close-view-button"
              onClick={() => setViewingRecipe(null)}
            >
              ✕
            </button>
            <h1>{viewingRecipe.name}</h1>
            <div className="view-ingredients-list">
              <h2>Ингредиенты:</h2>
              {viewingRecipe.ingredients && viewingRecipe.ingredients.map((ingredient, index) => (
                <div key={index} className="view-ingredient-item">
                  <span className="view-ingredient-name">{ingredient.name}</span>
                  <span className="view-ingredient-amount">{ingredient.amount} {ingredient.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!editingRecipe && !viewingRecipe && (
        <>
          {isEditMode && (
            <div className="edit-mode-notice">
              Выберите рецепт для редактирования
            </div>
          )}
          {loading && (
            <div className="loading-message">
              Загрузка рецептов...
            </div>
          )}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchRecipes} className="retry-button">
                Попробовать снова
              </button>
            </div>
          )}
          {!loading && !error && (
            <div className="recipes-list">
              {recipes.length === 0 ? (
                <div className="empty-message">
                  Рецепты не найдены. Добавьте первый рецепт!
                </div>
              ) : (
                recipes.map(recipe => 
                  { 
                    return( <div 
                    key={recipe.id} 
                    className={`recipe-card ${isEditMode ? 'editable' : 'clickable'}`}
                    onClick={() => handleRecipeClick(recipe)}
                  >
                    <div className="recipe-content">
                      <h2>{recipe.name}</h2>
                      <div className="ingredients-list">
                        {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="ingredient-item">
                            <span className="ingredient-name">{ingredient.name}</span>
                            <span className="ingredient-grams">{ingredient.amount} {ingredient.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>)}
                )
              )}
            </div>
          )}
        </>
      )}

      {!editingRecipe && !viewingRecipe && (
        <div className="fixed-buttons">
          <button 
            className="add-button-fixed" 
            onClick={() => {
              if (!isEditMode && !editingRecipe) {
                setShowAddForm(!showAddForm);
              }
            }}
            disabled={isEditMode || editingRecipe}
          >
            {showAddForm ? 'Отмена' : 'Добавить рецепт'}
          </button>
          <button 
            className="edit-catalog-button" 
            onClick={() => {
              if (!showAddForm && !editingRecipe) {
                setIsEditMode(!isEditMode);
              }
            }}
            disabled={showAddForm || editingRecipe}
          >
            {isEditMode ? 'Завершить редактирование' : 'Редактировать каталог'}
          </button>
        </div>
      )}
    </div>
  );
}
