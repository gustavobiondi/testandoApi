from cs50 import SQL

db = SQL('sqlite:///dados.db')

print(db.execute('SELECT * FROM estoque_geral'))
