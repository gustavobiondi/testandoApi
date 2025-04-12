from cs50 import SQL
db = SQL('sqlite:///dados.db')
import re

resultado = db.execute("SELECT instrucoes FROM cardapio")

for i in resultado:
    if i['instrucoes']:
        match = re.search(r'Modalidade:\s*([^-]+)', i['instrucoes'])
        if match:
            print(match.group(1).strip())
    