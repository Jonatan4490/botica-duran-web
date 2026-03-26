const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/reportes/ventas
// @desc    Reporte de ventas
// @access  Private
router.get('/ventas', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        let query = `
            SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as total_ventas,
                SUM(total) as total_ingresos,
                SUM(descuento) as total_descuentos,
                AVG(total) as ticket_promedio
            FROM ventas
            WHERE estado = 'Completada'
        `;
        const params = [];

        if (fecha_inicio) {
            query += ' AND DATE(created_at) >= ?';
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            query += ' AND DATE(created_at) <= ?';
            params.push(fecha_fin);
        }

        query += ' GROUP BY DATE(created_at) ORDER BY fecha DESC';

        const [ventas] = await db.query(query, params);
        res.json(ventas);
    } catch (error) {
        console.error('Error en reporte de ventas:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

// @route   GET /api/reportes/productos-mas-vendidos
// @desc    Productos más vendidos
// @access  Private
router.get('/productos-mas-vendidos', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, limit } = req.query;

        let query = `
            SELECT 
                p.id,
                p.nombre,
                p.unidad_medida,
                c.nombre as categoria,
                SUM(dv.cantidad) as cantidad_vendida,
                SUM(dv.total) as total_ventas,
                COUNT(DISTINCT dv.venta_id) as numero_transacciones
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            INNER JOIN ventas v ON dv.venta_id = v.id
            WHERE v.estado = 'Completada'
        `;
        const params = [];

        if (fecha_inicio) {
            query += ' AND DATE(v.created_at) >= ?';
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            query += ' AND DATE(v.created_at) <= ?';
            params.push(fecha_fin);
        }

        query += ` 
            GROUP BY p.id, p.nombre, p.unidad_medida, c.nombre
            ORDER BY cantidad_vendida DESC
            LIMIT ?
        `;
        params.push(parseInt(limit) || 10);

        const [productos] = await db.query(query, params);
        res.json(productos);
    } catch (error) {
        console.error('Error en reporte de productos:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

// @route   GET /api/reportes/productos-vencimiento
// @desc    Productos próximos a vencer
// @access  Private
router.get('/productos-vencimiento', async (req, res) => {
    try {
        const { dias } = req.query;
        const diasAlerta = parseInt(dias) || 30;

        const [lotes] = await db.query(
            `SELECT 
                l.id,
                l.numero_lote,
                l.fecha_vencimiento,
                l.cantidad,
                p.id as producto_id,
                p.nombre as producto_nombre,
                pr.nombre as proveedor_nombre,
                DATEDIFF(l.fecha_vencimiento, CURDATE()) as dias_restantes
            FROM lotes l
            INNER JOIN productos p ON l.producto_id = p.id
            LEFT JOIN proveedores pr ON l.proveedor_id = pr.id
            WHERE l.activo = TRUE
            AND l.fecha_vencimiento IS NOT NULL
            AND DATEDIFF(l.fecha_vencimiento, CURDATE()) <= ?
            AND DATEDIFF(l.fecha_vencimiento, CURDATE()) >= 0
            ORDER BY l.fecha_vencimiento ASC`,
            [diasAlerta]
        );

        res.json(lotes);
    } catch (error) {
        console.error('Error en reporte de vencimientos:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

// @route   GET /api/reportes/stock-bajo
// @desc    Productos con stock bajo
// @access  Private
router.get('/stock-bajo', async (req, res) => {
    try {
        const [productos] = await db.query(
            `SELECT 
                p.id,
                p.nombre,
                p.stock_actual,
                p.stock_minimo,
                p.unidad_medida,
                c.nombre as categoria,
                (p.stock_minimo - p.stock_actual) as cantidad_necesaria
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = TRUE
            AND p.stock_actual <= p.stock_minimo
            ORDER BY (p.stock_minimo - p.stock_actual) DESC`
        );

        res.json(productos);
    } catch (error) {
        console.error('Error en reporte de stock bajo:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

// @route   GET /api/reportes/ganancias
// @desc    Reporte de ganancias
// @access  Private
router.get('/ganancias', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        let query = `
            SELECT 
                DATE(v.created_at) as fecha,
                SUM(dv.cantidad * p.precio_compra) as costo_total,
                SUM(dv.total) as venta_total,
                SUM(dv.total - (dv.cantidad * p.precio_compra)) as ganancia_bruta,
                COUNT(DISTINCT v.id) as numero_ventas
            FROM ventas v
            INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE v.estado = 'Completada'
        `;
        const params = [];

        if (fecha_inicio) {
            query += ' AND DATE(v.created_at) >= ?';
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            query += ' AND DATE(v.created_at) <= ?';
            params.push(fecha_fin);
        }

        query += ' GROUP BY DATE(v.created_at) ORDER BY fecha DESC';

        const [ganancias] = await db.query(query, params);
        res.json(ganancias);
    } catch (error) {
        console.error('Error en reporte de ganancias:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

// @route   GET /api/reportes/resumen-ejecutivo
// @desc    Resumen ejecutivo con totales del período
// @access  Private
router.get('/resumen-ejecutivo', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const params = [];
        let dateFilter = '';
        if (fecha_inicio) { dateFilter += ' AND DATE(v.created_at) >= ?'; params.push(fecha_inicio); }
        if (fecha_fin) { dateFilter += ' AND DATE(v.created_at) <= ?'; params.push(fecha_fin); }

        const [totales] = await db.query(`
            SELECT
                COUNT(DISTINCT v.id) as total_ventas,
                COALESCE(SUM(v.total), 0) as ingresos_totales,
                COALESCE(SUM(v.descuento), 0) as descuentos_totales,
                COALESCE(SUM(dv.cantidad * p.precio_compra), 0) as costo_total,
                COALESCE(SUM(v.total) - SUM(dv.cantidad * p.precio_compra), 0) as ganancia_bruta,
                COALESCE(AVG(v.total), 0) as ticket_promedio,
                COUNT(DISTINCT v.cliente_id) as clientes_unicos
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
            LEFT JOIN productos p ON dv.producto_id = p.id
            WHERE v.estado = 'Completada' ${dateFilter}
        `, params);

        const [porMetodo] = await db.query(`
            SELECT metodo_pago, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as monto
            FROM ventas WHERE estado = 'Completada' ${fecha_inicio || fecha_fin ? dateFilter.replace(/dv\.cantidad/g, '0').replace(/p\.precio_compra/g, '0') : ''}
            GROUP BY metodo_pago ORDER BY monto DESC
        `, params);

        res.json({ totales: totales[0], por_metodo_pago: porMetodo });
    } catch (error) {
        console.error('Error en resumen ejecutivo:', error);
        res.status(500).json({ error: 'Error al generar resumen' });
    }
});

// @route   GET /api/reportes/exportar-csv
// @desc    Exportar reporte de ventas como CSV
// @access  Private
router.get('/exportar-csv', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const params = [];
        let query = `
            SELECT v.numero_ticket, DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i') as fecha,
                   COALESCE(c.nombre, 'Público General') as cliente,
                   v.metodo_pago, v.subtotal, v.descuento, v.total, v.estado,
                   u.nombre as vendedor
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.estado = 'Completada'
        `;
        if (fecha_inicio) { query += ' AND DATE(v.created_at) >= ?'; params.push(fecha_inicio); }
        if (fecha_fin) { query += ' AND DATE(v.created_at) <= ?'; params.push(fecha_fin); }
        query += ' ORDER BY v.created_at DESC';

        const [ventas] = await db.query(query, params);

        // Generar CSV
        const headers = ['Ticket', 'Fecha', 'Cliente', 'Método Pago', 'Subtotal', 'Descuento', 'Total', 'Estado', 'Vendedor'];
        const rows = ventas.map(v => [
            v.numero_ticket, v.fecha, v.cliente, v.metodo_pago,
            v.subtotal, v.descuento, v.total, v.estado, v.vendedor
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=ventas_${fecha_inicio || 'todas'}_${fecha_fin || ''}.csv`);
        res.send('\uFEFF' + csv); // BOM para Excel
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        res.status(500).json({ error: 'Error al exportar' });
    }
});

module.exports = router;
