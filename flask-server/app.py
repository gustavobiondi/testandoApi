
from flask import send_from_directory
import atexit
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from cs50 import SQL
from flask_cors import CORS
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import pytz
from pytz import timezone
import os
import pandas as pd
from io import BytesIO
import logging
logging.getLogger('matplotlib').setLevel(logging.WARNING)


# Inicialização do app Flask e SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'seu_segredo_aqui'
socketio = SocketIO(app, cors_allowed_origins="*")
db = SQL('sqlite:///dados.db')
CORS(app, resources={r"/*": {"origins": "*"}})  # Permite todas as origens
brazil = timezone('America/Sao_Paulo')

@app.route("/")
def home():
    return "Aplicação funcionando!", 200



@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)



def atualizar_faturamento_diario():
    hoje = datetime.now(brazil).date()
    ontem = datetime.now() - timedelta(days=1)
    dados = calcular_faturamento("Atualizar")
    faturamento_prev = dados['faturamento_previsto']
    drinks = dados['drink']
    porcao = dados['porcao']
    restantes = dados['restante']
    pedidos = dados['pedidos']
    db.execute("UPDATE pagamentos SET faturamento_prev = ?, drinks =?, porcoes=?, restantes=?, totais_pedidos=? WHERE dia = ?",
               faturamento_prev, drinks, porcao, restantes, pedidos, ontem)
    db.execute("INSERT INTO pagamentos (dia,faturamento, faturamento_prev, drinks, porcoes, restantes, totais_pedidos,caixinha) VALUES (?,0, 0, 0, 0, 0, 0,0)", hoje)
    print(db.execute("SELECT * FROM pagamentos"))
    db.execute("DELETE FROM pedidos")
    db.execute('UPDATE usuarios SET liberado = ? WHERE cargo != ?',0,'ADM')


# Agendador para rodar à meia-noite
scheduler = BackgroundScheduler()
scheduler.add_job(atualizar_faturamento_diario, 'cron', hour=1, minute=0, timezone = brazil)
scheduler.start()

# Garante que o scheduler pare quando encerrar o servidor
atexit.register(lambda: scheduler.shutdown())

@app.route('/opcoes', methods=['POST'])
def opc():
    print('entrou no opcoes')
    data = request.get_json()
    item = data.get('pedido')
    print(item) 
    opcoes = db.execute('SELECT opcoes FROM cardapio WHERE item = ?', item)
    if opcoes:
        palavra = ''
        selecionaveis = []
        dados = []
        for i in opcoes[0]['opcoes']:
            if i == '(':
                nome_selecionavel = palavra
                print(nome_selecionavel)
                palavra = ''
            elif i == '-':
                selecionaveis.append(palavra)
                palavra = ''
            elif i == ')':
                selecionaveis.append(palavra)
                dados.append({nome_selecionavel: selecionaveis})
                selecionaveis = []
                palavra = ''
            else:
                palavra += i
        print(dados)
        return {'options': dados}


@app.route('/pegar_pedidos', methods=['POST'])
def pegar_pedidos():
    # Pegando os dados do JSON enviado na requisição
    data = request.get_json()
    comanda = data.get('comanda')
    ordem = data.get('ordem')
    print(f'ORDEM : {ordem}')

    if int(ordem) != 0:
        # Executando a consulta no banco de dados
        dados = db.execute('''
            SELECT pedido, id, ordem, SUM(quantidade) AS quantidade, SUM(preco) AS preco
            FROM pedidos WHERE comanda = ? AND ordem = ?
            GROUP BY pedido
        ''', comanda, int(ordem))
        valor_pago = db.execute(
            'SELECT valor_pago FROM valores_pagos WHERE comanda = ?', comanda)
        total_comanda = db.execute('''
            SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ? AND ordem = ?
        ''', comanda, int(ordem))
        v_comanda_existe = db.execute(
            'SELECT pedido FROM pedidos WHERE comanda = ? AND ordem = ?', comanda, int(ordem))

        if v_comanda_existe:
            preco_total = float(
                total_comanda[0]['total']) if total_comanda else 0
            preco_pago = float(
                valor_pago[0]['valor_pago']) if valor_pago else 0
            print(preco_pago)
            print(preco_total)
            return {'data': dados, 'preco': preco_total-preco_pago}
    else:
        # Chama a função para pegar o cardápio se ordem for 0
        valor_pago = db.execute(
            'SELECT valor_pago FROM valores_pagos WHERE comanda = ?', comanda)
        total_comanda = db.execute('''
            SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ? AND ordem = ?
        ''', comanda, 0)
        v_comanda_existe = db.execute(
            'SELECT pedido FROM pedidos WHERE comanda = ? AND ordem = ?', comanda, 0)

        if v_comanda_existe:
            preco_total = float(
                total_comanda[0]['total']) if total_comanda else 0
            preco_pago = float(
                valor_pago[0]['valor_pago']) if valor_pago else 0
            print(preco_pago)
            print(preco_total)

            dados = db.execute('''
                SELECT pedido,id,ordem, SUM(quantidade) AS quantidade, SUM(preco) AS preco
                FROM pedidos WHERE comanda =? AND ordem = ? GROUP BY pedido
            ''', comanda, 0)
            print(dados)
            print(type(dados))
            return {'data': dados, 'preco': preco_total-preco_pago}
    return {'data': '', 'preco': ''}





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

    categoria = db.execute(
        'SELECT categoria_id FROM cardapio WHERE item = ?', item)

    if categoria and categoria[0]['categoria_id'] != 2:
        verificar_estoque = db.execute(
            'SELECT quantidade FROM estoque WHERE item = ?', item)

        if verificar_estoque:
            estoque_atual = float(verificar_estoque[0]['quantidade'])
            if estoque_atual - float(quantidade) < 0:
                return {'erro': 'Estoque insuficiente', 'quantidade': estoque_atual}
            else:
                return {'erro': False, 'quantidade': estoque_atual}
    return {'erro': False}


