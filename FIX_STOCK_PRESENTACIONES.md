# ✅ FIX: Descuento Correcto de Stock por Presentación

## 🐛 PROBLEMA IDENTIFICADO

### **Antes del Fix:**
Cuando vendías por blister o caja, el stock se descontaba incorrectamente:

```
Stock inicial: 100 unidades
Vendes: 2 blisters (cada uno con 10 unidades = 20 unidades)
Stock esperado: 80 unidades
Stock real: 98 unidades ❌ (solo descontaba 2)
```

**Causa:** El backend estaba descontando la cantidad de blisters/cajas vendidos, no las unidades equivalentes.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Cambios en el Frontend (NuevaVenta.jsx):**

Ahora el frontend calcula las **unidades equivalentes** antes de enviar al backend:

```javascript
// Venta de 2 blisters (10 unidades cada uno)
{
    producto_id: 1,
    cantidad: 20,                  // ← Unidades reales (2 × 10)
    cantidad_presentacion: 2,      // ← Cantidad de blisters vendidos
    precio_unitario: 9.00,         // ← Precio por blister
    tipo_venta: 'Blister'
}
```

**Lógica de cálculo:**
```javascript
switch(tipo_venta) {
    case 'Unidad':
        cantidadUnidades = cantidad;
        break;
    case 'Blister':
        cantidadUnidades = cantidad × unidades_por_blister;
        break;
    case 'Caja':
        cantidadUnidades = cantidad × unidades_por_blister × blisters_por_caja;
        break;
}
```

### **Cambios en el Backend (ventas.js):**

El backend ahora:
1. Recibe `cantidad` (unidades reales para stock)
2. Recibe `cantidad_presentacion` (cantidad de la presentación vendida)
3. Guarda ambos valores en `detalle_ventas`
4. Descuenta del stock las unidades reales

```javascript
// Verificar stock con unidades reales
if (productos[0].stock_actual < item.cantidad) {
    return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${stock_actual}, Requerido: ${item.cantidad}`
    });
}

// Actualizar stock con unidades reales
UPDATE productos SET stock_actual = stock_actual - item.cantidad
```

---

## 📊 EJEMPLOS CORREGIDOS

### Ejemplo 1: Venta por Unidades
```
Stock inicial: 100 unidades
Vendes: 5 unidades

Frontend envía:
{
    cantidad: 5,
    cantidad_presentacion: 5,
    tipo_venta: 'Unidad'
}

Stock final: 95 unidades ✅
```

### Ejemplo 2: Venta por Blisters
```
Stock inicial: 100 unidades
Configuración: 10 unidades por blister
Vendes: 2 blisters

Frontend calcula y envía:
{
    cantidad: 20,                    // 2 × 10 = 20 unidades
    cantidad_presentacion: 2,        // 2 blisters
    tipo_venta: 'Blister'
}

Stock final: 80 unidades ✅
```

### Ejemplo 3: Venta por Cajas
```
Stock inicial: 100 unidades
Configuración: 10 unidades/blister, 10 blisters/caja
Vendes: 1 caja

Frontend calcula y envía:
{
    cantidad: 100,                   // 1 × 10 × 10 = 100 unidades
    cantidad_presentacion: 1,        // 1 caja
    tipo_venta: 'Caja'
}

Stock final: 0 unidades ✅
```

### Ejemplo 4: Venta Mixta
```
Stock inicial: 150 unidades

Ventas:
- 3 unidades sueltas    → Descuenta 3 unidades
- 1 blister (10 un.)    → Descuenta 10 unidades
- 1 caja (100 un.)      → Descuenta 100 unidades

