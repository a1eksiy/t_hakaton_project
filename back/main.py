from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
from db import add_receipt, del_receipt, get_receipts
from buylist import count_ingredients
from menu import add_to_menu
from reserves import add_to_reserves, del_from_reserves, update_ingredient_in_reserves


app = FastAPI()
database = "hakaton.db"
user_id = 2

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Connected to FastAPI"}


@app.get("/receipts/display")
def display_receipts():
    try:
        connection = sqlite3.connect(database)
        cursor = connection.cursor()
        data = get_receipts(cursor, 2)
        return data
    except sqlite3.Error as error:
        return HTTPException(
            status_code=500, detail="Error occured when connecting to the database"
        )
    finally:
        connection.close()


@app.post("/receipts/add")
async def add_receipt_endpoint(request: Request):
    connection = None
    try:
        request_data = await request.json()
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        name_receipt = request_data.get("name", "")
        ingredients_list = request_data.get("ingredients", [])

        # Преобразуем список ингредиентов в словарь для БД
        ingredients_dict = {}
        for ing in ingredients_list:
            if ing.get("name", "").strip():
                ingredients_dict[ing["name"]] = int(ing.get("amount", 0)) or 0

        # Используем функцию из db.py
        add_receipt(cursor, name_receipt, ingredients_dict, user_id)
        connection.commit()

        return {"message": "Receipt successfully added!", "status": "success"}
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error occurred when adding receipt: {str(e)}"
        )
    finally:
        if connection:
            connection.close()


@app.put("/receipts/update/{recipe_id}")
async def update_receipt_endpoint(recipe_id: int, request: Request):
    connection = None
    try:
        request_data = await request.json()
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        # Проверяем существование рецепта
        cursor.execute("SELECT id FROM receipts WHERE id=?", (recipe_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Recipe not found")

        name_receipt = request_data.get("name", "")
        ingredients_list = request_data.get("ingredients", [])

        # Преобразуем список ингредиентов в словарь для БД
        ingredients_dict = {}
        for ing in ingredients_list:
            if ing.get("name", "").strip():
                ingredients_dict[ing["name"]] = int(ing.get("amount", 0)) or 0

        # Обновляем название
        if name_receipt:
            cursor.execute(
                "UPDATE receipts SET name_of_receipt = ? WHERE id = ?",
                (name_receipt, recipe_id),
            )

        # Обновляем ингредиенты
        ingredients_json = json.dumps(ingredients_dict)
        cursor.execute(
            "UPDATE receipts SET ingredients = ? WHERE id = ?",
            (ingredients_json, recipe_id),
        )

        connection.commit()
        return {"message": "Receipt successfully updated!", "status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error occurred when updating receipt: {str(e)}"
        )
    finally:
        if connection:
            connection.close()


@app.delete("/receipts/delete/{recipe_id}")
def delete_receipt_endpoint(recipe_id: int):
    connection = None
    try:
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        # Получаем название рецепта для функции del_receipt
        cursor.execute("SELECT name_of_receipt FROM receipts WHERE id=?", (recipe_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Recipe not found")

        name_receipt = result[0]
        del_receipt(cursor, name_receipt, user_id)
        connection.commit()

        return {"message": "Receipt successfully deleted!", "status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error occurred when deleting receipt: {str(e)}"
        )
    finally:
        if connection:
            connection.close()



@app.get("/shopping_list")
def calculate_shopping_list():
    connection = None
    try:   
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2  
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        
        data = count_ingredients(cursor, user_id)
        connection.commit()
        return data

    except HTTPException:
        raise
        
    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error while calculating shopping list: {str(e)}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculating shopping list: {str(e)}"
        )
        
    finally:
        if connection:
            connection.close()



@app.get("/menu/display")
def display_menu():
    connection = None
    try:
        connection = sqlite3.connect(database)
        cursor = connection.cursor()
        
        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2  
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )

        cursor.execute("SELECT name_of_receipt FROM receipts WHERE user_id = ?", (user_id,))
        data_list = cursor.fetchall()
        data = list()
        i = 1
        for item in data_list:
            data.append({"id" : i, "name" : item[0]})
            i = i + 1
        return data

    except HTTPException:
        raise
        
    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error while fetching menu: {str(e)}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error while fetching menu: {str(e)}"
        )
        
    finally:
        if connection:
            connection.close()

# return data format: [(2, '{"breakfast": {"zalupa1": 2, "pizdec": 3}, "lunch": {"huy": 4}, "dinner": {"1": 1, "3": 3}}')]



# endpoint parameters will change
# menu data should contain all menu for the day
# therefore editing only one day at a time should be possible on the frontend
@app.post("/menu/add")
async def add_to_menu1(request : Request):
    connection = None
    try:

        
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        request_data = await request.json()
        
        menu_data = request_data.get("menu", dict)
        day_number = request_data.get("day_number", int)
        menu = dict()

        for eating in menu_data:  
            if menu_data[eating]:       
                menu[eating] = {menu_data[eating][0]['name'] : 1}

        user_id = 2  # temporary
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        add_to_menu(cursor, day_number, user_id, menu)
        connection.commit()
        return {"message": "Receipts successfully added!"}

    except HTTPException:
        raise
        
    except sqlite3.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error while adding to menu: {str(e)}"
        )
        
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error adding to menu: {str(e)}"
        )
        
    finally:
        if connection:
            connection.close()


