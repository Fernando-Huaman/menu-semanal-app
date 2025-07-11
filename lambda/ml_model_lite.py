import json
import random
import math
from collections import defaultdict
from datetime import datetime

class MenuMLLite:
    """
    Modelo de ML ligero personalizado para generar menús
    Usa un sistema de scoring basado en múltiples factores
    """
    
    def __init__(self, platos_data):
        self.platos_data = platos_data
        self.platos_por_id = {p['id']: p for p in platos_data}
        
        # Historial para aprendizaje
        self.historial_selecciones = defaultdict(int)
        self.historial_satisfaccion = defaultdict(list)
        
        # Pesos del modelo (se pueden ajustar con entrenamiento)
        self.pesos = {
            'precio': 0.30,
            'calorias': 0.20,
            'variedad': 0.25,
            'popularidad': 0.15,
            'novedad': 0.10
        }
        
        # Cache de features calculadas
        self.features_cache = {}
        
    def entrenar_modelo(self, datos_entrenamiento=None):
        """Entrena el modelo con datos históricos si existen"""
        if datos_entrenamiento:
            for dato in datos_entrenamiento:
                # Actualizar historial
                for plato_id in dato.get('platos_seleccionados', []):
                    self.historial_selecciones[plato_id] += 1
                    self.historial_satisfaccion[plato_id].append(
                        dato.get('satisfaccion', 70)
                    )
        
        # Calcular popularidad de cada plato
        self._calcular_popularidad()
        
        print(f"Modelo entrenado con {len(self.historial_selecciones)} platos históricos")
    
    def _calcular_popularidad(self):
        """Calcula score de popularidad basado en selecciones históricas"""
        max_selecciones = max(self.historial_selecciones.values()) if self.historial_selecciones else 1
        
        for plato in self.platos_data:
            plato_id = plato['id']
            selecciones = self.historial_selecciones.get(plato_id, 0)
            satisfacciones = self.historial_satisfaccion.get(plato_id, [70])
            
            # Popularidad normalizada
            popularidad = selecciones / max_selecciones if max_selecciones > 0 else 0
            
            # Satisfacción promedio
            satisfaccion_avg = sum(satisfacciones) / len(satisfacciones)
            
            # Score combinado
            self.features_cache[plato_id] = {
                'popularidad': popularidad,
                'satisfaccion': satisfaccion_avg / 100
            }
    
    def generar_menu_semanal(self, presupuesto, preferencias_tipo=None, preferencias_categoria=None):
        """Genera un menú semanal optimizado"""
        menu_semanal = {}
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        # Presupuesto y distribución
        presupuesto_diario = presupuesto / 7
        distribucion = {
            'desayuno': 0.25,
            'almuerzo': 0.50,
            'cena': 0.25
        }
        
        # Tracking para evitar repeticiones
        platos_usados_global = defaultdict(int)
        ultimos_tipos = {'desayuno': [], 'almuerzo': [], 'cena': []}
        
        for idx_dia, dia in enumerate(dias_semana):
            menu_semanal[dia] = {}
            
            for momento, porcentaje in distribucion.items():
                presupuesto_momento = presupuesto_diario * porcentaje
                
                # Seleccionar platos con ML
                platos_momento = self._seleccionar_platos_ml(
                    momento=momento,
                    presupuesto=presupuesto_momento,
                    preferencias_tipo=preferencias_tipo,
                    preferencias_categoria=preferencias_categoria,
                    platos_usados=platos_usados_global,
                    ultimos_tipos=ultimos_tipos[momento],
                    dia_semana=idx_dia
                )
                
                # Actualizar tracking
                for componente, plato in platos_momento.items():
                    if plato and 'id' in plato:
                        platos_usados_global[plato['id']] += 1
                        if 'tipo' in plato:
                            ultimos_tipos[momento].append(plato['tipo'])
                            if len(ultimos_tipos[momento]) > 3:
                                ultimos_tipos[momento].pop(0)
                
                menu_semanal[dia][momento] = platos_momento
        
        return menu_semanal
    
    def _seleccionar_platos_ml(self, momento, presupuesto, preferencias_tipo, 
                               preferencias_categoria, platos_usados, ultimos_tipos, dia_semana):
        """Selección de platos usando scoring ML"""
        platos_seleccionados = {}
        
        # Definir componentes por momento
        if momento == 'desayuno':
            componentes = [
                ('bebida', 0.30),
                ('principal', 0.70)
            ]
        else:
            componentes = [
                ('bebida', 0.15),
                ('entrada', 0.30),
                ('fondo', 0.55)
            ]
        
        for componente, porcentaje_presupuesto in componentes:
            presupuesto_componente = presupuesto * porcentaje_presupuesto
            
            # Obtener candidatos
            candidatos = self._obtener_candidatos(
                momento, componente, presupuesto_componente,
                preferencias_tipo, preferencias_categoria, platos_usados
            )
            
            if candidatos:
                # Calcular scores ML para cada candidato
                scores_candidatos = []
                for plato in candidatos:
                    score = self._calcular_score_ml(
                        plato, presupuesto_componente, platos_usados,
                        ultimos_tipos, dia_semana
                    )
                    scores_candidatos.append((score, plato))
                
                # Seleccionar usando distribución de probabilidad
                mejor_plato = self._seleccionar_por_probabilidad(scores_candidatos)
                
                if mejor_plato:
                    if componente == 'principal':
                        platos_seleccionados['principal'] = mejor_plato
                    else:
                        platos_seleccionados[componente] = mejor_plato
        
        return platos_seleccionados
    
    def _calcular_score_ml(self, plato, presupuesto_max, platos_usados, ultimos_tipos, dia_semana):
        """Calcula score ML multi-factor para un plato"""
        scores = {}
        
        # 1. Score de precio (invertido - más barato es mejor)
        precio_para_dos = plato['precio'] * 2
        if precio_para_dos <= presupuesto_max:
            scores['precio'] = 1 - (precio_para_dos / presupuesto_max)
        else:
            return 0  # Fuera de presupuesto
        
        # 2. Score de calorías (preferir rango saludable)
        calorias = plato['calorias']
        if 200 <= calorias <= 400:
            scores['calorias'] = 1.0
        elif 150 <= calorias <= 500:
            scores['calorias'] = 0.7
        else:
            scores['calorias'] = 0.4
        
        # 3. Score de variedad (penalizar repeticiones)
        repeticiones = platos_usados.get(plato['id'], 0)
        if repeticiones == 0:
            scores['variedad'] = 1.0
        elif repeticiones == 1:
            scores['variedad'] = 0.3
        else:
            scores['variedad'] = 0.1
        
        # 4. Score de popularidad (desde cache si existe)
        plato_features = self.features_cache.get(plato['id'], {})
        scores['popularidad'] = plato_features.get('popularidad', 0.5)
        
        # 5. Score de novedad (bonus para platos no recientes)
        if plato.get('tipo') not in ultimos_tipos:
            scores['novedad'] = 1.0
        else:
            scores['novedad'] = 0.3
        
        # Calcular score final ponderado
        score_final = 0
        for factor, peso in self.pesos.items():
            score_final += scores.get(factor, 0.5) * peso
        
        # Bonus contextual
        # Fin de semana: permitir platos más elaborados
        if dia_semana >= 5:  # Sábado o Domingo
            if plato.get('tipo') in ['criolla', 'marina']:
                score_final *= 1.1
        
        # Añadir algo de aleatoriedad para variedad
        score_final *= random.uniform(0.9, 1.1)
        
        return score_final
    
    def _seleccionar_por_probabilidad(self, scores_candidatos):
        """Selecciona un plato usando distribución de probabilidad basada en scores"""
        if not scores_candidatos:
            return None
        
        # Ordenar por score
        scores_candidatos.sort(key=lambda x: x[0], reverse=True)
        
        # Tomar top 5 candidatos
        top_candidatos = scores_candidatos[:5]
        
        # Convertir scores a probabilidades (softmax simplificado)
        total_score = sum(math.exp(score) for score, _ in top_candidatos)
        probabilidades = [(math.exp(score) / total_score, plato) 
                         for score, plato in top_candidatos]
        
        # Selección por ruleta
        r = random.random()
        acumulado = 0
        for prob, plato in probabilidades:
            acumulado += prob
            if r <= acumulado:
                return plato
        
        return top_candidatos[0][1]  # Fallback al mejor
    
    def _obtener_candidatos(self, momento, componente, presupuesto_max,
                           pref_tipo, pref_cat, platos_usados):
        """Obtiene platos candidatos filtrados"""
        candidatos = []
        
        for plato in self.platos_data:
            # Filtro por momento del día
            if momento not in plato.get('momento_dia', []):
                continue
            
            # Filtro por componente
            if componente == 'principal':
                if plato['componente'] not in ['sandwich', 'fondo']:
                    continue
            elif plato['componente'] != componente:
                continue
            
            # Filtro por preferencias
            if pref_tipo and plato['tipo'] not in pref_tipo:
                continue
            
            if pref_cat and plato['categoria'] not in pref_cat:
                continue
            
            # Filtro por presupuesto
            if plato['precio'] * 2 > presupuesto_max:
                continue
            
            # Limitar repeticiones extremas
            if platos_usados.get(plato['id'], 0) >= 3:
                continue
            
            candidatos.append(plato)
        
        return candidatos
    
    def retroalimentar(self, menu_id, satisfaccion):
        """Actualiza el modelo con retroalimentación del usuario"""
        # En producción, esto actualizaría la base de datos
        # y re-entrenaría el modelo periódicamente
        print(f"Retroalimentación recibida: Menu {menu_id}, Satisfacción: {satisfaccion}%")