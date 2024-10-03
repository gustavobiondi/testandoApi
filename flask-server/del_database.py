from cs50 import SQL

db = SQL('sqlite:///dados.db')

dados = db.execute('SELECT * FROM pedidos')
print(dados)
db.execute('DELETE FROM pedidos WHERE comanda = ?','1')
dados = db.execute('SELECT * FROM pedidos')
print(dados)