@app.route('/verificar_quantidade_enviar', methods=['POST'])
def verificar_quantidade():
    data = request.json  # Use request.json para pegar o corpo da requisição
    item = data.get('item')
    quantidade = data.get('quantidade')
    categoria = db.execute(
        'SELECT categoria_id FROM cardapio WHERE item = ?', item)
    if categoria[0]['categoria_id'] != 2:
        verificar_estoque = db.execute(
            'SELECT quantidade FROM estoque WHERE item = ?', item)

        if verificar_estoque:
            estoque_atual = float(verificar_estoque[0]['quantidade'])
            if estoque_atual - float(quantidade) < 0:
                return {'erro': True, 'quantidade': estoque_atual}
            else:
                return {'erro': False, 'quantidade': estoque_atual}
    return {'erro': False}






@app.route('/changeBrinde', methods=['POST'])
def change_brinde():
    datas = request.json
    data = datas.get('pedido').lower()
    print(data)
    pedidos = db.execute('SELECT item FROM cardapio')
    pedidos_filtrados = []
    cont = 0
    for row in pedidos:
        if cont < 2:
            pedido = row['item']
            if pedido.startswith(data):
                cont += 1
                pedidos_filtrados.append(pedido)
        else:
            break
    return {'data': pedidos_filtrados}

# Manipulador de conexão


@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')
    dados_pedido = db.execute('SELECT * FROM pedidos')
    dados_estoque = db.execute('SELECT * FROM estoque')
    dados_comandaAberta = db.execute(
        'SELECT comanda FROM pedidos WHERE ordem = ? GROUP BY comanda', 0)
    dados_comandaFechada = db.execute(
        'SELECT comanda,ordem FROM pedidos WHERE ordem !=? GROUP BY comanda', 0)
    dados_estoque_geral = db.execute('SELECT * FROM estoque_geral')
    dados_cardapio = db.execute('SELECT * FROM cardapio')
    users()
    emit('initial_data', {'dados_pedido': dados_pedido,
         'dados_estoque': dados_estoque, 'comandasAbertas': dados_comandaAberta, 'comandasFechadas': dados_comandaFechada,
           'dados_estoque_geral': dados_estoque_geral,'dados_cardapio':dados_cardapio}, broadcast=True)


# Manipulador de desconexão


@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

# Manipulador para inserir dados


@socketio.on('refresh')
def refresh():
    handle_connect()

@socketio.on('EditingEstoque')
def editEstoque(data):
    print('editar estoque')
    tipo = data.get('tipo')
    item = data.get('item')
    novoNome = data.get('novoNome')
    quantidade = data.get('quantidade')
    estoque_ideal = data.get('estoqueIdeal')
    estoque = data.get('estoque')
    print("item", tipo)
    print("item", item)
    print("item", quantidade)
    print("item", estoque_ideal)
    print("estoque", estoque)
    if not item: emit(f'{estoque}Alterado', {'erro':'Item nao identificado'})
    if tipo == 'Adicionar':
        print("Entrou no adicionar")                                            
        if db.execute(f'SELECT item FROM {estoque} WHERE item = ?',item): emit(f'{estoque}Alterado',{'erro':'Nome Igual'})
        db.execute(f"INSERT INTO {estoque} (item,quantidade,estoque_ideal) VALUES (?,?,?)",item,quantidade,estoque_ideal)
    elif tipo == 'Remover':
        db.execute(f"DELETE FROM {estoque} WHERE item=?",item)
    else:
        if estoque_ideal:
            db.execute(f"UPDATE {estoque} SET item=?, estoque_ideal=? WHERE item=?",novoNome, estoque_ideal,item )
        elif not novoNome:
            db.execute(f"UPDATE {estoque} SET estoque_ideal=? WHERE item=?",estoque_ideal,item    )
        else:
            db.execute(f"UPDATE {estoque} SET item=? WHERE item=?",novoNome,item ) 
    estoque_novo = db.execute(f'SELECT * FROM {estoque}',)
    emit('initial_data',{f'dados_{estoque}':estoque_novo},broadcast=True)
            


     



