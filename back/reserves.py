import sqlite3
import json


def add_to_reserves(cursor, user_id, reserves):
    cursor.execute("SELECT ingredients FROM reserves WHERE user_id=?", (user_id,))
    users_ingredients = dict()
    users_ingredients_json = cursor.fetchall()[0][0]
    users_ingredients = json.loads(users_ingredients_json)


    for x in reserves:
       if x in users_ingredients:
           users_ingredients[x] = reserves[x] + users_ingredients[x]
       else:
           users_ingredients[x] = reserves[x]
    users_ingredients_json = json.dumps(users_ingredients)
    cursor.execute("DELETE FROM reserves WHERE user_id=?", (user_id,))
    cursor.execute("INSERT INTO reserves (user_id, ingredients) VALUES (?, ?)", (user_id, users_ingredients_json))


# reserves = {ingredient : amount}

def del_from_reserves(cursor, user_id, name_ingredient):
    cursor.execute("SELECT ingredients FROM reserves WHERE user_id=?", (user_id,))
    users_ingredients = dict()
    users_ingredients_json = cursor.fetchall()[0][0]
    users_ingredients = json.loads(users_ingredients_json)

    del users_ingredients[name_ingredient]

    users_ingredients_json = json.dumps(users_ingredients)
    cursor.execute("DELETE FROM reserves WHERE user_id=?", (user_id,))
    cursor.execute("INSERT INTO reserves (user_id, ingredients) VALUES (?, ?)", (user_id, users_ingredients_json))

def update_ingredient_in_reserves(cursor, user_id, data):
    cursor.execute("SELECT ingredients FROM reserves WHERE user_id=?", (user_id,))
    users_ingredients = dict()
    users_ingredients_json = cursor.fetchall()[0][0]
    users_ingredients = json.loads(users_ingredients_json)

    for x in data:
        users_ingredients[x] = data[x]

    users_ingredients_json = json.dumps(users_ingredients)
    cursor.execute("DELETE FROM reserves WHERE user_id=?", (user_id,))
    cursor.execute("INSERT INTO reserves (user_id, ingredients) VALUES (?, ?)", (user_id, users_ingredients_json))
