import uuid
import json
import os
from datetime import datetime
from decimal import Decimal
from database import KeyspacesConnection
from ml_model import MenuRandomForest
from utils import (
    calcular_lista_compras,
    calcular_info_nutricional,
    decimal_default
)

# Inicializar conexión global
db = KeyspacesConnection()

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
                        'region': os.environ.get('AWS_REGION', 'not-set'),
                        'aws_default_region': os.environ.get('AWS_DEFAULT_REGION', 'not-set')
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

def generar_menu(params):
    """
    Genera un menú semanal usando ML
    
    Args:
        params: Dict con presupuesto, preferencias, etc.
    
    Returns:
        Dict con el menú generado y lista de compras
    """
    try:
        # Conectar a la base de datos
        if not db.session:
            db.connect()
        
        # Obtener parámetros
        presupuesto = float(params.get('presupuesto', 200))
        user_id = uuid.UUID(params.get('userId', str(uuid.uuid4())))
        preferencias_tipo = params.get('tipoComida', [])
        preferencias_categoria = params.get('categoria', [])
        
        print(f"Generando menú para presupuesto: S/ {presupuesto}")
        print(f"Preferencias tipo: {preferencias_tipo}")
        print(f"Preferencias categoría: {preferencias_categoria}")
        
        # Obtener todos los platos
        platos = db.get_all_platos()
        print(f"Platos disponibles: {len(platos)}")
        
        # Crear y entrenar modelo ML
        modelo = MenuRandomForest(platos)
        modelo.entrenar_modelo()
        
        # Generar menú semanal
        menu_semanal = modelo.generar_menu_semanal(
            presupuesto=presupuesto,
            preferencias_tipo=preferencias_tipo,
            preferencias_categoria=preferencias_categoria
        )
        
        # Calcular lista de compras
        lista_compras = calcular_lista_compras(menu_semanal, db)
        
        # Calcular información nutricional
        info_nutricional = calcular_info_nutricional(menu_semanal)
        
        # Guardar en base de datos
        menu_json = json.dumps(menu_semanal, default=decimal_default)
        lista_json = json.dumps(lista_compras, default=decimal_default)
        db.save_menu(user_id, presupuesto, menu_json, lista_json)
        
        return {
            'success': True,
            'menu': menu_semanal,
            'listaCompras': lista_compras,
            'infoNutricional': info_nutricional,
            'presupuestoTotal': sum(item['subtotal'] for item in lista_compras['items'])
        }
        
    except Exception as e:
        print(f"Error generando menú: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }

def obtener_platos():
    """
    Obtiene todos los platos disponibles
    
    Returns:
        Dict con lista de platos
    """
    try:
        if not db.session:
            db.connect()
        
        platos = db.get_all_platos()
        
        return {
            'success': True,
            'platos': platos,
            'total': len(platos)
        }
        
    except Exception as e:
        print(f"Error obteniendo platos: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def obtener_historial(user_id):
    """
    Obtiene el historial de menús de un usuario
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Dict con historial de menús
    """
    try:
        if not db.session:
            db.connect()
        
        menus = db.get_user_menus(user_id)
        
        return {
            'success': True,
            'historial': menus,
            'total': len(menus)
        }
        
    except Exception as e:
        print(f"Error obteniendo historial: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

# Mantener la conexión entre invocaciones (Lambda container reuse)
def close_connection():
    """Cierra la conexión a la base de datos"""
    if db.session:
        db.close()