@socketio.on('insert_order')
def handle_insert_order(data):
    try:

        comanda = data.get('comanda')
        pedidos = data.get('pedidosSelecionados')
        quantidades = data.get('quantidadeSelecionada')
        horario = data.get('horario')
        username = data.get('username')
        preco = data.get('preco')
        nomes = data.get('nomeSelecionado')
        opcoesSelecionadas = data.get('opcoesSelecionadas')
        print(f"opcoesSelecionadas = {opcoesSelecionadas}")
        valorExtra = []
        if opcoesSelecionadas:
            extraSelecionados = data.get('extraSelecionados')
            extra = []

            for j in range(len(extraSelecionados)):
                extras = ''
                print(extraSelecionados)

                # Verifica se todas as opções selecionadas são listas
                if all(isinstance(item, list) for item in opcoesSelecionadas):
                    print('multiplo')
                    chave = ' '.join(opcoesSelecionadas[j])
                    for i in opcoesSelecionadas[j]:
                        if '+' in i:
                            # Separa o item e o preço extra
                            item, precoExtra = i.split('+')
                            precoExtra = int(precoExtra)

                            # Atualiza ou adiciona o preço extra na lista
                            estava = False

                            for key in valorExtra:
                                if pedidos[j]+chave in key:
                                    precoAntigo = key[pedidos[j] +
                                                      chave]
                                    key[pedidos[j]+chave
                                        ] = precoAntigo + precoExtra
                                    estava = True
                                    break

                            if not estava:
                                valorExtra.append(
                                    {pedidos[j]+chave: precoExtra})
                        else:
                            item = i

                        extras += f'{item} '
                else:
                    print('solo')
                    chave = ' '.join(opcoesSelecionadas)
                    for i in opcoesSelecionadas:
                        if '+' in i:
                            item, precoExtra = i.split('+')
                            precoExtra = int(precoExtra)

                            estava = False

                            for key in valorExtra:
                                if pedidos[j]+chave in key:
                                    precoAntigo = key[pedidos[j]+chave]
                                    key[pedidos[j]+chave] = precoAntigo + \
                                        precoExtra
                                    estava = True
                                    break

                            if not estava:
                                valorExtra.append(
                                    {pedidos[j]+chave: precoExtra})
                        else:
                            item = i

                        extras += f'{item} '

                # Adiciona extraSelecionados[j] ao final
                extras += extraSelecionados[j]
                print(extras)
                extra.append(extras)

        else:
            extra = data.get('extraSelecionados')
        print(f'Valor extra: {valorExtra}')
        print(username)
        print(comanda)
        print(pedidos)
        print(quantidades)
        print(horario)
        print(nomes)
        if not nomes:
            nomes = []
            for i in range(len(pedidos)):
                nomes.append('-1')
        for i in range(len(pedidos)):
            pedido = pedidos[i]

            quantidade = quantidades[i]
            preco_unitario = db.execute(
                'SELECT preco,categoria_id FROM cardapio WHERE item = ?', pedido)
            if preco_unitario:
                categoria = preco_unitario[0]['categoria_id']
                print('if')
            else:
                categoria = '4'
                print('else')
            if not extra[i]:
                extra[i] = " "
            if not nomes[i]:
                nomes[i] = "-1"
            print("extra", extra)
            estava = 'a'

            if preco:
                print('brinde')
                db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,extra,username,ordem,nome) VALUES (?, ?, ?,?,?,?,?,?,?,?,?)',
                           comanda, pedido, float(quantidade), 0, categoria, horario, 'A Fazer', extra[i], username, 0, nomes[i])
            elif not preco_unitario:
                db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,extra,username,ordem,nome) VALUES (?, ?, ?,?,?,?,?,?,?,?,?)',
                           comanda, pedido, float(quantidade), 0, 4, horario, 'A Fazer', extra[i], username, 0, nomes[i])
            elif not valorExtra:
                db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,extra,username,ordem,nome) VALUES (?, ?, ?,?,?,?,?,?,?,?,?)',
                           comanda, pedido, float(quantidade), float(preco_unitario[0]['preco'])*float(quantidade), categoria, horario, 'A Fazer', extra[i], username, 0, nomes[i])
            else:
                brek = False
                contV = -1
                for item in valorExtra:
                    contV += 1
                    if brek:
                        break
                    for cont in range(len(opcoesSelecionadas)):
                        if all(isinstance(ass, list) for ass in opcoesSelecionadas):
                            chave = pedido+' '.join(opcoesSelecionadas[cont])
                        else:
                            chave = pedido+' '.join(opcoesSelecionadas)
                        if chave in item:
                            valor_inserido = float(
                                item[chave]) * float(quantidade)
                            print(
                                f'Inserindo valor {valor_inserido} no pedido {pedido}')
                            db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,extra,username,ordem,nome) VALUES (?, ?, ?,?,?,?,?,?,?,?,?)',
                                       comanda, pedido, float(quantidade), (float(preco_unitario[0]['preco'])*float(quantidade))+valor_inserido, categoria, horario, 'A Fazer', extra[i], username, 0, nomes[i])
                            estava = 'b'
                            del (valorExtra[contV])
                            brek = True
                            break
                    if estava == 'a':
                        db.execute('INSERT INTO pedidos(comanda, pedido, quantidade,preco,categoria,inicio,estado,extra,username,ordem,nome) VALUES (?, ?, ?,?,?,?,?,?,?,?,?)',
                                   comanda, pedido, float(quantidade), float(preco_unitario[0]['preco'])*float(quantidade), categoria, horario, 'A Fazer', extra[i], username, 0, nomes[i])

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


