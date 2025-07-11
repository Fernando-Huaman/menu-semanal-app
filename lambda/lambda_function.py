def lambda_handler(event, context):
    """
    Handler principal de Lambda
    Maneja todas las rutas de la API
    """
    print(f"Event received: {json.dumps(event)}")
    
    # Configurar headers CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    # Manejar preflight CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Obtener acción de query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action', '')
        
        # Test endpoint
        if action == 'test':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Lambda function is working!',
                    'timestamp': datetime.now().isoformat(),
                    'environment': {
                        'has_keyspaces_user': bool(os.environ.get('KEYSPACES_USER')),
                        'has_keyspaces_password': bool(os.environ.get('KEYSPACES_PASSWORD')),
                        'region': os.environ.get('AWS_REGION', 'not-set')
                    }
                })
            }
        
        # Determinar la acción basada en la ruta
        path = event.get('path', '')
        method = event.get('httpMethod', '')
        
        # Router simple
        if path == '/menu' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            response_data = generar_menu(body)
        elif path == '/platos' and method == 'GET':
            response_data = obtener_platos()
        elif path.startswith('/history/') and method == 'GET':
            user_id = path.split('/')[-1]
            response_data = obtener_historial(user_id)
        else:
            response_data = {'error': 'Ruta no encontrada', 'path': path, 'method': method}
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response_data, default=decimal_default)
        }
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Error interno del servidor',
                'message': str(e)
            })
        }

import json
import uuid
import os
from datetime import datetime
from decimal import Decimal
from database import KeyspacesConnection
from ml_model import MenuRandomForest
from utils import decimal_default

def lambda_handler(event, context):
    """
    Handler principal de Lambda
    Maneja todas las rutas de la API
    """
    print(f"Event received: {json.dumps(event)}")
    
    # Configurar headers CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    # Manejar preflight CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Determinar la acción basada en la ruta
        path = event.get('path', '')
        method = event.get('httpMethod', '')
        
        # Router simple
        if path == '/menu' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            response_data = generar_menu(body)
        elif path == '/platos' and method == 'GET':
            response_data = obtener_platos()
        elif path.startswith('/history/') and method == 'GET':
            user_id = path.split('/')[-1]
            response_data = obtener_historial(user_id)
        else:
            response_data = {'error': 'Ruta no encontrada'}
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response_data, default=decimal_default)
        }
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Error interno del servidor',
                'message': str(e)
            })
        }

def generar_menu(params):
    """
    Genera un menú semanal completo usando ML
    """
    print(f"Generando menú con parámetros: {params}")
    
    # Parámetros del request
    presupuesto = Decimal(str(params.get('presupuesto', 200)))
    pref_tipo = params.get('preferencias_tipo', [])
    pref_cat = params.get('preferencias_categoria', [])
    
    # Conectar a base de datos
    db = KeyspacesConnection()
    db.connect()
    
    try:
        # Obtener todos los platos
        platos = db.get_all_platos()
        print(f"Platos cargados: {len(platos)}")
        
        # Crear y usar el modelo ML
        modelo = MenuRandomForest(platos)
        menu_semanal = modelo.generar_menu_semanal(
            float(presupuesto), 
            pref_tipo, 
            pref_cat
        )
        
        # Calcular lista de compras
        lista_compras = calcular_lista_compras(menu_semanal, db)
        
        # Calcular presupuesto total real
        presupuesto_total = sum(
            Decimal(str(item['precio_total'])) 
            for item in lista_compras.values()
        )
        
        # Generar ID de usuario
        user_id = uuid.uuid4()
        
        # Guardar en base de datos
        db.save_menu(
            user_id,
            presupuesto,
            json.dumps(menu_semanal),
            json.dumps(lista_compras, default=decimal_default)
        )
        
        print(f"Menú generado exitosamente. ID: {user_id}")
        
        return {
            'success': True,
            'menu_semanal': menu_semanal,
            'lista_compras': lista_compras,
            'presupuesto_total': float(presupuesto_total),
            'user_id': str(user_id)
        }
        
    finally:
        db.close()

