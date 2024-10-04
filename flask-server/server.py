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
    dados_pedido = db.execute('SELECT * FROM pedidos')
    emit('initial_data', dados_pedido, broadcast=True)

# Manipulador de desconexão


@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

# Manipulador para inserir dados


@socketio.on('insert_order')
def handle_insert_order(data):
    try:
        comanda = data.get('comanda')
        pedidos = data.get('pedidosSelecionados')
        quantidades = data.get('quantidadeSelecionada')
        for i in range(len(pedidos)):
            pedido = pedidos[i]
            quantidade = quantidades[i]
            preco_unitario = db.execute(
                'SELECT preco FROM cardapio WHERE item = ?', pedido)

            db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco) VALUES (?, ?, ?,?)',
                       comanda, pedido, float(quantidade), float(preco_unitario[0]['preco'])*float(quantidade))
            
            qauntidade_anterior = db.execute('SELECT quantidade FROM estoque WHERE item = ?')
            db.execute('UPDATE estoque SET quantidade = ?')
            emit('new_order', {'comanda': comanda, 'pedido': pedido,
                               'quantidade': quantidade, 'preco': float(preco_unitario[0]['preco'])*float(quantidade)}, broadcast=True)

        handle_get_cardapio(comanda)

    except Exception as e:
        print("Erro ao inserir ordem:", e)
        emit('error', {'message': str(e)})


@socketio.on('delete_comanda')
def handle_delete_comanda(data):
    try:
        if type(data) == str:
            comanda = data
        else:
            comanda = data.get('fcomanda')

        db.execute('DELETE FROM pedidos WHERE comanda = ?', (comanda,))
        db.execute('DELETE FROM valores_pagos WHERE comanda = ?', (comanda,))

        emit('comanda_deleted', {'fcomanda': comanda}, broadcast=True)
    except Exception as e:
        print("Erro ao apagar comanda:", e)
        emit('error', {'message': str(e)})


@socketio.on('pagar_parcial')
def pagar_parcial(data):
    valor_pago = data.get('valor_pago')
    comanda = data.get('fcomanda')
    preco_pago = db.execute(
        'SELECT valor_pago FROM valores_pagos WHERE comanda = ?', comanda)

    if not preco_pago:
        db.execute('INSERT INTO valores_pagos (comanda,valor_pago) VALUES(?,?)',
                   comanda, float(valor_pago))

        valor_total = float(valor_pago)
    else:
        preco_pago = db.execute(
            'SELECT valor_pago FROM valores_pagos WHERE comanda = ?', comanda)
        valor_total = float(valor_pago) + \
            float(preco_pago[0]['valor_pago'])
        db.execute(
            'UPDATE valores_pagos SET valor_pago = ? WHERE comanda = ?', valor_total, comanda)
    total_comanda = db.execute('''
            SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ?
        ''', comanda)
    if valor_total >= float(total_comanda[0]['total']):
        handle_delete_comanda(comanda)


@socketio.on('pesquisa')
def pesquisa(data):
    pedidos = db.execute('SELECT item FROM cardapio')
    pedidos_filtrados = []
    cont = 0
    for row in pedidos:
        if cont < 5:
            pedido = row['item']
            if pedido.startswith(data):
                pedidos_filtrados.append(pedido)
                cont += 1
        else:
            break
    emit('pedidos', pedidos_filtrados)

# Manipulador para obter o preço total da comanda


@socketio.on('get_cardapio')
def handle_get_cardapio(data):
    try:
        if type(data) == str:
            fcomanda = data
        else:
            fcomanda = data.get('fcomanda')
        if not fcomanda:
            raise ValueError('Comanda não informada')

        valor_pago = db.execute(
            'SELECT valor_pago FROM valores_pagos WHERE comanda = ?', fcomanda)
        total_comanda = db.execute('''
            SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ?
        ''', fcomanda)

        preco_total = float(total_comanda[0]['total']) if total_comanda else 0
        preco_pago = float(valor_pago[0]['valor_pago']) if valor_pago else 0
        print(preco_pago)
        print(preco_total)

        dados = db.execute('''
            SELECT pedido, SUM(quantidade) AS quantidade, SUM(preco) AS preco
            FROM pedidos WHERE comanda =? GROUP BY pedido
        ''', fcomanda)
        print(dados)

        # Emitir os dados mais recentes da comanda e atualizar no frontend
        emit('preco', {'preco': preco_total - preco_pago, 'dados': dados})

    except Exception as e:
        print("Erro ao calcular preço:", e)
        emit('error', {'message': str(e)})


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
