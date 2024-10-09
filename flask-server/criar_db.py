from cs50 import SQL

db = SQL('sqlite:///dados.db')


# Inserir valores na tabela
db.execute('INSERT INTO pedidos (pedido, comecar, fim, estado) VALUES (?,?, ?, ?)',
           'daiquiri', '10:20', '10:40', 'feito')

# Selecionar e exibir os dados da tabela
dados = db.execute('SELECT * FROM pedidos')
print(dados)
