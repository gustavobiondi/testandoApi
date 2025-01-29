from cs50 import SQL

db = SQL('sqlite:///dados.db')

db.execute('INSERT INTO cardapio (id,item,preco,categoria_id,opcoes) VALUES(?,?,?,?,?)', 146, 'suco', 16, 2,
           'Frutas(abacaxi-acai-banana com canela-caju-kiwi-limao-limao siciliano-lima da persia-manga-maracuja-melancia-morango-tangerina)')
db.execute('INSERT INTO cardapio (id,item,preco,categoria_id) VALUES(?,?,?,?)',
           152, 'whisky com energetico (copao)', 16, 2)
idsss = db.execute('SELECT * FROM cardapio WHERE categoria_id = ?', 2)
for item in idsss:
    print(item)
