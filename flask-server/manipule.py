from datetime import datetime
from cs50 import SQL
import shutil
import os


db = SQL("sqlite:///data/dados.db")

hoje = datetime.now().date()


db.execute("INSERT INTO pagamentos (dia,faturamento, faturamento_prev, drinks, porcoes, restantes, totais_pedidos,caixinha) VALUES (?,0, 0, 0, 0, 0, 0,0)", hoje)
