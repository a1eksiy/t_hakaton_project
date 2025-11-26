import sqlite3
import json

def get_variants(cursor, user_id):
    variants = list()
    cursor.execute("SELECT name_of_receipt, ingredients FROM receipts WHERE user_id = ?", (user_id,))
    all_receipts = list()
    for tupple in cursor.fetchall():
        all_receipts.append({tupple[0]:tupple[1]})
    cursor.execute("SELECT ingredients FROM reserves WHERE user_id = ?", (user_id,))
    avaible_ingredients_json = cursor.fetchone()[0]
    avaible_ingredients = json.loads(avaible_ingredients_json)
    for receipt_json in all_receipts:
        flag = True
        for name_receipt in receipt_json:
            saved_name_of_receipt = name_receipt
            receipt = json.loads(receipt_json[name_receipt])
            for ingr in receipt:
                if avaible_ingredients[ingr] <= receipt[ingr]:
                    flag = False
                    break
        if flag == True:
            variants.append(saved_name_of_receipt)
    return variants
                
    
