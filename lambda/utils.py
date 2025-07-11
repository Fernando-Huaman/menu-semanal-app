from decimal import Decimal

def decimal_default(obj):
    """Convierte Decimal a float para JSON"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def validar_presupuesto(presupuesto):
    """Valida que el presupuesto esté en rango permitido"""
    if presupuesto < 120:
        raise ValueError("El presupuesto mínimo es S/ 120")
    if presupuesto > 600:
        raise ValueError("El presupuesto máximo es S/ 600")
    return True

def calcular_distribucion_presupuesto(presupuesto_total):
    """Calcula la distribución del presupuesto por día y momento"""
    presupuesto_diario = presupuesto_total / 7
    
    return {
        'diario': presupuesto_diario,
        'desayuno': presupuesto_diario * 0.25,
        'almuerzo': presupuesto_diario * 0.50,
        'cena': presupuesto_diario * 0.25
    }