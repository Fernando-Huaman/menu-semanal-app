import json
from decimal import Decimal
from collections import defaultdict

def calcular_lista_compras(menu_semanal, db_connection):
    """
    Calcula la lista de compras optimizada para el menú semanal
    
    Args:
        menu_semanal: Dict con el menú de la semana
        db_connection: Conexión a la base de datos
        
    Returns:
        Dict con la lista de compras organizada por categorías
    """
    ingredientes_totales = defaultdict(lambda: {
        'cantidad': 0,
        'unidad': '',
        'precio_unitario': 0,
        'categoria': 'otros'
    })
    
    # Recopilar todos los ingredientes
    for dia, momentos in menu_semanal.items():
        for momento, platos in momentos.items():
            for tipo, plato in platos.items():
                if plato and 'ingredientes' in plato:
                    try:
                        # Los ingredientes vienen como JSON string
                        ingredientes = json.loads(plato['ingredientes'])
                        
                        for ing in ingredientes:
                            nombre = ing['ingrediente']
                            cantidad = float(ing['cantidad'])
                            unidad = ing['unidad']
                            
                            # Obtener información del ingrediente
                            info_ing = db_connection.get_ingrediente_info(nombre)
                            
                            if info_ing:
                                # Multiplicar por 2 (para 2 personas)
                                cantidad_total = cantidad * 2
                                
                                # Convertir unidades si es necesario
                                if unidad == 'g' and info_ing['unidad'] == 'kg':
                                    cantidad_total = cantidad_total / 1000
                                elif unidad == 'ml' and info_ing['unidad'] == 'litro':
                                    cantidad_total = cantidad_total / 1000
                                
                                # Acumular cantidades
                                ingredientes_totales[nombre]['cantidad'] += cantidad_total
                                ingredientes_totales[nombre]['unidad'] = info_ing['unidad']
                                ingredientes_totales[nombre]['precio_unitario'] = info_ing['precio']
                                ingredientes_totales[nombre]['categoria'] = info_ing['categoria']
                                ingredientes_totales[nombre]['venta_por'] = info_ing.get('venta_por', info_ing['unidad'])
                                ingredientes_totales[nombre]['precio_venta'] = info_ing.get('precio_venta', info_ing['precio'])
                    
                    except (json.JSONDecodeError, KeyError) as e:
                        print(f"Error procesando ingredientes de {plato.get('nombre', 'desconocido')}: {e}")
    
    # Organizar por categorías
    lista_por_categoria = defaultdict(list)
    total_general = 0
    
    for ingrediente, datos in ingredientes_totales.items():
        # Calcular cantidad a comprar y precio
        cantidad_necesaria = datos['cantidad']
        precio_unitario = datos['precio_unitario']
        
        # Si se vende por unidad diferente, ajustar
        if datos.get('precio_venta'):
            precio_compra = datos['precio_venta']
            # Ajustar cantidad según cómo se vende
            if 'bolsa' in datos.get('venta_por', ''):
                cantidad_compra = 1  # Comprar 1 bolsa
            elif 'atado' in datos.get('venta_por', ''):
                cantidad_compra = 1  # Comprar 1 atado
            else:
                cantidad_compra = cantidad_necesaria
        else:
            precio_compra = precio_unitario * cantidad_necesaria
            cantidad_compra = cantidad_necesaria
        
        # Redondear cantidades
        cantidad_compra = round(cantidad_compra, 2)
        precio_compra = round(precio_compra, 2)
        
        item_compra = {
            'ingrediente': ingrediente,
            'cantidad': cantidad_compra,
            'unidad': datos['unidad'],
            'venta_por': datos.get('venta_por', datos['unidad']),
            'precio_unitario': precio_unitario,
            'subtotal': precio_compra
        }
        
        lista_por_categoria[datos['categoria']].append(item_compra)
        total_general += precio_compra
    
    # Ordenar items por nombre dentro de cada categoría
    for categoria in lista_por_categoria:
        lista_por_categoria[categoria].sort(key=lambda x: x['ingrediente'])
    
    # Crear estructura final
    categorias_ordenadas = [
        'proteina', 'lacteo', 'tuberculo', 'cereal', 
        'verdura', 'fruta', 'legumbre', 'condimento', 
        'bebida', 'otros'
    ]
    
    items_lista = []
    for categoria in categorias_ordenadas:
        if categoria in lista_por_categoria:
            for item in lista_por_categoria[categoria]:
                item['categoria'] = categoria
                items_lista.append(item)
    
    return {
        'items': items_lista,
        'total': round(total_general, 2),
        'categorias': dict(lista_por_categoria)
    }

