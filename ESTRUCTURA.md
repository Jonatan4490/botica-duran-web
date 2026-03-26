# 📁 Estructura del Proyecto

```
botica-duran/
│
├── 📄 README.md                 # Documentación principal
├── 📄 INSTALACION.md            # Guía detallada de instalación
├── 📄 INICIO_RAPIDO.md          # Guía rápida (3 pasos)
├── 📄 RESUMEN_COMPLETO.md       # Resumen de características
├── 📄 .gitignore                # Archivos ignorados por Git
│
├── 📂 backend/                  # Servidor Node.js + Express
│   ├── 📄 package.json          # Dependencias del backend
│   ├── 📄 server.js             # Servidor principal
│   ├── 📄 .env                  # Variables de entorno
│   ├── 📄 .env.example          # Ejemplo de variables
│   │
│   ├── 📂 config/               # Configuraciones
│   │   └── database.js          # Conexión a MySQL
│   │
│   ├── 📂 database/             # Base de datos
│   │   └── schema.sql           # Esquema de BD
│   │
│   ├── 📂 middleware/           # Middlewares
│   │   └── auth.js              # Autenticación JWT
│   │
│   └── 📂 routes/               # Rutas de la API
│       ├── auth.js              # Login, perfil
│       ├── productos.js         # CRUD productos
│       ├── categorias.js        # CRUD categorías
│       ├── clientes.js          # CRUD clientes
│       ├── proveedores.js       # CRUD proveedores
│       ├── ventas.js            # Ventas y POS
│       ├── compras.js           # Compras
│       ├── reportes.js          # Reportes
│       └── dashboard.js         # Estadísticas
│
└── 📂 frontend/                 # Aplicación React
    ├── 📄 package.json          # Dependencias del frontend
    ├── 📄 vite.config.js        # Configuración de Vite
    ├── 📄 index.html            # HTML principal
    ├── 📄 .env                  # Variables de entorno
    │
    ├── 📂 public/               # Archivos estáticos
    │   ├── favicon.ico
    │   ├── logo192.png
    │   └── logo512.png
    │
    └── 📂 src/                  # Código fuente
        ├── 📄 main.jsx          # Punto de entrada
        ├── 📄 App.jsx           # Componente principal
        ├── 📄 index.css         # Estilos globales
        │
        ├── 📂 components/       # Componentes reutilizables
        │   └── 📂 Layout/
        │       ├── Sidebar.jsx
        │       └── Sidebar.css
        │
        ├── 📂 context/          # React Context
        │   └── AuthContext.jsx  # Contexto de autenticación
        │
        ├── 📂 pages/            # Páginas de la aplicación
        │   ├── Login.jsx        # Página de login
        │   ├── Login.css
        │   ├── Dashboard.jsx    # Dashboard principal
        │   ├── Productos.jsx    # Gestión de productos
        │   ├── NuevaVenta.jsx   # Punto de venta (POS)
        │   ├── Ventas.jsx       # Historial de ventas
        │   ├── Clientes.jsx     # Gestión de clientes
        │   ├── Proveedores.jsx  # Gestión de proveedores
        │   ├── Compras.jsx      # Gestión de compras
        │   ├── Reportes.jsx     # Reportes y análisis
        │   └── Pages.css        # Estilos de páginas
        │
        └── 📂 utils/            # Utilidades
            └── api.js           # Cliente HTTP (Axios)
```

## 🔑 Archivos Clave

### Backend
- **`server.js`**: Punto de entrada del servidor, configuración de middlewares y rutas
- **`database.js`**: Pool de conexiones MySQL con manejo de errores
- **`schema.sql`**: Estructura completa de la base de datos (11 tablas)
- **`auth.js`**: Middleware de autenticación con JWT
- **Rutas**: 8 archivos con más de 50 endpoints API

### Frontend
- **`App.jsx`**: Router principal y rutas protegidas
- **`AuthContext.jsx`**: Gestión global de autenticación
- **`api.js`**: Cliente HTTP con interceptores para tokens
- **`index.css`**: Sistema de diseño completo (CSS Variables)
- **Páginas**: 9 páginas completas con funcionalidad

## 📊 Números del Proyecto

```
Backend:
  - 8 archivos de rutas
  - 50+ endpoints API
  - 11 tablas en MySQL
  - 1 middleware de auth
  - 139 paquetes npm

Frontend:
  - 9 páginas principales
  - 2 componentes de layout
  - 1 contexto global
  - 494 paquetes npm
  - PWA configurado
  
Base de Datos:
  - 11 tablas relacionadas
  - 6 categorías por defecto
  - 5 productos de ejemplo
  - 1 usuario admin
  - Índices optimizados
```

## 🎯 Flujo de Datos

```
Usuario → Frontend (React)
           ↓
       API Request (Axios)
           ↓
       Backend (Express)
           ↓
       Autenticación (JWT)
           ↓
       Base de Datos (MySQL)
           ↓
       Respuesta JSON
           ↓
       Frontend actualiza UI
```

## 🔐 Seguridad Implementada

1. **JWT Tokens**: Expiración en 7 días
2. **Bcrypt**: Hash de contraseñas (10 rounds)
3. **CORS**: Solo origen permitido
4. **Helmet**: Headers de seguridad
5. **Validation**: Express Validator en todas las rutas
6. **SQL Injection**: Queries parametrizadas

## 🚀 Tecnologías por Capa

```
Frontend:
├── React 18
├── Vite
├── React Router v6
├── Axios
├── React Toastify
├── React Icons
└── Workbox (PWA)

Backend:
├── Express 4
├── MySQL2
├── JWT
├── Bcrypt
├── CORS
├── Helmet
└── Compression

Database:
└── MySQL 8.0
```
