import { useState, useEffect, useCallback } from 'react';
import './Menu.css';

export default function Menu() {
  const [periodType, setPeriodType] = useState('week'); // 'day', 'week', or 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menuData, setMenuData] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(null); // { dateString, mealType }
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipesError, setRecipesError] = useState(null);

  // Функция для загрузки рецептов из API
  const fetchRecipesFromAPI = async () => {
    try {
      setLoadingRecipes(true);
      setRecipesError(null);
      
      const response = await fetch('http://localhost:8000/menu/display', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка сервера (${response.status})`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRecipes(data);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setRecipesError(err.message || 'Не удалось загрузить рецепты');
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    // Загружаем меню из localStorage
    const savedMenu = localStorage.getItem('menuData');
    if (savedMenu) {
      setMenuData(JSON.parse(savedMenu));
    }
  }, []);

  // Загружаем рецепты из API при открытии селектора
  useEffect(() => {
    if (showRecipeSelector) {
      fetchRecipesFromAPI();
    }
  }, [showRecipeSelector]);

  useEffect(() => {
    // Сохраняем меню в localStorage при изменении
    localStorage.setItem('menuData', JSON.stringify(menuData));
  }, [menuData]);

  useEffect(() => {
    // При переключении на неделю устанавливаем сегодняшнюю дату
    if (periodType === 'week') {
      setSelectedDate(new Date());
    }
  }, [periodType]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysArray = () => {
    const days = [];
    const startDate = new Date(selectedDate);
    
    if (periodType === 'day') {
      days.push(new Date(startDate));
    } else if (periodType === 'week') {
      // Неделя начинается с выбранной даты (сегодня)
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
      }
    } else {
      // Месяц вперед
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const current = new Date(startDate);
      while (current < endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days;
  };

  const groupDaysByWeeks = (days) => {
    const weeks = [];
    let currentWeek = [];
    
    days.forEach((day, index) => {
      const dayOfWeek = day.getDay();
      
      if (dayOfWeek === 1 || currentWeek.length === 0) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
      
      if (index === days.length - 1) {
        weeks.push(currentWeek);
      }
    });
    
    return weeks;
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Завтрак' },
    { key: 'lunch', label: 'Обед' },
    { key: 'dinner', label: 'Ужин' }
  ];

  const addRecipeToDay = useCallback((dateString, mealType, recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    console.log(dateString)
    if (!recipe) return;

    setMenuData(prev => {
      const newData = { ...prev };
      if (!newData[dateString]) {
        newData[dateString] = { breakfast: [], lunch: [], dinner: [] };
      }
      if (!newData[dateString][mealType]) {
        newData[dateString][mealType] = [];
      }
      
      // Проверяем, не добавлен ли уже этот рецепт
      const isAlreadyAdded = newData[dateString][mealType].some(r => r.id === recipeId);
      if (!isAlreadyAdded) {
        newData[dateString][mealType] = [...newData[dateString][mealType], recipe];
      }
      
      return newData;
    });
    setShowRecipeSelector(null);
  }, [recipes]);

  const removeRecipeFromDay = (dateString, mealType, recipeId) => {
    setMenuData(prev => {
      const newData = { ...prev };
      if (newData[dateString] && newData[dateString][mealType]) {
        newData[dateString][mealType] = newData[dateString][mealType].filter(r => r.id !== recipeId);
        if (newData[dateString][mealType].length === 0) {
          delete newData[dateString][mealType];
        }
        // Удаляем день, если все приемы пищи пусты
        if (Object.keys(newData[dateString]).length === 0) {
          delete newData[dateString];
        }
      }
      return newData;
    });
  };

  const getDayName = (date) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
  };

  const getDayShortName = (date) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const getMonthName = (date) => {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return months[date.getMonth()];
  };

  const getWeekRange = (weekDays) => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[weekDays.length - 1];
    return `${first.getDate()}—${last.getDate()} ${getMonthName(first)}`;
  };

  const days = getDaysArray();
  const weeks = periodType === 'month' ? groupDaysByWeeks(days) : [days];

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Меню</h1>
        <div className="period-selector">
          <button
            className={periodType === 'day' ? 'active' : ''}
            onClick={() => setPeriodType('day')}
          >
            День
          </button>
          <button
            className={periodType === 'week' ? 'active' : ''}
            onClick={() => setPeriodType('week')}
          >
            Неделя
          </button>
          <button
            className={periodType === 'month' ? 'active' : ''}
            onClick={() => setPeriodType('month')}
          >
            Месяц
          </button>
        </div>
        {periodType === 'day' && (
          <input
            type="date"
            value={formatDate(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="date-input"
          />
        )}
        {periodType === 'week' && (
          <div className="week-range-display">
            {weeks.length > 0 && weeks[0].length > 0 && (
              <span className="week-range-text">{getWeekRange(weeks[0])}</span>
            )}
            <input
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="date-input"
            />
          </div>
        )}
        {periodType === 'month' && (
          <input
            type="month"
            value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedDate(new Date(year, month - 1, 1));
            }}
            className="date-input"
          />
        )}
      </div>

      <div className="weeks-container">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="week-section">
            {periodType === 'month' && (
              <h2 className="week-title">{getWeekRange(week)}</h2>
            )}
            <div className="menu-table-wrapper">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th className="meal-type-header"></th>
                    {week.map((day, dayIndex) => (
                      <th key={dayIndex} className="day-header-cell">
                        <div className="day-header-content">
                          <span className="day-name">{getDayShortName(day)}</span>
                          <span className="day-date">{day.getDate()} {getMonthName(day).substring(0, 3)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mealTypes.map((mealType) => (
                    <tr key={mealType.key}>
                      <td className="meal-type-cell">{mealType.label}</td>
                      {week.map((day, dayIndex) => {
                        const dateString = formatDate(day);
                        const dayData = menuData[dateString] || { breakfast: [], lunch: [], dinner: [] };
                        const mealRecipes = dayData[mealType.key] || [];
                        
                        return (
                          <td key={dayIndex} className="meal-cell">
                            <div className="meal-recipes">
                              {mealRecipes.map((recipe, recipeIndex) => (
                                <div key={recipeIndex} className="meal-recipe-card">
                                  <span className="recipe-name">{recipe.name}</span>
                                  <button
                                    className="remove-recipe-button"
                                    onClick={() => removeRecipeFromDay(dateString, mealType.key, recipe.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                className="add-recipe-button"
                                onClick={() => setShowRecipeSelector({ dateString, mealType: mealType.key })}
                              >
                                + Добавить рецепт
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {showRecipeSelector && (
        <div className="recipe-selector-overlay">
          <div className="recipe-selector-content">
            <div className="recipe-selector-header">
              <h2>Выберите рецепт</h2>
              <button
                className="close-selector-button"
                onClick={() => {
                  setShowRecipeSelector(null);
                  setRecipesError(null);
                }}
              >
                ✕
              </button>
            </div>
            {loadingRecipes && (
              <div className="recipes-loading">
                Загрузка рецептов...
              </div>
            )}
            {recipesError && (
              <div className="recipes-error">
                <p>{recipesError}</p>
                <button onClick={fetchRecipesFromAPI} className="retry-button">
                  Попробовать снова
                </button>
              </div>
            )}
            {!loadingRecipes && !recipesError && (
              <div className="recipes-selector-list">
                {recipes.length === 0 ? (
                  <div className="no-recipes-message">
                    Рецепты не найдены. Добавьте рецепты в каталоге рецептов.
                  </div>
                ) : (
                  recipes.map(recipe => (
                    <div
                      key={recipe.id}
                      className="recipe-selector-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addRecipeToDay(showRecipeSelector.dateString, showRecipeSelector.mealType, recipe.id);
                      }}
                    >
                      <span>{recipe.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
