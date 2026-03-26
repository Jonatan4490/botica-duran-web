const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/database');

const app = express();

// Middlewares de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5173', 
    process.env.FRONTEND_URL
].filter(Boolean); // filtra nulos

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin "origin" (postman, mobile) o los que estén en allowedOrigins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS: origen no permitido.'));
        }
    },
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/proveedores', require('./routes/proveedores'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/compras', require('./routes/compras'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/precios', require('./routes/precios'));
app.use('/api/presentaciones', require('./routes/presentaciones'));

// Ruta de Health Check
app.get('/api/health', async (req, res) => {
    let dbStatus = 'unknown';
    try {
        const connection = await db.getConnection();
        connection.release();
        dbStatus = 'connected';
    } catch {
        dbStatus = 'disconnected';
    }
    res.json({
        status: 'ok',
        message: 'Botica Duran API está funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: dbStatus,
        version: '2.0.0'
    });
});

// Ruta de Búsqueda Global
app.get('/api/buscar', require('./middleware/auth').verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ productos: [], clientes: [] });
        }
        const term = `%${q}%`;
        const [productos] = await db.query(
            `SELECT id, nombre, stock_actual, precio_venta, codigo_interno FROM productos
             WHERE activo = TRUE AND (nombre LIKE ? OR codigo_barras LIKE ? OR codigo_interno LIKE ?)
             LIMIT 8`,
            [term, term, term]
        );
        const [clientes] = await db.query(
            `SELECT id, nombre, dni, telefono FROM clientes
             WHERE activo = TRUE AND (nombre LIKE ? OR dni LIKE ?)
             LIMIT 5`,
            [term, term]
        );
        res.json({ productos, clientes });
    } catch (error) {
        console.error('Error en búsqueda global:', error);
        res.status(500).json({ error: 'Error en búsqueda' });
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Botica Duran API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            productos: '/api/productos',
            categorias: '/api/categorias',
            proveedores: '/api/proveedores',
            clientes: '/api/clientes',
            ventas: '/api/ventas',
            compras: '/api/compras',
            reportes: '/api/reportes',
            dashboard: '/api/dashboard',
            precios: '/api/precios'
        }
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});
