from datetime import datetime
from cs50 import SQL
import shutil
import os


DATABASE_PATH = "/data/dados.db"
if not os.path.exists(DATABASE_PATH):
    shutil.copy("dados.db", DATABASE_PATH)
db = SQL("sqlite:///" + DATABASE_PATH)
dia = datetime.now().date()


db.execute('INSERT INTO usuarios  (username,senha,liberado,cargo) VALUES (?,?,?,?)',"baiano",'0000','1','colaborador')
db.execute('INSERT INTO usuarios  (username,senha,liberado,cargo) VALUES (?,?,?,?)',"roberto",'1234','1','colaborador')
print(db.execute("SELECT * FROM usuarios"))