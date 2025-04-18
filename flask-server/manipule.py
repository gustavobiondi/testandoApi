from datetime import datetime
from cs50 import SQL
import shutil
import os


DATABASE_PATH = "/data/dados.db"
if not os.path.exists(DATABASE_PATH):
    shutil.copy("dados.db", DATABASE_PATH)
db = SQL("sqlite:///" + DATABASE_PATH)
dia = datetime.now().date()

db.execute('UPDATE estoque_geral SET item = ? WHERE estoque_ideal = ? AND quantidade = ?','agua',588,226)
db.execute('UPDATE estoque_geral SET item = ? WHERE estoque_ideal = ? AND quantidade = ?','agua c gas',288,144)
db.execute('UPDATE estoque_geral SET item = ? WHERE estoque_ideal = ? AND quantidade = ?','agua tonica',60,48)
db.execute('UPDATE estoque_geral SET item = ? WHERE estoque_ideal = ? AND quantidade = ?','tang',64,160)

print(db.execute('SELECT * FROM estoque_geral'))