@socketio.on('faturamento')
def faturamento():
    dia = datetime.now(brazil).date()

    # Executar a consulta e pegar o resultado
    faturament = db.execute(
        'SELECT faturamento,caixinha FROM pagamentos WHERE dia = ?', dia)
    faturamento = faturament[0]['faturamento'] if faturament else '0'
    caixinha = faturament[0]['caixinha'] if faturament[0]['caixinha'] else '0'
    faturamento_prev = db.execute(
        "SELECT SUM (preco*quantidade) AS valor_previsto FROM pedidos")
    faturamento_previsto = faturamento_prev[0]['valor_previsto'] if faturamento_prev[0]['valor_previsto'] else '0'
    drinks = db.execute(
        "SELECT SUM(quantidade) AS totaldrink,SUM(preco)as preco_drinks FROM pedidos WHERE categoria =?", 2)
    preco_drink = drinks[0]['preco_drinks'] if drinks[0]['preco_drinks'] else '0'
    drink = drinks[0]['totaldrink'] if drinks[0]['totaldrink'] else '0'

    print(f'faturamento = {faturamento}')
    print(faturamento_previsto)
    print(f"drinks: {drink}")
    porcaos = db.execute(
        "SELECT SUM(quantidade) AS totalporcao, SUM(preco) AS preco_porcoes FROM pedidos WHERE categoria =?", 3)
    porcao = porcaos[0]["totalporcao"] if porcaos[0]["totalporcao"] else 0
    
    Restantes = db.execute(
        "SELECT SUM(quantidade) AS restantes,SUM(preco) as preco_restantes FROM pedidos WHERE categoria = ?", 1)
    restante = Restantes[0]["restantes"] if Restantes[0]["restantes"] else 0
    
    pedidostotais = db.execute(
        "SELECT SUM(quantidade) AS pedidostotais FROM pedidos")
    pedidos = pedidostotais[0]["pedidostotais"] if pedidostotais[0]["pedidostotais"] else '0'

    print(f"caixinha = {caixinha}")

    emit('faturamento_enviar', {'dia': str(dia),
                                'faturamento': faturamento,
                                'faturamento_previsto': faturamento_previsto,
                                'drink': drink,
                                'porcao': porcao,
                                "restante": restante,
                                "pedidos": pedidos,
                                "caixinha": caixinha,
                                },
         broadcast=True,
         )

@socketio.on('alterarValor')
def alterarValor(data):
    dia = datetime.now(brazil).date()
    valor = float(data.get('valor'))
    categoria = data.get('categoria')
    comanda = data.get('comanda')
    print("VALOR :", valor)
    print('categoria:', categoria)
    print(f'comanda: {comanda}')
    if data:
        if categoria == "Caixinha":
            db.execute(
                'UPDATE pagamentos SET caixinha = caixinha + ? WHERE dia = ?', valor, dia)
        else:
            db.execute(
                "INSERT INTO pedidos (pedido,quantidade,preco,comanda,ordem) VALUES (?,?,?,?,?)", "DESCONTO", 1, valor*-1, comanda, 0)
    faturamento()
    handle_get_cardapio()


def calcular_faturamento(data):
    dia = datetime.now(brazil).date()

    # Executar a consulta e pegar o resultado
    faturament = db.execute(
        'SELECT faturamento FROM pagamentos WHERE dia = ?', dia)
    faturamento = faturament[0]['faturamento'] if faturament else '0'
    dia_formatado = dia.strftime('%d/%m')

    faturamento_prev = db.execute(
        "SELECT SUM (preco*quantidade) AS valor_previsto FROM pedidos")
    faturamento_previsto = faturamento_prev[0]['valor_previsto'] if faturamento_prev[0]['valor_previsto'] else '0'
    drinks = db.execute(
        "SELECT SUM(quantidade) AS totaldrink FROM pedidos WHERE categoria =?", 2)

    drink = drinks[0]['totaldrink'] if drinks[0]['totaldrink'] else '0'

    print(f'faturamento = {faturamento}')
    print(faturamento_previsto)
    print(f"drinks: {drink}")
    porcaos = db.execute(
        "SELECT SUM(quantidade) AS totalporcao FROM pedidos WHERE categoria =?", 3)
    porcao = porcaos[0]["totalporcao"] if porcaos[0]["totalporcao"] else 0
    Restantes = db.execute(
        "SELECT SUM(quantidade) AS restantes FROM pedidos WHERE categoria = ?", 1)
    restante = Restantes[0]["restantes"] if Restantes[0]["restantes"] else 0
    pedidostotais = db.execute(
        "SELECT SUM(quantidade) AS pedidostotais FROM pedidos")
    pedidos = pedidostotais[0]["pedidostotais"] if pedidostotais[0]["pedidostotais"] else '0'
    return ({'faturamento_previsto': faturamento_previsto,
             'drink': drink,
             'porcao': porcao,
             "restante": restante,
             "pedidos": pedidos, })


