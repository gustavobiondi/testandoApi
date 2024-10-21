from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from cs50 import SQL
from flask_cors import CORS
import eventlet
from datetime import datetime
import pytz

# Inicialização do app Flask e SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'seu_segredo_aqui'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
db = SQL('sqlite:///dados.db')
CORS(app, resources={r"/*": {"origins": "*"}})  # Permite todas as origens



@app.route('/faturamento', methods=['GET'])
def faturamento():
    dia = datetime.now().date()  # Obter a data atual
    
    # Executar a consulta e pegar o resultado
    faturamento = db.execute('SELECT faturamento FROM pagamentos WHERE dia = ?', dia)
    dia_formatado = dia.strftime('%d/%m')

    if faturamento:  # Verifica se há algum resultado
        # Pega o valor do faturamento do primeiro resultado
        return jsonify({'dia': str(dia_formatado), 'faturamento': faturamento[0]['faturamento']})
    else:
        return jsonify({'dia': str(dia_formatado), 'faturamento': 0})  # Se não houver faturamento


@app.route('/permitir', methods=['POST'])
def permitir():
    data = request.json
    id = data.get('id')
    # Corrigido para buscar 'numero', que está vindo do frontend
    numero = data.get('numero')
    db.execute('UPDATE usuarios SET liberado = ? WHERE id = ?',
               numero, id)  # Atualiza a coluna 'liberado'
    users = db.execute('SELECT * FROM usuarios')
    return {'users': users}


@app.route('/users', methods=['POST'])
def users():
    data = request.json
    username = data.get('username')
    users = db.execute('SELECT * from usuarios')

    return {'users': users}


@app.route('/verificar_username', methods=['POST'])
def verificar_usu():
    data = request.json
    username = data.get('username')
    print(username)
    senha = data.get('senha')
    print(senha)
    existe = db.execute(
        'SELECT * FROM usuarios WHERE username =? AND senha =? AND liberado=?', username, senha, '1')
    if existe:
        print('true')
        return {'data': True, 'cargo': existe[0]['cargo']}
    else:
        print('false')
        return {'data': False}


@app.route('/verificar_quantidade', methods=['POST'])
def verif_quantidade():
    data = request.json  # Use request.json para pegar o corpo da requisição
    item = data.get('item')
    quantidade = data.get('quantidade')

    if not item or not quantidade:
        return jsonify({'erro': 'Item ou quantidade ausentes.'}), 400

    verificar_estoque = db.execute(
        'SELECT quantidade FROM estoque WHERE item = ?', item)

    if verificar_estoque:
        estoque_atual = float(verificar_estoque[0]['quantidade'])
        if estoque_atual - float(quantidade) < 0:
            return jsonify({'erro': 'Estoque insuficiente', 'quantidade': estoque_atual}), 200
        else:
            return jsonify({'sucesso': 'Pedido pode ser processado', 'quantidade': estoque_atual}), 200
    else:
        return jsonify({'erro': 'Item não encontrado'}), 404


@app.route('/verificar_quantidade_enviar', methods=['POST'])
def verificar_quantidade():
    data = request.json  # Use request.json para pegar o corpo da requisição
    item = data.get('item')
    quantidade = data.get('quantidade')

    if not item or not quantidade:
        return jsonify({'erro': 'Item ou quantidade ausentes.'}), 400

    verificar_estoque = db.execute(
        'SELECT quantidade FROM estoque WHERE item = ?', item)

    if verificar_estoque:
        estoque_atual = float(verificar_estoque[0]['quantidade'])
        if estoque_atual - float(quantidade) < 0:
            return jsonify({'erro': True, 'quantidade': estoque_atual}), 200
        else:
            return jsonify({'erro': False, 'quantidade': estoque_atual}), 200

    else:
        return jsonify({'erro': 'Item não encontrado'}), 404


# Manipulador de conexão


