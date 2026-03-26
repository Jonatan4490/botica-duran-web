# 🚀 GUÍA RÁPIDA - Sistema de Precios Multinivel

## ✅ ¿Qué se implementó?

### **Sistema Completo de Precios por Presentación**

Un producto ahora puede venderse en diferentes presentaciones:
- 🔹 **Por Unidad** (1 pastilla) → Precio normal
- 📦 **Por Blister** (10 pastillas) → 10% descuento
- 📦📦 **Por Caja** (100 pastillas) → 20% descuento

---

## 🎨 NUEVO FORMULARIO DE PRODUCTOS

### Antes:
```
┌─────────────────────────────┐
│ Nombre: [____________]      │
│ Precio: [____] S/.          │
│ Stock:  [____]              │
│                             │
│ [Guardar]                   │
└─────────────────────────────┘
```

### Ahora:
```
┌─────────────────────────────────────────────┐
│ Nombre: [____________]                      │
│ Precio: [1.50] S/.                          │
│                                             │
│ 📦 CONFIGURACIÓN DE PRESENTACIONES          │
│ ├─ Unidades por blister: [10]              │
│ ├─ Blisters por caja:    [10]              │
│ └─ 1 Caja = 100 unidades                   │
│                                             │
│ 💰 PREVIEW DE PRECIOS:                      │
│ ┌─────────────────────────────────────────┐│
│ │ Unidad  │ Blister    │ Caja            ││
│ │ S/. 1.50│ S/. 13.50  │ S/. 120.00      ││
│ │ 0% desc.│ 10% desc.  │ 20% desc.       ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Código Barras: [_____________]              │
│ Laboratorio:   [_____________]              │
│ Ubicación:     [_____________]              │
│                                             │
│ [Cancelar] [Guardar]                        │
└─────────────────────────────────────────────┘
```

---

## 🔢 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Venta Pequeña (Cliente Compra 5 Pastillas)
```
Producto: Paracetamol 500mg
Cantidad: 5 unidades
Precio: S/. 1.50 × 5 = S/. 7.50
Descuento: 0% (venta por unidad)
```

### Ejemplo 2: Venta Mediana (Cliente Compra 2 Blisters)
```
Producto: Paracetamol 500mg
Cantidad: 2 blisters (20 unidades)
Precio: S/. 13.50 × 2 = S/. 27.00
Descuento: 10% (S/. 1.35/unidad)
Ahorro vs comprar por unidad: S/. 3.00
```

### Ejemplo 3: Venta Grande (Cliente Compra 1 Caja)
```
Producto: Paracetamol 500mg
Cantidad: 1 caja (100 unidades)
Precio: S/. 120.00
Descuento: 20% (S/. 1.20/unidad)
Ahorro vs comprar por unidad: S/. 30.00
```

---

## 💻 CÓMO EMPEZAR A USARLO

### 1️⃣ Abre tu aplicación
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2️⃣ Ve a la sección Productos

### 3️⃣ Crea un producto nuevo
- Llena nombre, categoría, etc.
- **Importante:** Define las presentaciones:
  - ¿Cuántas unidades vienen en un blister?
  - ¿Cuántos blisters vienen en una caja?

### 4️⃣ Observa la magia ✨
- Al ingresar el precio, verás automáticamente:
  - Precio por unidad
  - Precio por blister (con 10% descuento)
  - Precio por caja (con 20% descuento)

### 5️⃣ Guarda y listo!
Los precios se crean automáticamente en la base de datos.

---

## 🎯 BENEFICIOS

### Para la Farmacia:
✅ Ventas más grandes (incentivo por volumen)
✅ Mejor rotación de inventario
✅ Sistema profesional y moderno
✅ Control total de precios

### Para el Cliente:
✅ Descuentos claros y transparentes
✅ Ahorro al comprar más
✅ Opciones flexibles de compra

---

## 📊 DATOS TÉCNICOS

### Base de Datos:
- ✅ 7 nuevos campos en `productos`
- ✅ 1 nueva tabla `precios_producto`
- ✅ 1 nueva tabla `descuentos_volumen`
- ✅ 2 nuevos campos en `detalle_ventas`

### API:
- ✅ Nueva ruta `/api/precios`
- ✅ 6 endpoints nuevos
- ✅ Producto actualizado con campos multinivel

### Frontend:
- ✅ Formulario rediseñado
- ✅ Preview de precios en tiempo real
- ✅ Cálculo automático de equivalencias

---

## 🚦 SIGUIENTES PASOS

```
[✅ COMPLETADO] Fase 1: Sistema de Precios Multinivel
[🔄 EN ESPERA ] Fase 2: Buscador Global Inteligente
[⏳ PENDIENTE ] Fase 3: Dashboard Premium
```

---

## 💡 TIPS

1. **Configuración estándar:**
   - Medicamentos en tabletas/cápsulas: 10 unidades × 10 blisters
   - Jarabes: No usar blister/caja
   - Suplementos: Personalizar según presentación

2. **Personalizar descuentos:**
   Puedes cambiar los porcentajes editando directamente en la base de datos:
   ```sql
   UPDATE precios_producto 
   SET porcentaje_descuento = 15.00 
   WHERE tipo_venta = 'Blister';
   ```

3. **Verificar precios:**
   ```sql
   SELECT p.nombre, pp.tipo_venta, pp.precio_venta 
   FROM precios_producto pp
   JOIN productos p ON pp.producto_id = p.id
   WHERE p.nombre LIKE '%paracetamol%';
   ```

---

## ❓ FAQ

**P: ¿Los productos antiguos tienen estos precios?**
R: Sí! La migración generó automáticamente precios para todos los productos existentes.

**P: ¿Puedo cambiar los descuentos?**
R: Sí, puedes editarlos manualmente con la API o directamente en la BD.

**P: ¿Funcionará con el sistema de ventas actual?**
R: Sí, es totalmente compatible. El siguiente paso es actualizar el POS.

**P: ¿Qué pasa si no quiero blisters/cajas?**
R: Deja los valores por defecto (10/10) y simplemente no uses esas presentaciones al vender.

---

**🎉 ¡Disfruta del nuevo sistema!**

Cuando estés listo, continúa con el **Buscador Global Inteligente**.

---

_Desarrollado con ❤️ para Botica Durán_
_Versión: 1.0.0 | Fecha: 2026-02-08_
