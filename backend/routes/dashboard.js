const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/dashboard/stats
// @desc    Obtener estadísticas del dashboard
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];

        // Ventas del día
        const [ventasHoy] = await db.query(
            `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto
             FROM ventas 
             WHERE DATE(created_at) = ? AND estado = 'Completada'`,
            [hoy]
        );

        // Ventas del mes
        const [ventasMes] = await db.query(
            `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto
             FROM ventas 
             WHERE MONTH(created_at) = MONTH(CURDATE()) 
             AND YEAR(created_at) = YEAR(CURDATE())
             AND estado = 'Completada'`
        );

        // Productos con stock bajo
        const [stockBajo] = await db.query(
            'SELECT COUNT(*) as total FROM productos WHERE stock_actual <= stock_minimo AND activo = TRUE'
        );

        // Productos próximos a vencer (30 días)
        const [proxVencer] = await db.query(
            `SELECT COUNT(*) as total FROM lotes 
             WHERE activo = TRUE 
             AND fecha_vencimiento IS NOT NULL
             AND DATEDIFF(fecha_vencimiento, CURDATE()) <= 30
             AND DATEDIFF(fecha_vencimiento, CURDATE()) >= 0`
        );

        // Total de productos
        const [totalProductos] = await db.query(
            'SELECT COUNT(*) as total FROM productos WHERE activo = TRUE'
        );

        // Total de clientes
        const [totalClientes] = await db.query(
            'SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE'
        );

        // Ganancia del día
        const [gananciaHoy] = await db.query(
            `SELECT 
                COALESCE(SUM(dv.total - (dv.cantidad * p.precio_compra)), 0) as ganancia
             FROM ventas v
             INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
             INNER JOIN productos p ON dv.producto_id = p.id
             WHERE DATE(v.created_at) = ? AND v.estado = 'Completada'`,
            [hoy]
        );

        // Ganancia del mes
        const [gananciaMes] = await db.query(
            `SELECT 
                COALESCE(SUM(dv.total - (dv.cantidad * p.precio_compra)), 0) as ganancia
             FROM ventas v
             INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
             INNER JOIN productos p ON dv.producto_id = p.id
             WHERE MONTH(v.created_at) = MONTH(CURDATE())
             AND YEAR(v.created_at) = YEAR(CURDATE())
             AND v.estado = 'Completada'`
        );

        res.json({
            ventas_hoy: {
                cantidad: ventasHoy[0].total,
                monto: parseFloat(ventasHoy[0].monto)
            },
            ventas_mes: {
                cantidad: ventasMes[0].total,
                monto: parseFloat(ventasMes[0].monto)
            },
            ganancia_hoy: parseFloat(gananciaHoy[0].ganancia),
            ganancia_mes: parseFloat(gananciaMes[0].ganancia),
            stock_bajo: stockBajo[0].total,
            proximos_vencer: proxVencer[0].total,
            total_productos: totalProductos[0].total,
            total_clientes: totalClientes[0].total
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// @route   GET /api/dashboard/ventas-recientes
// @desc    Obtener últimas ventas
// @access  Private
router.get('/ventas-recientes', async (req, res) => {
    try {
        const [ventas] = await db.query(
            `SELECT v.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
             FROM ventas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE v.estado = 'Completada'
             ORDER BY v.created_at DESC
             LIMIT 10`
        );

        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener ventas recientes:', error);
        res.status(500).json({ error: 'Error al obtener ventas recientes' });
    }
});

// @route   GET /api/dashboard/graficas-ventas
// @desc    Datos para gráficas de ventas (últimos 7 días)
// @access  Private
router.get('/graficas-ventas', async (req, res) => {
    try {
        const [datos] = await db.query(
            `SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as cantidad_ventas,
                COALESCE(SUM(total), 0) as total_ventas,
                COALESCE(SUM(total - (
                    SELECT SUM(dv.cantidad * p.precio_compra)
                    FROM detalle_ventas dv
                    INNER JOIN productos p ON dv.producto_id = p.id
                    WHERE dv.venta_id = v.id
                )), 0) as ganancia
             FROM ventas v
             WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             AND estado = 'Completada'
             GROUP BY DATE(created_at)
             ORDER BY fecha ASC`
        );

        res.json(datos);
    } catch (error) {
        console.error('Error al obtener datos de gráficas:', error);
        res.status(500).json({ error: 'Error al obtener datos de gráficas' });
    }
});

// @route   GET /api/dashboard/metodos-pago
// @desc    Datos de métodos de pago para gráfico doughnut REAL
// @access  Private
router.get('/metodos-pago', async (req, res) => {
    try {
        const { mes } = req.query;
        let query = `
            SELECT metodo_pago, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as monto
            FROM ventas
            WHERE estado = 'Completada'
        `;
        const params = [];
        if (mes) {
            query += ' AND MONTH(created_at) = ? AND YEAR(created_at) = YEAR(CURDATE())';
            params.push(mes);
        } else {
            query += ' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        }
        query += ' GROUP BY metodo_pago ORDER BY monto DESC';
        const [datos] = await db.query(query, params);
        res.json(datos);
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        res.status(500).json({ error: 'Error al obtener métodos de pago' });
    }
});

// @route   GET /api/dashboard/top-productos-hoy
// @desc    Top productos vendidos hoy
// @access  Private
router.get('/top-productos-hoy', async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const [datos] = await db.query(
            `SELECT p.nombre, SUM(dv.cantidad_unidades) as unidades, SUM(dv.total) as monto
             FROM detalle_ventas dv
             INNER JOIN productos p ON dv.producto_id = p.id
             INNER JOIN ventas v ON dv.venta_id = v.id
             WHERE DATE(v.created_at) = ? AND v.estado = 'Completada'
             GROUP BY p.id, p.nombre
             ORDER BY unidades DESC
             LIMIT 5`,
            [hoy]
        );
        res.json(datos);
    } catch (error) {
        console.error('Error al obtener top productos hoy:', error);
        res.status(500).json({ error: 'Error al obtener top productos hoy' });
    }
});

module.exports = router;
