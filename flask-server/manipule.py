from cs50 import SQL
db = SQL('sqlite:///dados.db')
import re
from datetime import datetime
hoje = datetime.now().date()

db.execute("UPDATE pagamentos SET faturamento = 0 WHERE dia = ?", hoje)
s = db.execute("SELECT * FROM pagamentos")
print(s)