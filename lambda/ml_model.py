import numpy as np
from sklearn.ensemble import RandomForestRegressor
import json
import random

class MenuRandomForest:
    def __init__(self, platos_data):
        """
        Inicializa el modelo con los datos de platos
        """
        self.model = RandomForestRegressor(
            n_estimators=10,
            max_depth=5,
            random_state=42
        )
        self.platos_data = platos_data
        # Crear índice por ID para búsqueda rápida
        self.platos_por_id = {p['id']: p for p in platos_data}
        self.entrenar_modelo()
    
    def entrenar_modelo(self):
        """
        Entrena el modelo con datos simulados
        """
        print("Entrenando modelo Random Forest...")
        X_train = []
        y_train = []
        
        # Generar 1000 ejemplos de entrenamiento
        for _ in range(1000):
            # Features: precio_ratio, calorias_norm, tipo_encoded, hora_del_dia
            precio_ratio = random.uniform(0.1, 1.0)
            calorias_norm = random.uniform(0.1, 1.0)
            tipo_encoded = random.randint(0, 10)
            hora_del_dia = random.randint(0, 2)  # 0=desayuno, 1=almuerzo, 2=cena
            
            X_train.append([precio_ratio, calorias_norm, tipo_encoded, hora_del_dia])
            
            # Score basado en reglas heurísticas
            score = 50
            
            # Mejor score si el precio está en rango medio
            if 0.3 <= precio_ratio <= 0.7:
                score += 20
            
            # Bonus por calorías apropiadas según hora
            if hora_del_dia == 0 and 0.2 <= calorias_norm <= 0.4:  # Desayuno ligero
                score += 15
            elif hora_del_dia == 1 and 0.5 <= calorias_norm <= 0.8:  # Almuerzo sustancioso
                score += 20
            elif hora_del_dia == 2 and 0.3 <= calorias_norm <= 0.6:  # Cena moderada
                score += 15
                
            # Penalización por extremos
            if precio_ratio > 0.9 or precio_ratio < 0.1:
                score -= 10
                
            y_train.append(score)
        
        # Entrenar el modelo
        self.model.fit(X_train, y_train)
        print("Modelo entrenado exitosamente")
    
    def generar_menu_semanal(self, presupuesto, preferencias_tipo, 
                           preferencias_categoria):
        """
        Genera un menú completo para la semana
        """
        print(f"Generando menú semanal con presupuesto: S/{presupuesto}")
        
        menu_semanal = {}
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 
                      'Viernes', 'Sábado', 'Domingo']
        
        # Calcular presupuesto diario para 2 personas
        presupuesto_diario = presupuesto / 7
        
        # Distribución del presupuesto por momento del día
        distribucion = {
            'desayuno': 0.25,
            'almuerzo': 0.50,
            'cena': 0.25
        }
        
        # Mantener registro de platos usados para evitar repeticiones excesivas
        platos_usados_semana = {
            'desayuno': [],
            'almuerzo': [],
            'cena': []
        }
        
        # Generar menú para cada día
        for dia in dias_semana:
            menu_semanal[dia] = {}
            
            for momento, porcentaje in distribucion.items():
                presupuesto_momento = presupuesto_diario * porcentaje
                
                # Seleccionar platos para este momento
                platos_momento = self._seleccionar_platos_momento(
                    momento,
                    presupuesto_momento,
                    preferencias_tipo,
                    preferencias_categoria,
                    platos_usados_semana[momento]
                )
                
                # Registrar platos usados
                for tipo, plato in platos_momento.items():
                    if plato and 'id' in plato:
                        platos_usados_semana[momento].append(plato['id'])
                
                menu_semanal[dia][momento] = platos_momento
        
        print("Menú semanal generado exitosamente")
        return menu_semanal
    
    def _seleccionar_platos_momento(self, momento, presupuesto_momento,
                                   pref_tipo, pref_cat, platos_usados):
        """
        Selecciona los platos para un momento específico del día
        """
        platos_seleccionados = {}
        
        # Filtrar platos disponibles para este momento
        platos_filtrados = self._filtrar_platos(
            momento, pref_tipo, pref_cat, platos_usados
        )
        
        # Definir componentes según momento
        if momento == 'desayuno':
            componentes = [
                ('bebida', 0.30),
                ('principal', 0.70)  # sandwich o similar
            ]
        else:
            componentes = [
                ('bebida', 0.15),
                ('entrada', 0.30),
                ('fondo', 0.55)
            ]
        
        # Seleccionar un plato para cada componente
        for componente, porcentaje_presupuesto in componentes:
            presupuesto_componente = presupuesto_momento * porcentaje_presupuesto
            
            # Filtrar candidatos por componente y presupuesto
            if componente == 'principal':
                candidatos = [p for p in platos_filtrados 
                            if (p['componente'] in ['sandwich', 'fondo'])
                            and p['precio'] * 2 <= presupuesto_componente]
            else:
                candidatos = [p for p in platos_filtrados 
                            if p['componente'] == componente 
                            and p['precio'] * 2 <= presupuesto_componente]
            
            if candidatos:
                # Usar Random Forest para seleccionar
                mejor_plato = self._seleccionar_con_ml(
                    candidatos, 
                    presupuesto_componente,
                    momento
                )
                
                if mejor_plato:
                    if componente == 'principal':
                        platos_seleccionados['principal'] = mejor_plato
                    else:
                        platos_seleccionados[componente] = mejor_plato
        
        return platos_seleccionados
    
    def _filtrar_platos(self, momento, pref_tipo, pref_cat, platos_usados):
        """
        Filtra platos según momento del día y preferencias
        """
        platos_filtrados = []
        
        # Contar frecuencia de uso para penalizar repeticiones
        frecuencia_uso = {}
        for plato_id in platos_usados:
            frecuencia_uso[plato_id] = frecuencia_uso.get(plato_id, 0) + 1
        
        for plato in self.platos_data:
            # Verificar si el plato es para este momento
            if momento not in plato.get('momento_dia', []):
                continue
            
            # Verificar preferencias de tipo (si hay)
            if pref_tipo and plato['tipo'] not in pref_tipo:
                continue
            
            # Verificar preferencias de categoría (si hay)
            if pref_cat and plato['categoria'] not in pref_cat:
                continue
            
            # Penalizar si ya se usó mucho esta semana
            if frecuencia_uso.get(plato['id'], 0) >= 2:
                continue  # No usar más de 2 veces por semana
            
            platos_filtrados.append(plato)
        
        return platos_filtrados
    
    def _seleccionar_con_ml(self, candidatos, presupuesto_max, momento):
        """
        Usa el modelo ML para seleccionar el mejor plato
        """
        if not candidatos:
            return None
        
        # Mapear momento a número
        momento_map = {'desayuno': 0, 'almuerzo': 1, 'cena': 2}
        momento_num = momento_map.get(momento, 1)
        
        # Preparar features para cada candidato
        features = []
        for plato in candidatos:
            # Feature 1: ratio de precio (para 2 personas)
            precio_ratio = min((plato['precio'] * 2) / presupuesto_max, 1.0)
            
            # Feature 2: calorías normalizadas
            calorias_norm = min(plato['calorias'] / 800, 1.0)
            
            # Feature 3: tipo de comida codificado
            tipo_map = {
                'criolla': 1, 'china': 2, 'marina': 3,
                'selvatica': 4, 'andina': 5, 'nikkei': 6,
                'italiana': 7, 'nortena': 8
            }
            tipo_encoded = tipo_map.get(plato['tipo'], 0)
            
            # Feature 4: momento del día
            features.append([precio_ratio, calorias_norm, tipo_encoded, momento_num])
        
        # Predecir scores
        scores = self.model.predict(features)
        
        # Añadir variabilidad para no repetir siempre los mismos platos
        # Mayor variabilidad en desayuno, menor en almuerzo/cena
        variabilidad = 15 if momento == 'desayuno' else 10
        ruido = np.random.normal(0, variabilidad, len(scores))
        scores_con_ruido = scores + ruido
        
        # Seleccionar el de mayor score
        indice_mejor = np.argmax(scores_con_ruido)
        
        return candidatos[indice_mejor]