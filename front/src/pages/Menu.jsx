import { useState, useEffect, useCallback, useRef } from 'react';
import './Menu.css';

export default function Menu() {
  const [periodType, setPeriodType] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menuData, setMenuData] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipesError, setRecipesError] = useState(null);

  // useRef для отслеживания предыдущего значения menuData
  const previousMenuDataRef = useRef({});

  // Функция для отправки данных на сервер
  const sendDayToServer = useCallback(async (dateString, dayData) => {
    
    const day_number = dateString.substring(8, 10)
    try {
      const response = await fetch('http://localhost:8000/menu/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: dayData,
          day_number: day_number
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при добавлении продукта');
      }
      
      console.log('Данные успешно отправлены для дня:', dateString);
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  }, []);

  // Функция для загрузки рецептов из API
  const fetchRecipesFromAPI = useCallback(async () => {
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
      setRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setRecipesError(err.message || 'Не удалось загрузить рецепты');
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  // Загружаем меню и рецепты при монтировании
  useEffect(() => {
    const savedMenu = localStorage.getItem('menuData');
    if (savedMenu) {
      try {
        const parsedData = JSON.parse(savedMenu);
        setMenuData(parsedData);
        previousMenuDataRef.current = parsedData;
      } catch (error) {
        console.error('Error parsing saved menu data:', error);
        setMenuData({});
      }
    }
    
    fetchRecipesFromAPI();
  }, [fetchRecipesFromAPI]);

  // Сохраняем меню в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem('menuData', JSON.stringify(menuData));
    } catch (error) {
      console.error('Error saving menu data:', error);
    }
  }, [menuData]);

  // Отслеживание изменений menuData и отправка на сервер
  useEffect(() => {
    const previousMenuData = previousMenuDataRef.current;
    const currentMenuData = menuData;

    // Находим измененные дни
    const allDates = new Set([
      ...Object.keys(previousMenuData),
      ...Object.keys(currentMenuData)
    ]);

    allDates.forEach(dateString => {
      const previousDayData = previousMenuData[dateString];
      const currentDayData = currentMenuData[dateString];

      // Если день был добавлен или изменен
      if (JSON.stringify(previousDayData) !== JSON.stringify(currentDayData)) {
        // Если день был удален, отправляем null или пустой объект
        if (!currentDayData) {
          sendDayToServer(dateString, null);
        } else {
          sendDayToServer(dateString, currentDayData);
        }
      }
    });

    // Обновляем предыдущее значение
    previousMenuDataRef.current = currentMenuData;
  }, [menuData, sendDayToServer]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysArray = useCallback(() => {
    const days = [];
    const startDate = new Date(selectedDate);
    
    if (periodType === 'day') {
      days.push(new Date(startDate));
    } else if (periodType === 'week') {
      // Находим понедельник недели
      const dayOfWeek = startDate.getDay();
      const monday = new Date(startDate);
      monday.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        days.push(day);
      }
    } else {
      // Месяц: показываем весь месяц
      const firstDay = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      const current = new Date(firstDay);
      while (current <= lastDay) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days;
  }, [periodType, selectedDate]);

  const groupDaysByWeeks = useCallback((days) => {
    const weeks = [];
    let currentWeek = [];
    
    days.forEach((day, index) => {
      // Начинаем новую неделю в понедельник или если неделя пустая
      if (day.getDay() === 1 || currentWeek.length === 0) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
      
      // Добавляем последнюю неделю в конце
      if (index === days.length - 1) {
        weeks.push(currentWeek);
      }
    });
    
    return weeks;
  }, []);

  const mealTypes = [
    { key: 'breakfast', label: 'Завтрак' },
    { key: 'lunch', label: 'Обед' },
    { key: 'dinner', label: 'Ужин' }
  ];

  const addRecipeToDay = useCallback((dateString, mealType, recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    setMenuData(prev => {
      const newData = { ...prev };
      if (!newData[dateString]) {
        newData[dateString] = { breakfast: [], lunch: [], dinner: [] };
      }
      
      // Создаем копию массива, если он существует, или пустой массив
      const currentRecipes = newData[dateString][mealType] 
        ? [...newData[dateString][mealType]] 
        : [];
      
      // Проверяем, не добавлен ли уже этот рецепт
      const isAlreadyAdded = currentRecipes.some(r => r.id === recipeId);
      if (!isAlreadyAdded) {
        currentRecipes.push(recipe);
        newData[dateString][mealType] = currentRecipes;
      }
      
      return newData;
    });
    setShowRecipeSelector(null);
  }, [recipes]);

  const removeRecipeFromDay = useCallback((dateString, mealType, recipeId) => {
    setMenuData(prev => {
      const newData = { ...prev };
      if (newData[dateString] && newData[dateString][mealType]) {
        newData[dateString][mealType] = newData[dateString][mealType].filter(r => r.id !== recipeId);
        
        // Очищаем пустые массивы и объекты
        if (newData[dateString][mealType].length === 0) {
          delete newData[dateString][mealType];
        }
        if (Object.keys(newData[dateString]).length === 0) {
          delete newData[dateString];
        }
      }
      return newData;
    });
  }, []);

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
    
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()}—${last.getDate()} ${getMonthName(first)}`;
    } else {
      return `${first.getDate()} ${getMonthName(first)} — ${last.getDate()} ${getMonthName(last)}`;
    }
  };

  const handlePeriodChange = (newPeriodType) => {
    setPeriodType(newPeriodType);
    // При переключении на неделю сбрасываем на текущую неделю
    if (newPeriodType === 'week') {
      setSelectedDate(new Date());
    }
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
            onClick={() => handlePeriodChange('day')}
          >
            День
          </button>
          <button
            className={periodType === 'week' ? 'active' : ''}
            onClick={() => handlePeriodChange('week')}
          >
            Неделя
          </button>
          <button
            className={periodType === 'month' ? 'active' : ''}
            onClick={() => handlePeriodChange('month')}
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
                        const dayData = menuData[dateString] || {};
                        const mealRecipes = dayData[mealType.key] || [];
                        
                        return (
                          <td key={dayIndex} className="meal-cell">
                            <div className="meal-recipes">
                              {mealRecipes.map((recipe, recipeIndex) => (
                                <div key={`${recipe.id}-${recipeIndex}`} className="meal-recipe-card">
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
                      onClick={() => addRecipeToDay(
                        showRecipeSelector.dateString, 
                        showRecipeSelector.mealType, 
                        recipe.id
                      )}
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