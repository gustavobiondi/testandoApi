from cs50 import SQL

db = SQL('sqlite:///dados.db')

dados = db.execute('SELECT * FROM comandas')
print(dados)
db.execute('DROP TABLE comandas')
dados = db.execute('SELECT * FROM comandas')
print(dados)