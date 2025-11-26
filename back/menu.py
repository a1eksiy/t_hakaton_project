import sqlite3
import json

def add_to_menu(cursor, day_number, user_id, menu_added):
        cursor.execute("SELECT menu FROM menu WHERE user_id = ? AND day_number = ?", (user_id, day_number))
        menu_json = cursor.fetchone()[0]
        menu = menu.loads(menu_json)

        for eating in menu_added:
                what_eat = menu_added[eating]
                for receipt in what_eat:
                        if receipt in menu:
                                menu[receipt] = menu[receipt] + menu_added[receipt]
                        else:
                                menu[receipt] = menu_added[receipt]
                
        menu_json = json.dumps(menu)
        cursor.execute("INSERT INTO menu (user_id_day_number, user_id, day_number, menu) VALUES (?, ?, ?, ?)", (str(user_id)+"_"+str(day_number), day_number, user_id, menu_json))


# menu = {"breakfast" : [{names of receipts:amount}], "lunch" : [names of receipts], "dinner" : [names of receipts]}

