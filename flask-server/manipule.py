from datetime import datetime
from cs50 import SQL
db = SQL('sqlite:///dados.db')
dia = datetime.now().date()

db.execute("INSERT INTO pagamentos (dia,faturamento, faturamento_prev, drinks, porcoes, restantes, totais_pedidos,caixinha) VALUES (?,0, 0, 0, 0, 0, 0,0)", dia)