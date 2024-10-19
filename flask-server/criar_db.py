from cs50 import SQL

# Conectando ao banco de dados
db = SQL('sqlite:///dados.db')

# Adicionando a coluna 'liberado' à tabela 'usuarios

# Selecionando todos os dados da tabela 'usuarios'
db.execute('ALTER TABLE pedidos ADD COLUMN nome TEXT')
db.execute('UPDATE pedidos SET nome = ? WHERE username = ?',
           'joao', 'tatianabiondi')
dados = db.execute('SELECT * FROM pedidos')

# Imprimindo os dados
print(dados)