def calcular_lista_compras(menu_semanal, db):
    """
    Calcula la lista de compras consolidada para 2 personas
    Agrupa todos los ingredientes necesarios para la semana
    """
    ingredientes_totales = {}
    
    # Recorrer todo el menú
    for dia, momentos in menu_semanal.items():
        for momento, platos in momentos.items():
            for tipo_plato, plato in platos.items():
                if plato and 'ingredientes' in plato:
                    # Parsear ingredientes si es string JSON
                    if isinstance(plato['ingredientes'], str):
                        ingredientes = json.loads(plato['ingredientes'])
                    else:
                        ingredientes = plato['ingredientes']
                    
                    # Sumar cantidades (multiplicar por 2 para 2 personas)
                    for ing in ingredientes:
                        nombre = ing['ingrediente']
                        cantidad = ing['cantidad'] * 2
                        unidad = ing['unidad']
                        
                        if nombre not in ingredientes_totales:
                            precio_unitario = db.get_ingrediente_precio(nombre)
                            ingredientes_totales[nombre] = {
                                'cantidad': 0,
                                'unidad': unidad,
                                'precio_unitario': float(precio_unitario),
                                'categoria': db.get_ingrediente_categoria(nombre)
                            }
                        
                        ingredientes_totales[nombre]['cantidad'] += cantidad
    
    # Calcular precios totales y convertir unidades
    for nombre, datos in ingredientes_totales.items():
        # Convertir a unidades de compra del mercado
        cantidad_compra, unidad_compra = convertir_a_unidad_mercado(
            datos['cantidad'],
            datos['unidad'],
            nombre
        )
        
        datos['cantidad_compra'] = cantidad_compra
        datos['unidad_compra'] = unidad_compra
        
        # Calcular precio total
        if datos['unidad'] == 'g':
            cantidad_kg = datos['cantidad'] / 1000
        elif datos['unidad'] == 'ml':
            cantidad_kg = datos['cantidad'] / 1000
        else:
            cantidad_kg = datos['cantidad']
            
        datos['precio_total'] = cantidad_kg * datos['precio_unitario']
    
    return ingredientes_totales

def convertir_a_unidad_mercado(cantidad, unidad, ingrediente):
    """
    Convierte cantidades a unidades reales del mercado peruano
    """
    # Productos que se venden por unidad
    if ingrediente in ['huevo', 'pan francés', 'palta', 'limón']:
        if unidad == 'unidad':
            return (int(cantidad), 'unidades')
        elif unidad == 'g':
            # Estimar unidades según el peso promedio
            pesos = {
                'huevo': 50,
                'pan francés': 80,
                'palta': 200,
                'limón': 100
            }
            unidades = int(cantidad / pesos.get(ingrediente, 100)) + 1
            return (unidades, 'unidades')
    
    # Productos que se venden por atado
    if ingrediente in ['culantro', 'cebolla china', 'apio', 'huacatay']:
        return (1, 'atado')  # Siempre 1 atado para la semana
    
    # Productos en kg
    if unidad == 'g':
        kg = cantidad / 1000
        # Redondear a cuartos de kg
        kg_redondeado = max(0.25, round(kg * 4) / 4)
        return (kg_redondeado, 'kg')
    
    # Productos en litros
    if unidad == 'ml':
        litros = cantidad / 1000
        litros_redondeado = max(0.5, round(litros * 2) / 2)
        return (litros_redondeado, 'litro')
    
    return (cantidad, unidad)

def obtener_platos():
    """
    Obtiene la lista de todos los platos disponibles
    """
    db = KeyspacesConnection()
    db.connect()
    
    try:
        platos = db.get_all_platos()
        return {
            'success': True,
            'platos': platos,
            'total': len(platos)
        }
    finally:
        db.close()

def obtener_historial(user_id):
    """
    Obtiene el historial de menús de un usuario
    """
    db = KeyspacesConnection()
    db.connect()
    
    try:
        menus = db.get_user_menus(user_id)
        return {
            'success': True,
            'user_id': user_id,
            'menus': menus
        }
    finally:
        db.close()