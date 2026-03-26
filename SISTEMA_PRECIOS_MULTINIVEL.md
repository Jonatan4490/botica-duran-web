# 💰 Sistema de Precios Multinivel - Botica Durán

## 📋 Descripción

El sistema de precios multinivel permite vender productos en diferentes presentaciones (Unidad, Blister, Caja, Mayorista) con descuentos automáticos por volumen.

## 🎯 Características Principales

### 1. **Presentaciones de Producto**
- **Unidad**: Venta individual (1 pastilla, 1 cápsula, etc.)
- **Blister**: Paquete de unidades (ej: 10 pastillas)
- **Caja**: Conjunto de blisters (ej: 10 blisters = 100 pastillas)
- **Mayorista**: Precios especiales para compras al por mayor

### 2. **Descuentos Automáticos**
- **Por Unidad**: 0% descuento (precio base)
- **Por Blister**: 10% descuento automático
- **Por Caja**: 20% descuento automático
- **Mayorista**: Configurable según necesidades

### 3. **Configuración de Productos**
Cada producto ahora incluye:
- `unidades_por_blister`: Cantidad de unidades en un blister (default: 10)
- `blisters_por_caja`: Cantidad de blisters en una caja (default: 10)
- `codigo_barras`: Código de barras del producto
- `codigo_interno`: Código generado automáticamente (PROD-00001)
- `laboratorio`: Fabricante del producto
- `ubicacion`: Ubicación física en almacén

## 🚀 Instalación

### Paso 1: Ejecutar la Migración

Desde la carpeta `backend`, ejecuta:

```bash
node migrate_precios_multinivel.js
```

Este script:
- ✅ Añade los campos necesarios a la tabla `productos`
- ✅ Crea la tabla `precios_producto` para gestionar precios multinivel
- ✅ Crea la tabla `descuentos_volumen` para descuentos personalizados
- ✅ Actualiza la tabla `detalle_ventas` con el campo `tipo_venta`
- ✅ Genera precios automáticos para productos existentes
- ✅ Asigna códigos internos a productos sin código

### Paso 2: Reiniciar el Servidor

```bash
# En la carpeta backend
npm start
```

El servidor ahora incluye la ruta `/api/precios` para gestionar precios multinivel.

## 📖 Uso del Sistema

### En el Frontend - Módulo de Productos

1. **Crear/Editar Producto**
   - Ve a "Productos" → "Nuevo Producto"
   - Completa los datos básicos (nombre, categoría, precios)
   - En la sección "📦 Configuración de Presentaciones":
     - Define unidades por blister (ej: 10)
     - Define blisters por caja (ej: 10)
     - Verás un preview de los precios calculados automáticamente

2. **Preview de Precios**
   - Al ingresar el precio de venta, verás en tiempo real:
     - Precio por unidad (sin descuento)
     - Precio por blister (10% descuento)
     - Precio por caja (20% descuento)

### En el Punto de Venta

Al agregar un producto a la venta:
- Selecciona la presentación deseada (Unidad/Blister/Caja)
- El sistema aplicará automáticamente el precio correspondiente
- Los descuentos se calculan en tiempo real

## 🔧 API Endpoints

### 1. Obtener precios de un producto
```
GET /api/precios/producto/:id
```

Respuesta:
```json
{
  "precios": [
    {
      "id": 1,
      "tipo_venta": "Unidad",
      "cantidad_minima": 1,
      "precio_venta": 1.50,
      "porcentaje_descuento": 0
    },
    {
      "id": 2,
      "tipo_venta": "Blister",
      "cantidad_minima": 10,
      "precio_venta": 13.50,
      "porcentaje_descuento": 10.00
    },
    {
      "id": 3,
      "tipo_venta": "Caja",
      "cantidad_minima": 100,
      "precio_venta": 120.00,
      "porcentaje_descuento": 20.00
    }
  ],
  "configuracion": {
    "unidades_por_blister": 10,
    "blisters_por_caja": 10,
    "precio_venta": 1.50
  }
}
```

### 2. Crear/Actualizar precio
```
POST /api/precios
Content-Type: application/json

{
  "producto_id": 1,
  "tipo_venta": "Blister",
  "precio_venta": 13.50,
  "porcentaje_descuento": 10
}
```

### 3. Calcular precio según cantidad
```
POST /api/precios/calcular
Content-Type: application/json

{
  "producto_id": 1,
  "cantidad": 25,
  "tipo_venta": "Unidad"  // Opcional
}
```

