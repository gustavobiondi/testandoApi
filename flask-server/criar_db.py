from cs50 import SQL

db = SQL('sqlite:///dados.db')
db.execute('CREATE TABLE IF NOT EXISTS pedidos(id INTEGER PRIMARY KEY AUTOINCREMENT,comanda TEXT, pedido TEXT NOT NULL, quantidade FLOAT,extra TEXT,preco FLOAT)')
db.execute('INSERT INTO pedidos(comanda,pedido,quantidade,extra) VALUES (?,?,?,?)','1','mamae eu quero', '1','bem doce')
dados = db.execute('SELECT * FROM PEDIDOS')
print(dados)

