# 🚀 Guía de Instalación - Botica Duran

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v16 o superior) - [Descargar aquí](https://nodejs.org/)
- **MySQL** (v8.0 o superior) - [Descargar aquí](https://dev.mysql.com/downloads/installer/)
- Un navegador web moderno (Chrome, Firefox, Edge)

## 📦 Instalación del Backend

### 1. Configurar Base de Datos MySQL

1. Abre **MySQL Workbench** o tu cliente MySQL favorito
2. Ejecuta el archivo `backend/database/schema.sql` para crear la base de datos y las tablas:

```sql
-- En MySQL Workbench: File > Open SQL Script > Selecciona backend/database/schema.sql
-- Luego presiona el botón ⚡ Execute
```

Esto creará:
- La base de datos `botica_duran`
- Todas las tablas necesarias
- Un usuario administrador por defecto
- Categorías y productos de ejemplo

### 2. Configurar Variables de Entorno

El archivo `.env` ya está creado en `backend/.env`. Verifica que los datos de conexión a MySQL sean correctos:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=         # Pon aquí tu contraseña de MySQL (si tienes)
DB_NAME=botica_duran
```

### 3. Instalar Dependencias del Backend

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
cd backend
npm install
```

### 4. Iniciar el Servidor Backend

Desde la carpeta `backend`:

```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 5000
📊 Ambiente: development
🌐 URL: http://localhost:5000
✅ Conexión a MySQL establecida correctamente
```

## 🎨 Instalación del Frontend

### 1. Instalar Dependencias del Frontend

Abre **otra terminal** (deja la del backend corriendo) y ejecuta:

```bash
cd frontend
npm install
```

### 2. Iniciar el Servidor de Desarrollo

Desde la carpeta `frontend`:

```bash
npm run dev
```

El navegador se abrirá automáticamente en `http://localhost:3000`

## 🔐 Acceso al Sistema

### Credenciales por Defecto

```
Usuario: admin
Contraseña: admin123
```

## ✅ Verificación de Instalación

Después de iniciar ambos servidores:

1. **Backend**: Abre `http://localhost:5000/api/health` en tu navegador
   - Deberías ver: `{"status":"ok","message":"Botica Duran API está funcionando correctamente",...}`

2. **Frontend**: Abre `http://localhost:3000`
   - Deberías ver la página de login

3. **Inicia sesión** con las credenciales por defecto
4. **Explora el dashboard** para verificar que todo funcione correctamente

## 🎯 Funcionalidades Principales

Una vez dentro del sistema, podrás:

### 💊 Gestión de Productos
- Ver listado de productos
- Crear nuevos productos (usa el botón "Nuevo Producto")
- Editar productos existentes
- Ver alertas de stock bajo

### 🛒 Punto de Venta
- Hacer ventas rápidamente
- Buscar productos por nombre
- Gestionar carrito de compras
- Aplicar descuentos
- Múltiples métodos de pago

### 📊 Dashboard
- Ver estadísticas del día y del mes
- Monitorear ventas y ganancias
- Alertas de stock bajo y productos por vencer
- Historial de ventas recientes

### 📈 Reportes
- Productos más vendidos
- Stock bajo
- Productos próximos a vencer
- Análisis de ganancias

### 👥 Gestión
- Clientes
- Proveedores
- Compras
- Historial completo

## 🔧 Solución de Problemas

### El backend no se conecta a MySQL

1. Verifica que MySQL esté corriendo
2. Revisa las credenciales en `backend/.env`
3. Asegúrate de que la base de datos `botica_duran` exista

### El frontend no se conecta al backend

1. Verifica que el backend esté corriendo en el puerto 5000
2. Revisa `frontend/.env` que tenga: `REACT_APP_API_URL=http://localhost:5000/api`

### Error al instalar dependencias

1. Asegúrate de tener Node.js v16 o superior: `node --version`
2. Limpia la caché de npm: `npm cache clean --force`
3. Elimina `node_modules` y vuelve a instalar: `rm -rf node_modules && npm install`

## 📱 Instalación como PWA en Celular

1. Abre la aplicación en el navegador de tu celular (Chrome o Safari)
2. Busca la opción "Agregar a pantalla de inicio" o "Instalar"
3. La aplicación se instalará como una app nativa
4. Podrás usarla offline (las funcionalidades que no requieran internet)

## 🚀 Próximos Pasos

1. **Cambia la contraseña del admin**: Ve a tu perfil y actualiza las credenciales
2. **Configura tus productos**: Agrega los productos de tu farmacia
3. **Registra proveedores**: Agrega tus proveedores habituales
4. **Registra clientes**: Opcionalmente, agrega tus clientes frecuentes
5. **¡Empieza a vender!**: Usa el Punto de Venta para registrar tus ventas

## 📞 Soporte

Si tienes algún problema durante la instalación, revisa:

1. Que MySQL esté corriendo
2. Que ambos servidores (backend y frontend) estén activos
3. Que los puertos 5000 y 3000 no estén siendo usados por otras aplicaciones

---

¡Listo! Tu sistema de gestión para Botica Duran está funcionando. 🎉
