from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from cs50 import SQL
from flask_cors import CORS
import eventlet

# Inicialização do app Flask e SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'seu_segredo_aqui'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
db = SQL('sqlite:///dados.db')
CORS(app)

# Manipulador de conexão
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')
    dados = db.execute('SELECT * FROM comandas')
    emit('initial_data', dados, broadcast=True)

# Manipulador de desconexão
@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

# Manipulador para inserir dados
@socketio.on('insert_order')
def handle_insert_order(data):
    try:
        comanda = data.get('comanda')
        pedido = data.get('pedido')
        categoria = data.get('categoria')
        print(f"Comanda: {comanda}, Pedido: {pedido}, Categoria: {categoria}")
        db.execute('INSERT INTO comandas (comanda, pedido, categoria) VALUES (?, ?, ?)', comanda, pedido, categoria)
        emit('new_order', {'comanda': comanda, 'pedido': pedido, 'categoria': categoria}, broadcast=True)
        pagos = db.execute('SELECT comanda FROM valores_pagos WHERE comanda = ?', comanda)
        if not pagos:
            db.execute('INSERT INTO valores_pagos (comanda, valor_pago) VALUES(?, ?)', comanda, 0)
    except Exception as e:
        print("Erro ao inserir ordem:", e)
        emit('error', {'message': str(e)})

# Manipulador para apagar uma comanda
@socketio.on('delete_comanda')
def handle_delete_comanda(data):
    try:
        comanda = data.get('fcomanda')
        db.execute('DELETE FROM comandas WHERE comanda = ?', (comanda))
        db.execute('DELETE FROM valores_pagos WHERE comanda = ?', comanda)
        emit('comanda_deleted', {'fcomanda': comanda}, broadcast=True)
    except Exception as e:
        print("Erro ao apagar comanda:", e)
        emit('error', {'message': str(e)})

@socketio.on('pagar_parcial')
def pagar_parcial(data):
    valor_pago = float(data.get('valor_pago'))
    comanda = data.get('fcomanda')
    verificar_pago = db.execute('SELECT valor_pago FROM valores_pagos WHERE comanda = ?', (comanda,))
    valor_total = valor_pago + float(verificar_pago[0]['valor_pago'])
    
    db.execute('UPDATE valores_pagos SET valor_pago = ? WHERE comanda = ?', valor_total, comanda)


# Manipulador para obter o preço total da comanda
@socketio.on('get_cardapio')
def handle_get_cardapio(data):
    try:
        fcomanda = data.get('fcomanda')
        cardapio = db.execute('SELECT * FROM cardapio')
        comandas = db.execute('SELECT * FROM comandas WHERE comanda = ?', fcomanda)
        valor_pago = db.execute('SELECT valor_pago FROM valores_pagos WHERE comanda = ?', fcomanda)
        
        preco = 0
        for row in comandas:
            item = row['pedido']
            for j in cardapio:
                if j['item'] == item:
                    preco += j['preco']
        
        if valor_pago:
            preco -= float(valor_pago[0]['valor_pago'])
        
        emit('preco', {'preco': preco})
    except Exception as e:
        print("Erro ao calcular preço:", e)
        emit('error', {'message': str(e)})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
