from cs50 import SQL
import os
import shutil

DATABASE_PATH = "/data/dados.db"
if not os.path.exists(DATABASE_PATH):
    shutil.copy("dados.db", DATABASE_PATH)
    db = SQL("sqlite:///" + DATABASE_PATH)

db.execute('CREATE TABLE alteracoes (tabela TEXT, alteracao TEXT, tipo TEXT, usuario TEXT, tela TEXT, dia TEXT, horario TEXT)')

print(db.execute('SELECT * FROM alteracoes'))