@socketio.on('atualizar_pedidos')
def handle_atualizar_pedidos(data):
    p = data.get('pedidoAlterado')
    preco = db.execute(
        'SELECT preco,quantidade FROM pedidos WHERE id = ?', p['id'])
    if preco :
        if preco[0]['preco'] == p['preco']:
            p['preco'] = float(preco[0]['preco'])/float(preco[0]
                                                        ['quantidade'])*float(p['quantidade'])

        db.execute("UPDATE pedidos SET comanda = ?, pedido = ?, quantidade = ?, extra = ?,preco = ? WHERE id = ?",
               p['comanda'], p['pedido'], p['quantidade'], p['extra'], p['preco'], p['id'])
    handle_connect()


@socketio.on('desfazer_pagamento')
def desfazer_pagamento(data):
    comanda = data.get('comanda')
    print(comanda)
    prec = db.execute('SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ? AND ordem = ?',comanda,1)

    db.execute(
        'UPDATE pedidos SET ordem = ordem-? WHERE comanda = ? AND ordem>?', 1, comanda, 0)
    db.execute(
        'UPDATE valores_pagos SET ordem = ordem - ? WHERE comanda = ?', 1, comanda)
    
    print(prec)
    if prec[0]['total']:
        preco = float(prec[0]['total'])
        valor = db.execute("SELECT valor_pago FROM valores_pagos WHERE ordem = ? AND comanda = ?",0,comanda)
        if valor:
            preco -= float(valor[0]['valor_pago'])
        dia = datetime.now(brazil).date()
        db.execute(
        'UPDATE pagamentos SET faturamento = faturamento - ? WHERE dia = ?', float(preco), dia)
        print(f'preco DESFAZER PAGAMNTO : {preco}')

        faturamento()
    handle_get_cardapio(comanda)


@socketio.on('pesquisa_comanda')
def pesquisa_comanda(data):
    comanda = data.get('comanda')
    comandas = db.execute(
        'SELECT comanda FROM pedidos WHERE ordem = ? GROUP BY comanda', 0)
    comandas_filtradas = []
    cont = 0
    for row in comandas:
        if cont < 3:
            pedido = row['comanda']
            if pedido.startswith(comanda):
                cont += 1
                comandas_filtradas.append(pedido)
        else:
            break
    emit('comandas', comandas_filtradas)


@socketio.on('pesquisa_abrir_comanda')
def pesquisa_abrir_comanda(data):
    comanda = data.get('comanda').lower()
    comandas = db.execute(
        'SELECT comanda FROM pedidos WHERE ordem = ? GROUP BY comanda', 0)
    comandas_filtradas = []
    cont = 0
    for row in comandas:
        if cont < 3:
            pedido = row['comanda']
            if pedido.startswith(comanda):
                cont += 1
                comandas_filtradas.append(pedido)
        else:
            break
    emit('comandas_abrir', comandas_filtradas)


@socketio.on('delete_comanda')
def handle_delete_comanda(data):
    try:
        # Identificar a comanda recebida
        if type(data) == str:
            comanda = data
        else:
            comanda = data.get('fcomanda')
            valor_pago = float(data.get('valor_pago'))
            dia = datetime.now(brazil).date()
            print(f'Data de hoje: {dia}')

            # Verificar se já existe um pagamento registrado para o dia
            valor_do_dia = db.execute(
                # Adicionando tupla para os parâmetros
                'SELECT * FROM pagamentos WHERE dia = ?', dia)

            if valor_do_dia:
                
                antigo_valor = float(valor_do_dia[0]['faturamento']) if valor_do_dia[0]['faturamento'] else 0
                db.execute(
                    'UPDATE pagamentos SET faturamento = ? WHERE dia = ?',
                    valor_pago + antigo_valor, dia
                )
            else:
                # Corrigido o SQL, removendo a vírgula desnecessária
                db.execute(
                    'INSERT INTO pagamentos (dia, faturamento) VALUES (?, ?)',
                    dia, valor_pago
                )

        # Apagar o valor pago referente à comanda
        db.execute(
            'UPDATE valores_pagos SET ordem = ordem +? WHERE comanda = ?', 1, comanda)

        # Atualizar a ordem da comanda
        db.execute('UPDATE pedidos SET ordem = ordem +? WHERE comanda = ?',
                   1, comanda)

        # Emitir o evento de comanda apagada
        handle_connect()
        emit('comanda_deleted', {'fcomanda': comanda}, broadcast=True)

    except Exception as e:
        print("Erro ao apagar comanda:", e)
        emit('error', {'message': str(e)})


