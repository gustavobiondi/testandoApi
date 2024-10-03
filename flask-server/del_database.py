from cs50 import SQL

db = SQL('sqlite:///dados.db')

dados = db.execute('DROP TABLE pedidos')
print(dados)
