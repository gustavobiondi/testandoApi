from datetime import datetime
from cs50 import SQL
db = SQL('sqlite:///dados.db')
dia = datetime.now().date()



vetor = [
    {'id':6,'item':'isca de contra acebolado'},
    {'id':7,'item':'camarao'},
    {'id':8,'item':'lula'},
    {'id':11,'item':'fritas 300g/camarao 300g/frango 300g'},
    {'id':12,'item':'fritas 300g/frango 300g/lula 300g'},
    {'id':13,'item':'fritas 300g/camarao 300g/peixe 300g'},
    {'id':14,'item':'fritas 300g/peixe 300g/lula 300g'},
    {'id':15,'item':'fritas 300g/camarao 300g/lula 300g'},
    {'id':16,'item':'camarao 300g/frango 300g/peixe 300g'},
    {'id':17,'item':'camarao 300g/frango 300g/lula 300g'},
    {'id':18,'item':'camarao 300g/lula 300g/peixe 300g'},
    {'id':23,'item':'calabresa 500g/peixe 500g'},
    {'id':24,'item':'fritas 500g/camarao 500g'},
    {'id':25,'item':'fritas 500g/carne 500g'},
    {'id':26,'item':'fritas 500g/lula 500g'},
    {'id':27,'item':'calabresa 500g/carne 500g'},
    {'id':28,'item':'camarao 500g/peixe 500g'},
    {'id':29,'item':'lula 500g/peixe 500g'},
    {'id':30,'item':'camarao 500g/lula 500g'},
    {'id':31,'item':'fritas 300g/camarao 300g/frango 300g/peixe 300g'},
    {'id':32,'item':'fritas 300g/frango 300g/lula 300g/peixe 300g'},
    {'id':33,'item':'fritas 300g/camarao 300g/frango 300g/lula 300g'},
    {'id':34,'item':'fritas 300g/camarao 300g/lula 300g/peixe 300g'},
    {'id':35,'item':'camarao 300g/frango 300g/lula 300g/peixe 300g'},
    {'id':38,'item':'fritas 500g/camarao 500g/frango 500g'},
    {'id':39,'item':'fritas 500g/frango 500g/lula 500g'},
    {'id':40,'item':'fritas 500g/camarao 500g/peixe 500g'},
    {'id':41,'item':'fritas 500g/lula 500g/peixe 500g'},
    {'id':42,'item':'fritas 500g/camarao 500g/lula 500g'},
    {'id':43,'item':'camarao 500g/frango 500g/peixe 500g'},
    {'id':44,'item':'camarao 500g/frango 500g/lula 500g'},
    {'id':38,'item':'camarao 500g/lula 500g/peixe 500g'},
]   

for row in vetor:
    item = row['item']
    id = row['id']
    db.execute('UPDATE cardapio SET item = ? WHERE id = ?',item,id)


dados = db.execute("SELECT * FROM cardapio WHERE id<=45")

for row in dados:

    print(row)