Respuesta:
```json
{
  "producto_id": 1,
  "cantidad": 25,
  "tipo_venta_aplicado": "Blister",
  "precio_unitario": 1.35,
  "precio_total": 33.75,
  "descuento_monto": 3.75,
  "descuento_porcentaje": "10.00",
  "ahorro": "Ahorras S/. 3.75"
}
```

### 4. Generar precios automáticamente
```
POST /api/precios/generar-automatico/:producto_id
```

Genera automáticamente los 3 niveles de precios (Unidad, Blister, Caja) basándose en la configuración del producto.

## 💡 Ejemplos de Uso

### Ejemplo 1: Paracetamol 500mg

**Configuración:**
- Precio venta unitario: S/. 1.50
- Unidades por blister: 10 pastillas
- Blisters por caja: 10 blisters

**Precios generados:**
- 1 pastilla: S/. 1.50 (sin descuento)
- 1 blister (10 pastillas): S/. 13.50 (10% desc. → S/. 1.35/unidad)
- 1 caja (100 pastillas): S/. 120.00 (20% desc. → S/. 1.20/unidad)

**Ahorro del cliente:**
- Compra de 1 caja vs 100 unidades: S/. 30.00 de ahorro

### Ejemplo 2: Ibuprofeno 400mg

**Configuración:**
- Precio venta unitario: S/. 0.80
- Unidades por blister: 12 tabletas
- Blisters por caja: 8 blisters

**Precios generados:**
- 1 tableta: S/. 0.80
- 1 blister (12 tabletas): S/. 8.64 (10% desc.)
- 1 caja (96 tabletas): S/. 61.44 (20% desc.)

## 🎨 Interfaz de Usuario

### Vista en el Modal de Producto

```
┌─────────────────────────────────────────────┐
│   📦 Configuración de Presentaciones        │
├─────────────────────────────────────────────┤
│                                             │
│  Unidades por Blister    Blisters por Caja │
│  ┌──────────┐           ┌──────────┐       │
│  │    10    │           │    10    │       │
│  └──────────┘           └──────────┘       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 1 Caja = 10 blisters                  │ │
│  │ 1 Caja = 100 unidades                 │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  💰 Precios Estimados:                      │
│  ┌──────────────────────────────────────┐  │
│  │ Unidad    Blister      Caja          │  │
│  │ S/. 1.50  S/. 13.50    S/. 120.00    │  │
│  │ 0% desc.  10% desc.    20% desc.     │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 🔍 Ventajas del Sistema

1. **Automatización**: Los precios se calculan automáticamente
2. **Transparencia**: El cliente ve claramente sus ahorros
3. **Flexibilidad**: Puedes ajustar descuentos por producto
4. **Escalabilidad**: Fácil agregar más niveles de precio
5. **Control**: Gestión centralizada de todas las presentaciones

## 📊 Base de Datos

### Tabla: `precios_producto`
```sql
CREATE TABLE precios_producto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    tipo_venta ENUM('Unidad', 'Blister', 'Caja', 'Mayorista'),
    cantidad_minima INT NOT NULL,
    cantidad_equivalente INT NOT NULL,
    precio_venta DECIMAL(10, 2),
    porcentaje_descuento DECIMAL(5, 2),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

### Campos añadidos a `productos`:
- `unidades_por_blister` INT DEFAULT 10
- `blisters_por_caja` INT DEFAULT 10
- `codigo_barras` VARCHAR(50)
- `codigo_interno` VARCHAR(20) UNIQUE
- `laboratorio` VARCHAR(100)
- `ubicacion` VARCHAR(50)

## 🐛 Troubleshooting

### Error: "Duplicate column name"
La migración ya fue ejecutada. Los cambios ya están en tu base de datos.

### Los precios no se generan automáticamente
Verifica que hayas ingresado valores en:
- `precio_venta`
- `unidades_por_blister`
- `blisters_por_caja`

### No veo el preview de precios
Asegúrate de ingresar un `precio_venta` válido en el formulario.

## 📝 Próximas Mejoras

- [ ] Precios según tipo de cliente (Regular, VIP, Mayorista)
- [ ] Promociones por tiempo limitado
- [ ] Descuentos por volumen acumulado
- [ ] Precios dinámicos según stock disponible
- [ ] Historial de cambios de precios

---

**¡Sistema listo para usar!** 🚀

Para cualquier duda, consulta este documento o revisa el código fuente.
