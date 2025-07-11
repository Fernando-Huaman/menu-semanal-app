import ssl
import os
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.policies import DCAwareRoundRobinPolicy
from datetime import datetime
import json
from decimal import Decimal

class KeyspacesConnection:
    def __init__(self):
        self.session = None
        self.cluster = None
        
    def connect(self):
        """Conecta a Amazon Keyspaces"""
        print("Conectando a Amazon Keyspaces...")
        
        # Configurar SSL
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Credenciales desde variables de entorno
        auth_provider = PlainTextAuthProvider(
            username=os.environ.get('KEYSPACES_USER'),
            password=os.environ.get('KEYSPACES_PASSWORD')
        )
        
        # Configurar cluster
        region = os.environ.get('AWS_REGION', 'us-east-1')
        self.cluster = Cluster(
            [f"cassandra.{region}.amazonaws.com"],
            port=9142,
            auth_provider=auth_provider,
            ssl_context=ssl_context,
            protocol_version=4,
            load_balancing_policy=DCAwareRoundRobinPolicy(local_dc=region)
        )
        
        # Conectar al keyspace
        self.session = self.cluster.connect('menu_semanal')
        print("Conexión exitosa a Keyspaces")
        return self.session
    
    def close(self):
        """Cierra la conexión"""
        if self.cluster:
            self.cluster.shutdown()
            print("Conexión cerrada")
    
    def get_all_platos(self):
        """Obtiene todos los platos de la base de datos"""
        query = "SELECT * FROM platos"
        rows = self.session.execute(query)
        
        platos = []
        for row in rows:
            platos.append({
                'id': row.id,
                'nombre': row.nombre,
                'tipo': row.tipo,
                'categoria': row.categoria,
                'componente': row.componente,
                'calorias': row.calorias,
                'precio': float(row.precio),
                'momento_dia': list(row.momento_dia) if row.momento_dia else [],
                'ingredientes': row.ingredientes,
                'preparacion': row.preparacion
            })
        
        return platos
    
    def get_ingrediente_precio(self, nombre):
        """Obtiene el precio de un ingrediente"""
        query = "SELECT precio FROM ingredientes WHERE nombre = %s"
        row = self.session.execute(query, [nombre]).one()
        return Decimal(str(row.precio)) if row else Decimal('5.0')
    
    def get_ingrediente_categoria(self, nombre):
        """Obtiene la categoría de un ingrediente"""
        query = "SELECT categoria FROM ingredientes WHERE nombre = %s"
        row = self.session.execute(query, [nombre]).one()
        return row.categoria if row else 'otros'
    
    def save_menu(self, user_id, presupuesto, menu_json, lista_json):
        """Guarda un menú generado"""
        query = """
        INSERT INTO menus_generados 
        (user_id, fecha_generacion, presupuesto, menu_json, lista_compras)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        self.session.execute(query, [
            user_id,
            datetime.now(),
            presupuesto,
            menu_json,
            lista_json
        ])
        
        print(f"Menú guardado para usuario {user_id}")
    
    def get_user_menus(self, user_id):
        """Obtiene los menús de un usuario"""
        query = """
        SELECT fecha_generacion, presupuesto, menu_json, lista_compras 
        FROM menus_generados 
        WHERE user_id = %s 
        LIMIT 10
        """
        
        rows = self.session.execute(query, [user_id])
        menus = []
        
        for row in rows:
            menus.append({
                'fecha': row.fecha_generacion.isoformat(),
                'presupuesto': float(row.presupuesto),
                'menu': json.loads(row.menu_json),
                'lista_compras': json.loads(row.lista_compras)
            })
        
        return menus