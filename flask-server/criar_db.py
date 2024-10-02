from cs50 import SQL

db = SQL('sqlite:///dados.db')
db.execute('CREATE TABLE IF NOT EXISTS valores_pagos(comanda TEXT UNIQUE,valor_pago FLOAT)')
db.execute('INSERT INTO valores_pagos (comanda,valor_pago) VALUES (?,?)','1',5)
dados = db.execute('SELECT * FROM valores_pagos')
print(dados)

