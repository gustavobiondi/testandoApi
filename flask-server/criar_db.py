from cs50 import SQL

db = SQL('sqlite:///dados.db')
# Criar a tabela 'estoque'
dados = db.execute('''
                ALTER TABLE pedidos
                ADD COLUMN categoria TEXT;

            ''')
print(dados)
