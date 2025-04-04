from cs50 import SQL
db = SQL('sqlite:///dados.db')

print(db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name= 'faturamento_diario'"))

    