@socketio.on('pagar_parcial')
def pagar_parcial(data):
    comanda = data.get('fcomanda')
    print(f'pagar parcial comanda : ', end='')
    print(comanda)
    valor_pago = data.get('valor_pago')

    dia = datetime.now(brazil).date()
    print(f'data de hoje : {dia}')
    valor_do_dia = db.execute('SELECT * FROM pagamentos WHERE dia = ?', dia)
    if valor_do_dia:
        antigo_valor = float(valor_do_dia[0]['faturamento'])
        db.execute('UPDATE pagamentos SET faturamento = ? WHERE dia = ?',
                   float(valor_pago)+antigo_valor, dia)
    else:
        db.execute(
            'INSERT INTO pagamentos (dia, faturamento) VALUES (?,?)', dia, float(valor_pago))

    preco_pago = db.execute(
        'SELECT valor_pago FROM valores_pagos WHERE comanda = ? AND ORDEM = ?', comanda, 0)

    if not preco_pago:
        db.execute('INSERT INTO valores_pagos (comanda,valor_pago,ordem) VALUES(?,?,?)',
                   comanda, float(valor_pago), 0)

        valor_total = float(valor_pago)
    else:
        valor_total = float(valor_pago) + float(preco_pago[0]['valor_pago'])
        db.execute(
            'UPDATE valores_pagos SET valor_pago = ? WHERE comanda = ? AND ordem = ?', valor_total, comanda, 0)

    total_comanda = db.execute('''
            SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ? AND ordem = ?
        ''', comanda, 0)
    print(total_comanda)
    if valor_total >= float(total_comanda[0]['total']):
        handle_delete_comanda(comanda)
    handle_get_cardapio(comanda)


@socketio.on('pesquisa')
def pesquisa(data):
    data_min = data.lower()
    pedidos = db.execute('SELECT item FROM cardapio')
    pedidos_filtrados = []
    cont = 0
    if data_min.startswith("."):
        pedido = db.execute(
            "SELECT item FROM cardapio WHERE id =?", data_min[1:])
        if pedido:
            pedidos_filtrados.append(pedido[0]['item'])

        emit('pedidos', pedidos_filtrados)
    else:
        for row in pedidos:
            if cont < 8:
                pedido = row['item']
                if pedido.startswith(data_min):
                    cont += 1
                    pedidos_filtrados.append(pedido)
            else:
                break
        print(pedidos_filtrados)
        emit('pedidos', pedidos_filtrados)


@socketio.on('get_ingredientes')
def get_ingredientes(data):
    item = data.get('ingrediente')
    ingredientes = db.execute(
        'SELECT instrucoes FROM cardapio WHERE item = ?', item)

    if ingredientes:
        ingrediente = ingredientes[0]['instrucoes']
        data = []
        letras = ''
        key = ''
        dado = ''
        for j in ingrediente:
            if j == ':':
                key = letras
                letras = ''
            elif j == '-':
                dado = letras
                letras = ''
                data.append({'key': key, 'dado': dado})
            else:
                letras += j
        print(data)
        emit('ingrediente', {
             'data': data})


@socketio.on('inserir_preparo')
def inserir_preparo(data):
    id = data.get('id')
    estado = data.get('estado')
    horario = datetime.now(pytz.timezone(
        "America/Sao_Paulo")).strftime('%H:%M')

    if estado == 'Pronto':
        db.execute('UPDATE pedidos SET fim = ? WHERE id = ?', horario, id)
    elif estado == 'Em Preparo':
        db.execute('UPDATE pedidos SET comecar = ? WHERE id = ?', horario, id)

    db.execute('UPDATE pedidos SET estado = ? WHERE id = ?',
               estado, id)

    dados_pedido = db.execute('SELECT * FROM pedidos')
    emit('initial_data', {'dados_pedido': dados_pedido}, broadcast=True)


