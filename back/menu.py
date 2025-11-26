import sqlite3
import json

def add_to_menu(cursor, day_number, user_id, menu_added):
        cursor.execute("SELECT menu FROM menu WHERE user_id = ? AND day_number = ?", (user_id, day_number))
        menu_json = cursor.fetchone()
        
        try:
                menu = json.loads(menu_json[0])
        except:
                menu = dict()
        for eating in menu_added:
                for receipt in menu_added[eating]:
                        if receipt in menu:
                                menu[eating][receipt] = menu[eating][receipt] + menu_added[eating][receipt]
                        else:
                                menu[eating] = {receipt : menu_added[eating][receipt]}


        menu_json = json.dumps(menu)
        cursor.execute("DELETE FROM menu WHERE user_id = ? AND day_number = ?", (user_id, day_number))
        day_number_user_id = str(user_id)+"_"+str(day_number)
        cursor.execute("INSERT INTO menu (user_id_day_number, user_id, day_number, menu) VALUES (?, ?, ?, ?)", (day_number, user_id, day_number, menu_json))
        

# menu = {"breakfast" : [{names of receipts:amount}], "lunch" : [names of receipts], "dinner" : [names of receipts]}

