from cs50 import SQL

db = SQL('sqlite:///dados.db')
# Criar a tabela 'estoque'
dados = db.execute('''
    SELECT * FROM estoque
        
    ''')
print(dados)

print("Dados importados com sucesso!")