Total descontado: 113 unidades
Stock final: 37 unidades ✅
```

---

## 🔍 DETALLES TÉCNICOS

### Tabla `detalle_ventas`
Ahora guarda información completa:

```sql
CREATE TABLE detalle_ventas (
    id INT PRIMARY KEY,
    venta_id INT,
    producto_id INT,
    cantidad DECIMAL(10,2),              -- Cantidad de la presentación (ej: 2 blisters)
    precio_unitario DECIMAL(10,2),       -- Precio por presentación (ej: S/. 9.00)
    tipo_venta ENUM('Unidad', 'Blister', 'Caja', 'Mayorista'),
    cantidad_unidades INT,               -- Unidades reales descontadas del stock (ej: 20)
    subtotal DECIMAL(10,2),
    total DECIMAL(10,2)
);
```

**Ejemplo de registro:**
```sql
INSERT INTO detalle_ventas VALUES (
    1,              -- id
    100,            -- venta_id
    5,              -- producto_id
    2,              -- cantidad (2 blisters)
    9.00,           -- precio_unitario (S/. 9.00 por blister)
    'Blister',      -- tipo_venta
    20,             -- cantidad_unidades (20 unidades descontadas del stock)
    18.00,          -- subtotal (2 × 9.00)
    18.00           -- total
);
```

---

## ✅ VALIDACIONES AGREGADAS

1. **Mensaje de error mejorado:**
   ```
   Antes: "Stock insuficiente para producto 5"
   Ahora: "Stock insuficiente para producto 5. Disponible: 50, Requerido: 100"
   ```

2. **Validación correcta:**
   - Si vendes 10 blisters (100 unidades) pero solo hay 50 → Error ✅
   - El sistema valida contra las unidades reales, no la cantidad de presentaciones

---

## 🧪 CÓMO PROBAR EL FIX

### Test 1: Venta por Blister
```
1. Crea un producto:
   - Nombre: "Test Blister"
   - Stock: 100 unidades
   - Unidades por blister: 10
   - Precio blister: S/. 9.00

2. Ve a Nueva Venta
3. Agrega "Test Blister" al carrito
4. Selecciona "Blister (10 un.)"
5. Cantidad: 2
6. Completa la venta

7. Verifica:
   - Stock final debe ser: 80 unidades ✅
   - Detalle de venta muestra: 2 blisters, 20 unidades
```

### Test 2: Venta por Caja
```
1. Usa el mismo producto anterior (stock: 80)
2. Nueva venta
3. Selecciona "Caja (100 un.)"
4. Cantidad: 1 (debe fallar - solo hay 80 unidades)

Esperado: Error "Stock insuficiente. Disponible: 80, Requerido: 100" ✅
```

### Test 3: Venta Mixta
```
1. Reset stock a 150 unidades
2. Nueva venta con:
   - 5 unidades sueltas
   - 2 blisters
   - 1 caja

3. Total unidades consumidas: 5 + 20 + 100 = 125
4. Stock final esperado: 25 unidades ✅
```

---

## 📈 MEJORAS ADICIONALES

### Reporte de Ventas
Ahora puedes generar reportes detallados:

```sql
SELECT 
    dv.tipo_venta,
    dv.cantidad as cantidad_presentacion,
    dv.cantidad_unidades as unidades_vendidas,
    dv.precio_unitario,
    dv.total
FROM detalle_ventas dv
WHERE venta_id = 100;
```

**Resultado:**
```
┌────────────┬─────────────────────┬──────────────────┬─────────────────┬────────┐
│ tipo_venta │ cantidad_presentac. │ unidades_vendidas│ precio_unitario │ total  │
├────────────┼─────────────────────┼──────────────────┼─────────────────┼────────┤
│ Unidad     │ 5                   │ 5                │ 1.00            │ 5.00   │
│ Blister    │ 2                   │ 20               │ 9.00            │ 18.00  │
│ Caja       │ 1                   │ 100              │ 75.00           │ 75.00  │
└────────────┴─────────────────────┴──────────────────┴─────────────────┴────────┘
```

### Cancelación de Ventas
La cancelación también funciona correctamente:
- Devuelve las `cantidad_unidades` al stock
- No la `cantidad` de presentaciones

---

## 🎯 ARCHIVOS MODIFICADOS

```
✅ frontend/src/pages/NuevaVenta.jsx
   - handleSubmit() calcula unidades equivalentes

✅ backend/routes/ventas.js
   - POST /api/ventas guarda tipo_venta y cantidad_unidades
   - Descuenta unidades reales del stock
   - Mensaje de error mejorado
```

---

## ⚡ ESTADO ACTUAL

```
✅ Cálculo de unidades equivalentes
✅ Descuento correcto de stock
✅ Validación de stock mejorada
✅ Registro completo en detalle_ventas
✅ Compatible con cancelaciones
✅ Listo para producción
```

---

## 📝 NOTAS IMPORTANTES

1. **Compatibilidad:** Las ventas antiguas (sin tipo_venta) seguirán funcionando normalmente
2. **Stock siempre en unidades:** El stock SIEMPRE se maneja en unidades, independientemente de cómo se venda
3. **Auditoría completa:** `detalle_ventas` guarda tanto la presentación como las unidades reales

---

¡El sistema ahora calcula correctamente el stock sin importar si vendes por unidad, blister o caja! 🎉

_Fix implementado: 2026-02-08_