@app.put("/menu/update")
def update_menu(day_number: int, updated_menu, user_id : int):
    connection = None
    try:

        if not isinstance(day_number, int) or day_number < 1:
            raise HTTPException(
                status_code=400, 
                detail="Day number must be a positive integer"
            ) 
        if not updated_menu:
            raise HTTPException(
                status_code=400, 
                detail="Updated menu data cannot be empty! Use delete for deleting the menu."
            )

        connection = sqlite3.connect(database)
        cursor = connection.cursor()
        
        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2  
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )

        update_menu(cursor, day_number, user_id, updated_menu)
        connection.commit()
        return {"message": "Menu successfully updated!"}

    except HTTPException:
        raise
        
    except sqlite3.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )
        
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        )
        
    finally:
        if connection:
            connection.close()



@app.delete("/menu/delete")
def delete_menu(user_id: int):
    connection = None
    try:
        if not isinstance(user_id, int) or user_id < 1:
            raise HTTPException(
                status_code=400, 
                detail="User ID must be a positive integer"
            )

        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2 
        
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        cursor.execute("DELETE FROM menu WHERE user_id = ?", (user_id,))
        connection.commit()

        return {"message": "Menu successfully deleted!"}

    except HTTPException:
        raise
        
    except sqlite3.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error while deleting menu: {str(e)}"
        )
        
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error while deleting menu: {str(e)}"
        )
        
    finally:
        if connection:
            connection.close()


@app.get("/reserves/display")
def display_reserves():
    connection = None
    try:
        connection = sqlite3.connect(database)
        cursor = connection.cursor()
        
        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2 

        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )

        cursor.execute("SELECT ingredients FROM reserves WHERE user_id = ?", (user_id,))
        data_json = cursor.fetchall()[0][0]
        data = json.loads(data_json)
        data_send = list()
        for x in data:
            data_send.append({"name" : x, "amount" : data[x], "unit" : "g"})
        
        return data_send

    except HTTPException:
        raise
        
    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error while fetching reserves: {str(e)}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error while fetching reserves: {str(e)}"
        )
        
    finally:
        if connection:
            connection.close()


# return data format: [(1, '{"maslo": 120, "chocolate": 5, "chocolade": 3}')]


@app.post("/reserves/add")
async def add_to_reserves_end_point(request : Request):
    connection = None
    try:
        connection = sqlite3.connect(database)
        cursor = connection.cursor()
        request_data = await request.json()

        name_ingredient = request_data.get("name", "")
        amount_ingredient = request_data.get("amount", 0)
        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2 
        ingredient = dict()
        ingredient[name_ingredient] = amount_ingredient
        add_to_reserves(cursor, user_id, ingredient)
        connection.commit()
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error occurred when adding receipt: {str(e)}"
        )
    finally:
        if connection:
            connection.close()


@app.put("/reserves/update")
async def update_reserves(request : Request):
    try:
        connection = None
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        request_data = await request.json()

        name_ingredient = request_data.get("name", "")
        amount_ingredient = request_data.get("amount", int)

        data = dict()
        data[name_ingredient] = amount_ingredient

        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2 
        update_ingredient_in_reserves(cursor, user_id, data)
        connection.commit()

    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error occurred when adding receipt: {str(e)}"
        )
    finally:
        if connection:
            connection.close()



@app.delete("/reserves/delete")
async def delete_from_reserves_end_point(request : Request):
    try:
        connection = None
        connection = sqlite3.connect(database)
        cursor = connection.cursor()

        request_data = await request.json()

        name_ingredient = request_data.get("name", "")

        # temporary until further changes(DO NOT REMOVE THIS COMMENT AND THE FOLLOWING LINE)
        user_id = 2 
        del_from_reserves(cursor, user_id, name_ingredient)
        connection.commit()

    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error occurred when adding receipt: {str(e)}"
        )
    finally:
        if connection:
            connection.close()