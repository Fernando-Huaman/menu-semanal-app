#!/usr/bin/env python3
"""
Script para inicializar la base de datos con todos los platos e ingredientes
"""

import os
import json
import ssl
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.policies import DCAwareRoundRobinPolicy
from cassandra import ConsistencyLevel
from datetime import datetime

# Cargar datos
with open('../lambda/data/platos.json', 'r', encoding='utf-8') as f:
    PLATOS_DATA = json.load(f)

with open('../lambda/data/ingredientes.json', 'r', encoding='utf-8') as f:
    INGREDIENTES_DATA = json.load(f)

def connect_to_keyspaces():
    """Conecta a Amazon Keyspaces"""
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    auth_provider = PlainTextAuthProvider(
        username=os.environ['KEYSPACES_USER'],
        password=os.environ['KEYSPACES_PASSWORD']
    )
    
    cluster = Cluster(
        [f"cassandra.{os.environ['AWS_REGION']}.amazonaws.com"],
        port=9142,
        auth_provider=auth_provider,
        ssl_context=ssl_context,
        protocol_version=4,
        load_balancing_policy=DCAwareRoundRobinPolicy(local_dc=os.environ['AWS_REGION'])
    )
    
    session = cluster.connect('menu_semanal')
    
    # IMPORTANTE: Configurar el nivel de consistencia para Keyspaces
    session.default_consistency_level = ConsistencyLevel.LOCAL_QUORUM
    
    return cluster, session

def insert_platos(session):
    """Inserta todos los platos"""
    print("Insertando platos...")
    
    insert_query = """
    INSERT INTO platos (id, nombre, tipo, categoria, componente, 
                       calorias, precio, momento_dia, ingredientes, preparacion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    prepared = session.prepare(insert_query)
    # Establecer consistencia para esta consulta específica
    prepared.consistency_level = ConsistencyLevel.LOCAL_QUORUM
    
    for plato in PLATOS_DATA:
        try:
            session.execute(prepared, [
                plato['id'],
                plato['nombre'],
                plato['tipo'],
                plato['categoria'],
                plato['componente'],
                plato['calorias'],
                plato['precio'],
                set(plato['momento_dia']),
                json.dumps(plato['ingredientes']),
                plato['preparacion']
            ])
            print(f"  ✓ {plato['nombre']}")
        except Exception as e:
            print(f"  ✗ Error insertando {plato['nombre']}: {e}")
    
    print(f"✅ {len(PLATOS_DATA)} platos procesados")

def insert_ingredientes(session):
    """Inserta todos los ingredientes"""
    print("\nInsertando ingredientes...")
    
    insert_query = """
    INSERT INTO ingredientes (nombre, precio, unidad, venta_por, precio_venta, categoria)
    VALUES (?, ?, ?, ?, ?, ?)
    """
    
    prepared = session.prepare(insert_query)
    # Establecer consistencia para esta consulta específica
    prepared.consistency_level = ConsistencyLevel.LOCAL_QUORUM
    
    count = 0
    errors = 0
    for nombre, datos in INGREDIENTES_DATA.items():
        try:
            session.execute(prepared, [
                nombre,
                datos['precio'],
                datos['unidad'],
                datos.get('ventaPor', datos['unidad']),
                datos.get('precioVenta', datos['precio']),
                datos['categoria']
            ])
            count += 1
            if count % 10 == 0:
                print(f"  ✓ {count} ingredientes...")
        except Exception as e:
            errors += 1
            print(f"  ✗ Error insertando {nombre}: {e}")
    
    print(f"✅ {count} ingredientes insertados, {errors} errores")

def main():
    """Función principal"""
    print("🚀 Iniciando carga de datos en Amazon Keyspaces")
    print(f"   Region: {os.environ.get('AWS_REGION', 'us-east-1')}")
    print(f"   Usuario: {os.environ.get('KEYSPACES_USER', 'No configurado')[:20]}...")
    
    try:
        # Conectar
        cluster, session = connect_to_keyspaces()
        print("✅ Conectado a Keyspaces")
        
        # Insertar datos
        insert_platos(session)
        insert_ingredientes(session)
        
        # Insertar algunos datos de prueba
        print("\nInsertando datos de prueba...")
        test_query = """
            INSERT INTO modelo_entrenamiento (id, presupuesto, tipo_comida, 
                                            categoria, platos_seleccionados, satisfaccion)
            VALUES (uuid(), 200, 'criolla', 'normal', '[]', 85)
        """
        session.execute(test_query, consistency_level=ConsistencyLevel.LOCAL_QUORUM)
        print("✅ Datos de prueba insertados")
        
        print("\n🎉 ¡Base de datos inicializada correctamente!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        if 'cluster' in locals():
            cluster.shutdown()

if __name__ == "__main__":
    # Verificar variables de entorno
    required_vars = ['KEYSPACES_USER', 'KEYSPACES_PASSWORD', 'AWS_REGION']
    missing = [var for var in required_vars if not os.environ.get(var)]
    
    if missing:
        print(f"❌ Faltan variables de entorno: {', '.join(missing)}")
        print("\nConfigura las variables así:")
        print("export KEYSPACES_USER='tu-usuario'")
        print("export KEYSPACES_PASSWORD='tu-password'")
        print("export AWS_REGION='us-east-1'")
        exit(1)
    
    main()