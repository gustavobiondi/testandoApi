from cs50 import SQL

db = SQL('sqlite:///dados.db')
comanda = 'comanda'
dados = db.execute('SELECT * FROM pedidos')
print(dados)
