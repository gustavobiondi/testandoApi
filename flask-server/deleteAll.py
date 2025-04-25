from cs50 import SQL

db=SQL('sqlite:///data/dados.db')

db.execute('CREATE TABLE alteracoes (tabela TEXT, alteracao TEXT, tipo TEXT, usuario TEXT, tela TEXT, dia TEXT, horario TEXT)')

print(db.execute('SELECT * FROM alteracoes'))