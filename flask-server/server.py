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
    dados_estoque = db.execute('SELECT * FROM estoque')
    emit('initial_data', {'dados_pedido': dados_pedido, 'dados_estoque': dados_estoque})



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
        print(comanda)
        print(pedidos)
        print(quantidades)
        for i in range(len(pedidos)):
            pedido = pedidos[i]
            quantidade = quantidades[i]
            preco_unitario = db.execute(
                'SELECT preco,categoria_id FROM cardapio WHERE item = ?', pedido)
            print(preco_unitario)
            categoria = preco_unitario[0]['categoria_id']
            print (categoria)
            db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria) VALUES (?, ?, ?,?,?)',
                       comanda, pedido, float(quantidade), float(preco_unitario[0]['preco'])*float(quantidade),categoria)
            quantidade_anterior = db.execute('SELECT quantidade FROM estoque WHERE item = ?',pedido)
            if  quantidade_anterior:
                db.execute('UPDATE estoque SET quantidade = ? WHERE item = ?',float(quantidade_anterior[0]['quantidade'])-quantidade,pedido)
                dados = db.execute('SELECT * FROM estoque')
                emit('update_estoque', dados, broadcast=True)
            dados_pedido = db.execute('SELECT * FROM pedidos')
            emit('initial_data', {'dados_pedido': dados_pedido}, broadcast=True)
            
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

# Manipulador para obter o preço total da 


@socketio.on('atualizar_comanda')
def atualizar_comanda(data):
    try:
        comanda = data.get('comanda')
        
        # Busca os dados antigos
        dados_antigos = db.execute('''
            SELECT pedido, id, SUM(quantidade) AS quantidade, SUM(preco) AS preco
            FROM pedidos WHERE comanda = ? GROUP BY pedido
        ''', comanda)
        
        print("Dados antigos:", dados_antigos)

        dados_novos = data.get('dados')
        print("Dados novos:", dados_novos)

        # Verifique se o tamanho dos dados coincide
        if len(dados_antigos) != len(dados_novos):
            raise Exception("O número de itens em dados antigos e novos não é o mesmo.")
        print(len(dados_novos))
        teste_id = db.execute('SELECT * FROM pedidos WHERE id = ?','48')
        print(teste_id)

        for i in range(len(dados_antigos)):
            pedido = dados_antigos[i]['pedido']
            print("Processando pedido:", pedido)

            # Quantidade nova e antiga
            quantidade_nova = float(dados_novos[i]['quantidade'])
            quantidade_antiga = float(dados_antigos[i]['quantidade'])
            quantidade = quantidade_nova- quantidade_antiga
            
            if quantidade_nova != 0 and quantidade_nova!=quantidade_antiga:
                # Busca o preço do cardápio
                preco = db.execute('SELECT preco FROM cardapio WHERE item = ?', pedido)

                # Busca o ID do pedido para atualizar
                id_pedido = dados_novos[i]['id']
                print(id_pedido)
                db.execute('UPDATE estoque SET quantidade = quantidade+ ? WHERE item = ?',quantidade*-1,pedido)

                novo_preco = float(preco[0]['preco'])
                db.execute('UPDATE pedidos SET quantidade = quantidade + ?, preco = preco + ? WHERE id = ?', quantidade, quantidade*novo_preco, id_pedido)

            elif quantidade_nova==0:
                # Se a quantidade for 0, apaga o pedido
                db.execute('DELETE FROM pedidos WHERE pedido = ?', pedido)

        valor_pago = db.execute(
            'SELECT valor_pago FROM valores_pagos WHERE comanda = ?', comanda)
        total_comanda = db.execute('''
            SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ?
        ''', comanda)
        

        preco_total = float(total_comanda[0]['total']) if total_comanda else 0
        preco_pago = float(valor_pago[0]['valor_pago']) if valor_pago else 0
        print(preco_pago)
        print(preco_total)

        dados = db.execute('''
            SELECT pedido,id, SUM(quantidade) AS quantidade, SUM(preco) AS preco
            FROM pedidos WHERE comanda =? GROUP BY pedido
        ''', comanda)
        print(dados)
        print(type(dados))
        # Emitir os dados mais recentes da comanda e atualizar no frontend
    
        emit('preco', {'preco': preco_total - preco_pago, 'dados':dados, 'comanda':comanda}, broadcast=True)
        estoque = db.execute('SELECT * FROM estoque')
        emit('update_estoque', estoque, broadcast=True)


    except Exception as e:
        print("Erro ao atualizar comanda:", e)
        emit('error', {'message': str(e)})

            



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
        v_comanda_existe= db.execute('SELECT pedido FROM pedidos WHERE comanda = ?', fcomanda)

        if v_comanda_existe:
            preco_total = float(total_comanda[0]['total']) if total_comanda else 0
            preco_pago = float(valor_pago[0]['valor_pago']) if valor_pago else 0
            print(preco_pago)
            print(preco_total)

            dados = db.execute('''
                SELECT pedido,id, SUM(quantidade) AS quantidade, SUM(preco) AS preco
                FROM pedidos WHERE comanda =? GROUP BY pedido
            ''', fcomanda)
            print(dados)
            print(type(dados))
            # Emitir os dados mais recentes da comanda e atualizar no frontend
            emit('preco', {'preco': preco_total - preco_pago, 'dados':dados, 'comanda':fcomanda}, broadcast=True)
        else:
            emit('preco',{'preco': '', 'dados':'','comanda':fcomanda},broadcast=True)

    except Exception as e:
        print("Erro ao calcular preço:", e)
        emit('error', {'message': str(e)})



if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)