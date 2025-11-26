import sqlite3
import json


def count_ingredients(cursor, user_id):
    cursor.execute("SELECT menu FROM menu WHERE user_id=?", (user_id,))
    menu_json = cursor.fetchone()[0]
    menu = json.loads(menu_json)

    #рецепты из меню и их количество
    dict_of_receipts_amount = dict()
    for eating in menu:
        for receipt in menu[eating]:
            if receipt in dict_of_receipts_amount:
                dict_of_receipts_amount[receipt] = menu[eating][receipt] + dict_of_receipts_amount[receipt]
            else:
                dict_of_receipts_amount[receipt] = menu[eating][receipt]
    #рецепты и ингредиенты для них
    list_of_receipt_ingredients = tuple()
    cursor.execute("SELECT name_of_receipt, ingredients FROM receipts WHERE user_id=?", (user_id,))
    list_of_receipt_ingredients = cursor.fetchall()
    
    dict_of_receipts_ingredients = dict()
    for tuple_receipt_ingredient in list_of_receipt_ingredients:
        name_of_receipt = tuple_receipt_ingredient[0]
        ingredients_of_receipt = tuple_receipt_ingredient[1]
        dict_of_receipts_ingredients[name_of_receipt] = ingredients_of_receipt
    
    needed_ingredient = dict()
    ingredients = dict()
    for receipt in dict_of_receipts_amount:
        ingredients = json.loads(dict_of_receipts_ingredients[receipt])
        for ingredient in ingredients:
            if ingredient in needed_ingredient:
                needed_ingredient[ingredient] = needed_ingredient[ingredient] + ingredients[ingredient] * dict_of_receipts_amount[receipt]
            else:
                needed_ingredient[ingredient] = ingredients[ingredient] * dict_of_receipts_amount[receipt]

    #резервы
    reserves = dict()
    cursor.execute("SELECT ingredients FROM reserves WHERE user_id = ?", (user_id,))
    reserves = json.loads(cursor.fetchone()[0])

    for ingredient in needed_ingredient:
        if ingredient in reserves:
            needed_ingredient[ingredient] = needed_ingredient[ingredient] - reserves[ingredient]
            if needed_ingredient[ingredient] < 0:
                needed_ingredient[ingredient] = 0

    needed_ingredient_list = list()
    i = 1
    for ingredient in needed_ingredient:
        if needed_ingredient[ingredient] > 0:
            needed_ingredient_list.append({"id" : i, "name" : ingredient, "ingredients" : [{"amount":needed_ingredient[ingredient], "unit" : "g"}]})
            i = i + 1
    return needed_ingredient_list

