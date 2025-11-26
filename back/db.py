import sqlite3
import json



def add_receipt(cursor, name_receipt, ingredients,user_id):
    for x in ingredients:
        if ingredients[x]<=0:
            raise "Value of ingredient must be positive"
    json_ingredients = json.dumps(ingredients)
    cursor.execute("INSERT INTO receipts (user_id, name_of_receipt, ingredients) VALUES (?, ?, ?)", (user_id, name_receipt, json_ingredients))
     

def del_receipt(cursor, name_receipt, user_id):
    cursor.execute("DELETE FROM receipts WHERE name_of_receipt=? AND user_id = ?",(name_receipt, user_id))

def get_receipt(cursor, name_receipt, user_id):
    cursor.execute("SELECT name_of_receipt, ingredients FROM receipts WHERE name_of_receipt=? AND user_id = ?", (name_receipt, user_id))
    data = cursor.fetchone()
    return data

def get_receipts(cursor, user_id):
    cursor.execute("SELECT id, name_of_receipt, ingredients FROM receipts WHERE user_id = ?", (user_id,))
    data = cursor.fetchall()
    data_send = list()
    for i in range(len(data)):
            temp_list = list()
            temp_data = json.loads(data[i][2])
            for x in temp_data:
                temp_list.append({"name":x, "amount":temp_data[x], "unit" : "g"})
            data_send.append({"id" : data[i][0], "name" : data[i][1], "ingredients" : temp_list})
    return data_send


def set_name_receipt(cursor, old_name_receipt, new_name_receipt, user_id):
    cursor.execute("UPDATE receipts SET name_of_receipt = ? WHERE name_of_receipt = ? AND user_id = ?", (new_name_receipt, old_name_receipt, user_id))

def set_amount_of_ingredient(cursor, name_receipt, ingredient, amount, user_id):
    cursor.execute("SELECT ingredients FROM receipts WHERE name_of_receipt = ? AND user_id = ?", (name_receipt, user_id))
    ingredients = json.loads(cursor.fetchone()[0])
    ingredients[ingredient] = amount
    ingredients_json = json.dumps(ingredients)
    cursor.execute("UPDATE receipts SET ingredients = ?", (ingredients_json,))

def add_ingredients_to_receipt(cursor, name_receipt, new_ingredient, amount_of_new_ingredient, user_id):
    cursor.execute("SELECT ingredients FROM receipts WHERE name_of_receipt = ? AND user_id = ?", (name_receipt, user_id))
    ingredients = json.loads(cursor.fetchone()[0])
    ingredients[new_ingredient] = amount_of_new_ingredient
    ingredients_json = json.dumps(ingredients)
    cursor.execute("UPDATE receipts SET ingredients = ?", (ingredients_json,))

def del_ingredient(cursor, name_receipt, ingredient, user_id):
    cursor.execute("SELECT ingredients FROM receipts WHERE name_of_receipt = ? AND user_id = ?", (name_receipt, user_id))
    ingredients = json.loads(cursor.fetchone()[0])
    del ingredients[ingredient]
    ingredients_json = json.dumps(ingredients)
    cursor.execute("UPDATE receipts SET ingredients = ?", (ingredients_json,))

def rename_ingredient(cursor, name_receipt, ingredient, new_ingredient, user_id):
    cursor.execute("SELECT ingredients FROM receipts WHERE name_of_receipt = ? AND user_id = ?", (name_receipt, user_id))
    ingredients = json.loads(cursor.fetchone()[0])
    ingredients[new_ingredient] = ingredients[ingredient]
    del ingredients[ingredient]
    ingredients_json = json.dumps(ingredients)
    cursor.execute("UPDATE receipts SET ingredients = ?", (ingredients_json,))

def register(cursor, login, password):
    cursor.execute("SELECT login FROM users WHERE login = ?", (login,))
    logins = cursor.fetchall()
    if logins == []:
        cursor.execute("INSERT INTO users (login, password) VALUES (?, ?)", (login, password))
        return "Successful registrated"
    else:
        return "This username already used"

def login(cursor, login, password):
    cursor.execute("SELECT login, password FROM users WHERE login = ?", (login,))
    data = cursor.fetchall()
    if data == []:
        return f"Couldn`t find user with username {login}"
    elif data[0][0] == login and data[0][1] == password:
        return "Successful login"
    elif data[0][0] == login and data[0][1] != password:
        return "Wrong password"
        
def del_user(cursor, login, password):
    cursor.execute("SELECT login, password FROM users WHERE login = ?", (login,))
    data = cursor.fetchall()
    if data == []:
        return f"Couldn`t find user with username {login}"
    elif data[0][0] == login and data[0][1] == password:
        cursor.execute("DELETE FROM users WHERE login=? AND password=?", (login, password))
        return "Successfully deleted"
    elif data[0][0] == login and data[0][1] != password:
        return "Wrong password"



