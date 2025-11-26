import { useState, useEffect } from 'react';
import './Supplies.css';

const API_BASE_URL = 'http://localhost:8000';

export default function Supplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [newSupply, setNewSupply] = useState({
    name: "",
    amount: "",
    unit: "g"
  });

  // Функция для загрузки запасов из API
  const fetchSupplies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:8000/reserves/display`, {
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

      if (Array.isArray(data)) {
        setSupplies(data);
      } else {
        setSupplies([]);
      }
    } catch (err) {
      console.error('Error fetching supplies:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Не удалось подключиться к серверу. Убедитесь, что сервер запущен и доступен.');
      } else {
        setError(err.message || 'Не удалось загрузить запасы. Попробуйте обновить страницу.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Загружаем запасы из API при монтировании компонента
  useEffect(() => {
    fetchSupplies();
  }, []);

  const handleAddSupply = async (e) => {
    e.preventDefault();
    if (newSupply.name.trim() === "" || !newSupply.amount) return;

    try {
      const response = await fetch('http://localhost:8000/reserves/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSupply.name,
          amount: parseInt(newSupply.amount) || 0
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при добавлении продукта');
      }

      setNewSupply({
        name: "",
        amount: ""
      });
      setShowAddForm(false);

      // Перезагружаем запасы из API
      await fetchSupplies();
    } catch (err) {
      console.error('Error adding supply:', err);
      alert('Ошибка при добавлении продукта: ' + err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSupply || editingSupply.name.trim() === "") return;

    try {
      const response = await fetch(`http://localhost:8000/reserves/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingSupply.name,
          amount: parseInt(editingSupply.amount) || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при обновлении продукта');
      }

      setEditingSupply(null);
      setIsEditMode(false);
      // Перезагружаем запасы из API
      await fetchSupplies();
    } catch (err) {
      console.error('Error updating supply:', err);
      alert('Ошибка при обновлении продукта: ' + err.message);
    }
  };

  const handleDeleteSupply = async () => {
    if (editingSupply && window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        const response = await fetch(`http://localhost:8000/reserves/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          name: editingSupply.name,
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Ошибка при удалении продукта');
        }

        setEditingSupply(null);
        setIsEditMode(false);
        // Перезагружаем запасы из API
        await fetchSupplies();
      } catch (err) {
        console.error('Error deleting supply:', err);
        alert('Ошибка при удалении продукта: ' + err.message);
      }
    }
  };

  const handleSupplyClick = (supply) => {
    if (isEditMode) {
      setEditingSupply({ ...supply });
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewSupply({
      name: "",
      amount: ""
    });
  };

  return (
    <div className="supplies-container">
      <div className="supplies-header">
        <h1>Учет запасов</h1>
      </div>

      {editingSupply && (
        <form className="add-supply-form edit-supply-form" onSubmit={handleSaveEdit}>
          <button
            type="button"
            className="close-form-button"
            onClick={() => {
              setEditingSupply(null);
              setIsEditMode(false);
            }}
          >
            ✕
          </button>
          <div className="supply-form-fields">
            <input
              type="text"
              placeholder="Название продукта"
              value={editingSupply.name}
              onChange={(e) => setEditingSupply({ ...editingSupply, name: e.target.value })}
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Количество (в граммах)"
              value={editingSupply.amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, '');
                setEditingSupply({ ...editingSupply, amount: value });
              }}
              required
            />
          </div>
          <div className="add-form-buttons">
            <button type="button" className="delete-supply-button" onClick={handleDeleteSupply}>
              Удалить продукт
            </button>
            <button type="submit" className="submit-button">Сохранить изменения</button>
          </div>
        </form>
      )}

      {showAddForm && !editingSupply && (
        <form className="add-supply-form" onSubmit={handleAddSupply}>
          <button
            type="button"
            className="close-form-button"
            onClick={handleCancelAdd}
          >
            ✕
          </button>
          <div className="supply-form-fields">
            <input
              type="text"
              placeholder="Название продукта"
              value={newSupply.name}
              onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Количество (в граммах)"
              value={newSupply.amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, '');
                setNewSupply({ ...newSupply, amount: value });
              }}
              required
            />
          </div>
          <div className="add-form-buttons">
            <button type="button" className="cancel-button" onClick={handleCancelAdd}>
              Отмена
            </button>
            <button type="submit" className="submit-button">Сохранить</button>
          </div>
        </form>
      )}

      {!editingSupply && (
        <>
          {isEditMode && (
            <div className="edit-mode-notice">
              Выберите продукт для редактирования
            </div>
          )}
          {loading && (
            <div className="loading-message">
              Загрузка запасов...
            </div>
          )}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchSupplies} className="retry-button">
                Попробовать снова
              </button>
            </div>
          )}
          {!loading && !error && (
            <div className="supplies-list-section">
              <h2 className="supplies-list-title">Мои продукты дома</h2>
              {supplies.length === 0 ? (
                <div className="empty-message">
                  Продукты не найдены. Добавьте первый продукт!
                </div>
              ) : (
                <div className="supplies-list">
                  {supplies.map(supply => (
                    <div
                      key={supply.id}
                      className={`supply-card ${isEditMode ? 'editable' : ''}`}
                      onClick={() => handleSupplyClick(supply)}
                    >
                      <div className="supply-content">
                        <span className="supply-name">{supply.name}</span>
                        <span className="supply-amount">{supply.amount} </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!editingSupply && (
        <div className="fixed-buttons">
          <button
            className="add-button-fixed"
            onClick={() => {
              if (!isEditMode && !editingSupply) {
                setShowAddForm(!showAddForm);
              }
            }}
            disabled={isEditMode || editingSupply}
          >
            {showAddForm ? 'Отмена' : 'Добавить продукт'}
          </button>
          <button
            className="edit-catalog-button"
            onClick={() => {
              if (!showAddForm && !editingSupply) {
                setIsEditMode(!isEditMode);
              }
            }}
            disabled={showAddForm || editingSupply}
          >
            {isEditMode ? 'Завершить редактирование' : 'Редактировать продукты'}
          </button>
        </div>
      )}
    </div>
  );
}
