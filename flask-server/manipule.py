from datetime import datetime
from cs50 import SQL
db = SQL('sqlite:///dados.db')
dia = datetime.now().date()

print(db.execute("SELECT * FROM cardapio WHERE item ='saquerita'"))