@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')
    dados_pedido = db.execute('SELECT * FROM pedidos')
    dados_estoque = db.execute('SELECT * FROM estoque')
    emit('initial_data', {'dados_pedido': dados_pedido,
         'dados_estoque': dados_estoque})


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
        horario = data.get('horario')
        extra = data.get('extraSelecionados')
        username = data.get('username')
        print(username)
        print(comanda)
        print(pedidos)
        print(quantidades)
        print(horario)
        for i in range(len(pedidos)):
            pedido = pedidos[i]
            quantidade = quantidades[i]
            preco_unitario = db.execute(
                'SELECT preco,categoria_id FROM cardapio WHERE item = ?', pedido)
            print(preco_unitario)
            categoria = preco_unitario[0]['categoria_id']
            print(categoria)
            if extra[i]:
                print("extra", extra)
                db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,extra,username) VALUES (?, ?, ?,?,?,?,?,?)',
                           comanda, pedido, float(quantidade), float(preco_unitario[0]['preco'])*float(quantidade), categoria, horario, 'A Fazer', extra[i], username)
            else:
                print("nao tem extra")
                db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,username) VALUES (?, ?, ?,?,?,?,?,?)',
                           comanda, pedido, float(quantidade), float(preco_unitario[0]['preco'])*float(quantidade), categoria, horario, 'A Fazer', username)
            quantidade_anterior = db.execute(
                'SELECT quantidade FROM estoque WHERE item = ?', pedido)
            dados_pedido = db.execute('SELECT * FROM pedidos')
            if quantidade_anterior:
                quantidade_nova = float(
                    quantidade_anterior[0]['quantidade']) - quantidade
                db.execute(
                    'UPDATE estoque SET quantidade = ? WHERE item = ?', quantidade_nova, pedido)
                if quantidade_nova < 10:
                    emit('alerta_restantes', {
                         'quantidade': quantidade_nova, 'item': pedido}, broadcast=True)
                dados_estoque = db.execute('SELECT * FROM estoque')
                emit('initial_data', {
                    'dados_pedido': dados_pedido, 'dados_estoque': dados_estoque}, broadcast=True)
            else:
                emit('initial_data', {
                    'dados_pedido': dados_pedido}, broadcast=True)

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
            valor_pago = float(data.get('valor_pago'))
            dia = datetime.now().date()
            print(f'data de hoje : {dia}')
            valor_do_dia = db.execute('SELECT * FROM pagamentos WHERE dia = ?',dia)
            if valor_do_dia:
                antigo_valor = float(valor_do_dia[0]['faturamento'])
                db.execute('UPDATE pagamentos SET faturamento = ? WHERE dia = ?',valor_pago+antigo_valor,dia)
            else:
                db.execute('INSERT INTO pagamentos, (dia, faturamento) VALUES (?,?)',dia,valor_pago)


        db.execute('DELETE FROM pedidos WHERE comanda = ?', (comanda,))
        db.execute('DELETE FROM valores_pagos WHERE comanda = ?', (comanda,))

        emit('comanda_deleted', {'fcomanda': comanda}, broadcast=True)
    except Exception as e:
        print("Erro ao apagar comanda:", e)
        emit('error', {'message': str(e)})


@socketio.on('pagar_parcial')
def pagar_parcial(data):
    
    valor_pago = data.get('valor_pago')

    dia = datetime.now().date()
    print(f'data de hoje : {dia}')
    valor_do_dia = db.execute('SELECT * FROM pagamentos WHERE dia = ?',dia)
    if valor_do_dia:
        antigo_valor = float(valor_do_dia[0]['faturamento'])
        db.execute('UPDATE pagamentos SET faturamento = ? WHERE dia = ?',float(valor_pago)+antigo_valor,dia)
    else:
        db.execute('INSERT INTO pagamentos, (dia, faturamento) VALUES (?,?)',dia,float(valor_pago))



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
        if cont < 8:
            pedido = row['item']
            if pedido.startswith(data):
                cont += 1
                pedidos_filtrados.append(pedido)
        else:
            break
    emit('pedidos', pedidos_filtrados)


@socketio.on('categoria')
def categoria(data):
    pedido = data
    print(pedido)
    categoria = db.execute(
        'SELECT categoria_id FROM cardapio WHERE item = ?', pedido)
    print(categoria[0]['categoria_id'])
    if categoria[0]['categoria_id'] == 2:
        emit('showExtra', categoria, broadcast=True)