@socketio.on('atualizar_estoque_geral')
def atualizar_estoque_geral(data):
    itensAlterados = data.get('itensAlterados')
    for i in itensAlterados:
        item = i['item']
        quantidade = i['quantidade']
        db.execute('UPDATE estoque_geral SET quantidade = ? WHERE item = ?',
                   float(quantidade), item)
    dados_estoque_geral = db.execute('SELECT * FROM estoque_geral')
    emit('initial_data', {
         'dados_estoque_geral': dados_estoque_geral}, broadcast=True)


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
def atualizar__comanda(data):
    print(data)
    itensAlterados = data.get('itensAlterados')
    print(itensAlterados)
    comanda = data.get('comanda')
    for i in itensAlterados:

        item = i['pedido']

        quantidade = float(i['quantidade'])
        print(f'quantidade = {quantidade}')
        if quantidade == 0:
            quantidade_total_dic = db.execute('''SELECT quantidade,id FROM pedidos
            WHERE pedido = ? AND comanda = ? AND ordem = ?;
                ''', item, comanda, 0)
            quantidade_total = 0
            for j in quantidade_total_dic:
                quantidade_total += float(j['quantidade'])
            verifEstoq = db.execute(
                'SELECT * FROM estoque WHERE item = ?', item)
            if verifEstoq:
                db.execute(
                    'UPDATE estoque SET quantidade = quantidade + ? WHERE item = ?', quantidade_total, item)

            db.execute(
                'DELETE FROM pedidos WHERE pedido = ? AND comanda = ? AND ordem = ?', item, comanda, 0)
        else:
            print(i['preco'])
            preco = float(i['preco'])/quantidade
            print(f'quantidade {quantidade}')
            print(f'preco {preco}')
            quantidade_total_dic = db.execute('''SELECT quantidade,id FROM pedidos
                WHERE pedido = ? AND comanda = ? AND ordem = ? AND preco / quantidade = ?;
                    ''', item, comanda, 0, preco)
            quantidade_total = 0
            for j in quantidade_total_dic:
                quantidade_total += float(j['quantidade'])
            quantidade_atualizada = (quantidade_total - quantidade)*-1
            print(f'quantidade atualizada acima {quantidade_atualizada}')
            preco_atualizado = preco*quantidade_atualizada

            if quantidade_atualizada < 0:
                quantidade_atualizada *= -1
                ids = db.execute(
                    'SELECT id,quantidade FROM pedidos WHERE pedido = ? AND comanda = ? AND ordem = ?', item, comanda, 0)
                verifEstoq = db.execute(
                    'SELECT * FROM estoque WHERE item = ?', item)
                if verifEstoq:
                    db.execute(
                        'UPDATE estoque SET quantidade = quantidade + ? WHERE item = ?', quantidade_atualizada, item)
                for k in ids:
                    if quantidade_atualizada > 0:
                        print(f'quantidade atualizada {quantidade_atualizada}')
                        print(f'k["quantidade"] {k["quantidade"]}')
                        if float(k['quantidade']) <= quantidade_atualizada:
                            db.execute(
                                'DELETE FROM pedidos WHERE id = ?', k['id'])
                            quantidade_atualizada -= float(k['quantidade'])
                        else:
                            db.execute(
                                'UPDATE pedidos SET  preco = preco/quantidade * (quantidade - ?),quantidade = quantidade - ? WHERE id = ?', quantidade_atualizada, quantidade_atualizada, k['id'])
                            quantidade_atualizada -= float(k['quantidade'])

            else:
                print(quantidade_total_dic)
                db.execute('UPDATE pedidos SET quantidade = quantidade + ?,preco = preco + ? WHERE pedido = ? AND comanda = ? AND ordem = ? AND id = ?',
                           quantidade_atualizada, preco_atualizado, item, comanda, 0, quantidade_total_dic[0]['id'])
                verifEstoq = db.execute(
                    'SELECT * FROM estoque WHERE item = ?', item)
                if verifEstoq:
                    db.execute(
                        'UPDATE estoque SET quantidade = quantidade - ? WHERE item = ?', quantidade_atualizada, item)

            db.execute('''
                            DELETE FROM pedidos
                            WHERE id IN (
                                SELECT id
                                FROM (
                                    SELECT id
                                    FROM pedidos
                                    WHERE comanda = ?
                                    AND ordem = 0
                                    GROUP BY pedido
                                    HAVING SUM(quantidade) = 0
                                ) subquery
                            );
                        ''', comanda)

    handle_get_cardapio(comanda)
    handle_connect()


@socketio.on('get_cardapio')
def handle_get_cardapio(data):
    print('get_cardapio')
    try:
        if type(data) == str:
            fcomanda = data
            ordem = 0

        else:
            fcomanda = data.get('fcomanda')
            ordem = data.get('ordem')
        if not fcomanda:
            raise ValueError('Comanda não informada')
        if ordem == 0:
            valor_pago = db.execute(
                'SELECT valor_pago FROM valores_pagos WHERE comanda = ? AND ordem = ?', fcomanda, ordem)
            total_comanda = db.execute('''
                SELECT SUM(preco) AS total FROM pedidos WHERE comanda = ? AND ordem = ?
            ''', fcomanda, ordem)
            v_comanda_existe = db.execute(
                'SELECT pedido FROM pedidos WHERE comanda = ? AND ordem = ?', fcomanda, ordem)

            if v_comanda_existe:
                preco_total = float(
                    total_comanda[0]['total']) if total_comanda else 0
                preco_pago = float(
                    valor_pago[0]['valor_pago']) if valor_pago else 0
                print(preco_pago)
                print(preco_total)

                dados = db.execute('''
                    SELECT pedido,id,ordem,nome,extra, SUM(quantidade) AS quantidade, SUM(preco) AS preco
                    FROM pedidos WHERE comanda =? AND ordem = ? GROUP BY pedido, preco
                ''', fcomanda, ordem)
                nomes = db.execute(
                    'SELECT nome FROM pedidos WHERE comanda = ? AND ordem = ? AND nome != ? GROUP BY nome', fcomanda, ordem, '-1')
                print(dados)
                print(type(dados))
                # Emitir os dados mais recentes da comanda e atualizar no frontend
                preco_a_pagar = preco_total-preco_pago
                emit('preco', {'preco_a_pagar': preco_a_pagar, 'preco_total': preco_total, 'preco_pago': preco_pago,
                               'dados': dados, 'comanda': fcomanda, 'nomes': nomes}, broadcast=True)
                handle_connect()
            else:
                emit('preco', {'preco_a_pagar': '', 'preco_total': '', 'preco_pago': '', 'dados': '', 'nomes': '',
                               'comanda': fcomanda}, broadcast=True)
                handle_connect()
        else:
            dados = db.execute('''
                    SELECT pedido,id,ordem,nome,extra, SUM(quantidade) AS quantidade, SUM(preco) AS preco
                    FROM pedidos WHERE comanda =? AND ordem = ? GROUP BY pedido, preco
                ''', fcomanda, ordem)
            emit('preco', {'preco_a_pagar': '', 'preco_total': '', 'preco_pago': '', 'dados': dados, 'nomes': '',
                           'comanda': fcomanda}, broadcast=True)
            handle_connect()

    except Exception as e:
        print("Erro ao calcular preço:", e)
        emit('error', {'message': str(e)})

