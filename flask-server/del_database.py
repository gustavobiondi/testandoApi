from cs50 import SQL

db = SQL('sqlite:///dados.db')
print(db.execute('SELECT * FROM cardapio'))
db.execute('DROP TABLE cardapio')
print(db.execute('SELECT * FROM cardapio'))