def calcular_info_nutricional(menu_semanal):
    """
    Calcula la información nutricional del menú
    
    Args:
        menu_semanal: Dict con el menú de la semana
        
    Returns:
        Dict con información nutricional agregada
    """
    total_calorias = 0
    total_platos = 0
    calorias_por_dia = {}
    
    for dia, momentos in menu_semanal.items():
        calorias_dia = 0
        
        for momento, platos in momentos.items():
            for tipo, plato in platos.items():
                if plato and 'calorias' in plato:
                    # Multiplicar por 2 (para 2 personas)
                    calorias_plato = plato['calorias'] * 2
                    calorias_dia += calorias_plato
                    total_calorias += calorias_plato
                    total_platos += 1
        
        calorias_por_dia[dia] = calorias_dia
    
    promedio_diario = total_calorias / 7 if total_calorias > 0 else 0
    promedio_por_persona = promedio_diario / 2
    
    return {
        'totalSemanal': round(total_calorias, 2),
        'promedioDiario': round(promedio_diario, 2),
        'promedioPorPersona': round(promedio_por_persona, 2),
        'caloriasPorDia': calorias_por_dia,
        'totalPlatos': total_platos
    }

def decimal_default(obj):
    """
    Función helper para serializar Decimals a JSON
    
    Args:
        obj: Objeto a serializar
        
    Returns:
        Float si es Decimal, sino TypeError
    """
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def validar_preferencias(preferencias_tipo, preferencias_categoria):
    """
    Valida y normaliza las preferencias del usuario
    
    Args:
        preferencias_tipo: Lista de tipos de comida preferidos
        preferencias_categoria: Lista de categorías preferidas
        
    Returns:
        Tuple con las preferencias validadas
    """
    tipos_validos = ['criolla', 'china', 'marina', 'andina', 'selvatica', 'nortena']
    categorias_validas = ['normal', 'vegetariano']
    
    # Filtrar solo valores válidos
    if preferencias_tipo:
        preferencias_tipo = [t for t in preferencias_tipo if t in tipos_validos]
    
    if preferencias_categoria:
        preferencias_categoria = [c for c in preferencias_categoria if c in categorias_validas]
    
    return preferencias_tipo, preferencias_categoria

def formatear_menu_respuesta(menu_semanal):
    """
    Formatea el menú para la respuesta de la API
    
    Args:
        menu_semanal: Dict con el menú generado
        
    Returns:
        Dict con el menú formateado
    """
    menu_formateado = {}
    
    for dia, momentos in menu_semanal.items():
        menu_formateado[dia] = {}
        
        for momento, platos in momentos.items():
            menu_formateado[dia][momento] = {}
            
            for tipo, plato in platos.items():
                if plato:
                    # Incluir solo información esencial
                    menu_formateado[dia][momento][tipo] = {
                        'id': plato.get('id'),
                        'nombre': plato.get('nombre'),
                        'tipo': plato.get('tipo'),
                        'calorias': plato.get('calorias'),
                        'precio': plato.get('precio'),
                        'preparacion': plato.get('preparacion', '')
                    }
                else:
                    menu_formateado[dia][momento][tipo] = None
    
    return menu_formateado