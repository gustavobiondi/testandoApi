from cs50 import SQL

# Conectando ao banco de dados
db = SQL('sqlite:///dados.db')

# Adicionando a coluna 'liberado' à tabela 'usuarios




print(db.execute('SELECT * FROM cardapio'))