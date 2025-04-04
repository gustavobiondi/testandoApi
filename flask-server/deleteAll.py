from cs50 import SQL

db=SQL('sqlite:///dados.db')

db.execute('DELETE FROM valores_pagos')
db.execute('DELETE FROM faturamento_diario')
db.execute('DELETE FROM pedidos')

print(db.execute('SELECT * FROM pedidos'))
print(db.execute('SELECT * FROM valores_pagos'))
print(db.execute('SELECT * FROM faturamento_diario'))