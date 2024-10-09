from cs50 import SQL

db = SQL('sqlite:///dados.db')

<<<<<<< HEAD
dados = db.execute('SELECT * FROM pedidos')
print(dados)
db.execute('DELETE FROM pedidos WHERE comanda = ?','1')
dados = db.execute('SELECT * FROM pedidos')
print(dados)
=======
dados = db.execute('DROP TABLE pedidos')
print(dados)
>>>>>>> 84a92989a490b59e7c9ea99dd22e2a280d04a058