@socketio.on('get_ingredientes')
def get_ingredientes(data):
    item = data.get('ingrediente')  # Obtenha o nome do item
    index = data.get('index')  # Obtenha o índice do item na lista
    # Execute uma query no banco de dados para obter os ingredientes do item
    ingrediente = db.execute(
        'SELECT ingredientes FROM cardapio WHERE item = ?', item)

    if ingrediente:
        # Envia os ingredientes de volta para o cliente, junto com o índice correspondente
        emit('ingrediente', {
             'ingrediente': ingrediente[0]['ingredientes'], 'index': index}, broadcast=True)


@socketio.on('inserir_preparo')
def inserir_preparo(data):
    id = data.get('id')
    estado = data.get('estado')
    horario = datetime.now(pytz.timezone(
        'America/Sao_Paulo')).strftime('%H:%M')

    if estado == 'Pronto':
        db.execute('UPDATE pedidos SET fim = ? WHERE id = ?', horario, id)
    elif estado == 'Em Preparo':
        db.execute('UPDATE pedidos SET comecar = ? WHERE id = ?', horario, id)

    db.execute('UPDATE pedidos SET estado = ? WHERE id = ?',
               estado, id)

    dados_pedido = db.execute('SELECT * FROM pedidos')
    emit('initial_data', {'dados_pedido': dados_pedido}, broadcast=True)


@socketio.on('atualizar_estoque')
def atualizar_estoque(data):
    itensAlterados = data.get('itensAlterados')
    for i in itensAlterados:
        item = i['item']
        quantidade = i['quantidade']
        db.execute('UPDATE estoque SET quantidade = ? WHERE item = ?',
                   float(quantidade), item)
    dados_estoque = db.execute('SELECT * FROM estoque')
    emit('initial_data', {'dados_estoque': dados_estoque}, broadcast=True)


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
            raise Exception(
                "O número de itens em dados antigos e novos não é o mesmo.")
        print(len(dados_novos))

        for i in range(len(dados_antigos)):
            pedido = dados_antigos[i]['pedido']
            print("Processando pedido:", pedido)

            # Quantidade nova e antiga
            quantidade_nova = float(dados_novos[i]['quantidade'])
            quantidade_antiga = float(dados_antigos[i]['quantidade'])
            quantidade = quantidade_nova - quantidade_antiga

            if quantidade_nova != 0 and quantidade_nova != quantidade_antiga:
                # Busca o preço do cardápio
                preco = db.execute(
                    'SELECT preco FROM cardapio WHERE item = ?', pedido)

                # Busca o ID do pedido para atualizar
                id_pedido = dados_novos[i]['id']
                print(id_pedido)
                db.execute(
                    'UPDATE estoque SET quantidade = quantidade+ ? WHERE item = ?', quantidade*-1, pedido)

                novo_preco = float(preco[0]['preco'])
                db.execute('UPDATE pedidos SET quantidade = quantidade + ?, preco = preco + ? WHERE id = ?',
                           quantidade, quantidade*novo_preco, id_pedido)

            elif quantidade_nova == 0:
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

        emit('preco', {'preco': preco_total - preco_pago,
             'dados': dados, 'comanda': comanda}, broadcast=True)
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
        v_comanda_existe = db.execute(
            'SELECT pedido FROM pedidos WHERE comanda = ?', fcomanda)

        if v_comanda_existe:
            preco_total = float(
                total_comanda[0]['total']) if total_comanda else 0
            preco_pago = float(
                valor_pago[0]['valor_pago']) if valor_pago else 0
            print(preco_pago)
            print(preco_total)

            dados = db.execute('''
                SELECT pedido,id, SUM(quantidade) AS quantidade, SUM(preco) AS preco
                FROM pedidos WHERE comanda =? GROUP BY pedido
            ''', fcomanda)
            print(dados)
            print(type(dados))
            # Emitir os dados mais recentes da comanda e atualizar no frontend
            emit('preco', {'preco': preco_total - preco_pago,
                 'dados': dados, 'comanda': fcomanda}, broadcast=True)
        else:
            emit('preco', {'preco': '', 'dados': '',
                 'comanda': fcomanda}, broadcast=True)

    except Exception as e:
        print("Erro ao calcular preço:", e)
        emit('error', {'message': str(e)})


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
