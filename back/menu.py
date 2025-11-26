import sqlite3
import json

def add_to_menu(cursor, day_number, user_id, menu):
        menu_json = json.dumps(menu)
        cursor.execute("INSERT INTO menu (user_id_day_number, user_id, day_number, menu) VALUES (?, ?, ?, ?)", (str(user_id)+"_"+str(day_number), day_number, user_id, menu_json))


# menu = {"breakfast" : [{names of receipts:amount}], "lunch" : [names of receipts], "dinner" : [names of receipts]}