@socketio.on('permitir')
def permitir(data):
    id = data.get('id')
    # Corrigido para buscar 'numero', que está vindo do frontend
    numero = data.get('numero')
    db.execute('UPDATE usuarios SET liberado = ? WHERE id = ?',
               numero, id)  # Atualiza a coluna 'liberado'
    users()

@socketio.on('users')
def users():
    users = db.execute('SELECT * from usuarios')
    emit('usuarios',{'users': users},broadcast=True)

@socketio.on('Delete_user')
def delete_user(data):
    id = data.get('id')
    db.execute('DELETE FROM usuarios WHERE id = ?',id)
    users()

@socketio.on('cadastrar')
def cadastro(data):
    print('entrou')
    username = data.get('username')
    cargo = data.get('cargo')
    print(username)
    senha = data.get('senha')
    print(senha)
    db.execute('INSERT INTO usuarios (username,senha,cargo,liberado) VALUES (?,?,?,?)',
               username, senha, cargo, '1')
    print('sucesso'
          )
    users()

@socketio.on('Alterar_cardapio')
def alterar_cardapio(data):
    categoria = data.get('categoria')
    item = data.get('item')
    preco=data.get(preco)

    
    if categoria=='Bebida':
        Frutas = data.get('frutas')
        Modalidade = data.get('modalidade')
        Instrucoes = data.get('instrucao')
        categoria_id = 2
        if tipo=='Adicionar':
            if Frutas:
                opcoes+=Frutas
            if Modalidade:
                instru+='Tamanho'+tamanho
            adicionais = data.get('adicionais')
            if adicionais:
                opcoes+= 'Adicionais'+adicionais 
            if opcoes:
               db.execute("INSERT INTO cardapio (item,preco,categoria_id,opcoes) VALUES (?,?,?,?)",item,preco,categoria_id,opcoes)
            else: db.execute("INSERT INTO cardapio (item,preco,categoria_id) VALUES (?,?,?)",item,preco,categoria_id)     
    
    elif categoria=='Porção':
        categoria_id = 3
        opcoes = ''
        if tipo == 'Adicionar':
            tamanho = data.get('tamanho')
            if tamanho:
                opcoes+='Tamanho'+tamanho
            adicionais = data.get('adicionais')
            if adicionais:
                opcoes+= 'Adicionais'+adicionais 
            if opcoes:
               db.execute("INSERT INTO cardapio (item,preco,categoria_id,opcoes) VALUES (?,?,?,?)",item,preco,categoria_id,opcoes)
            else: db.execute("INSERT INTO cardapio (item,preco,categoria_id) VALUES (?,?,?)",item,preco,categoria_id)
        elif tipo == 'Editar':
            novoNome=data.get('novoNome')
            item_tamanho = db.execute('SELECT opcoes FROM cardapio WHERE item=?',item)
            if item_tamanho:
                if 'Tamanho' in item_tamanho[0]['opcoes']:
                    tamanhoFormatado = data.get('tamanho')
                else:
                    tamanhoFormatado ='Tamanho'+data.get('tamanho')
                    if tamanhoFormatado:
                        opcoes += tamanhoFormatado
            item_adicionais = db.execute('SELECT opcoes FROM cardapio WHERE item=?',item)
            if item_adicionais:
                if ('Adicionais') in item_adicionais[0]['opcoes']:
                    adicionaisFormatado = data.get('adicionais')
                else:
                    adicionaisFormatado ='Adicionais'+data.get('adicionais')
                    if data.get('adicionais'):
                        opcoes+=adicionaisFormatado
        else: db.execute("DELETE FROM cardapio WHERE item=?",item)
    else:
        categoria_id = 1
        if tipo=="Adicionar":
            db.execute('INSERT INTO cardapio (item,preco,categoria_id) VALUES(?,?,?)',item,preco,categoria_id)
        elif tipo=="Editar":
            novoNome=data.get('novoNome')
            if novoNome:
                db.execute('UPDATE cardapio set item = ?,preco = ?,categoria_id = ?',novoNome,preco,categoria_id)
            else: db.execute('UPDATE cardapio set preco = ?,categoria_id = ?',preco,categoria_id)
    
    tipo = data.get('tipo')
    preco = data.get('preco')
    if tipo =='Adicionar':
        novoNome = data.get('novoNome')
        if item:
            i
            


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    socketio.run(app, host='0.0.0.0', port=port)
