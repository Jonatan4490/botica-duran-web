const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/ventas
// @desc    Obtener todas las ventas
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, cliente_id, estado } = req.query;

        let query = `
            SELECT v.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE 1=1
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

        if (cliente_id) {
            query += ' AND v.cliente_id = ?';
            params.push(cliente_id);
        }

        if (estado) {
            query += ' AND v.estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY v.created_at DESC LIMIT 100';

        const [ventas] = await db.query(query, params);
        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
});

// @route   GET /api/ventas/:id
// @desc    Obtener una venta por ID con sus detalles
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const [ventas] = await db.query(
            `SELECT v.*, c.nombre as cliente_nombre, c.dni as cliente_dni,
                    u.nombre as usuario_nombre
             FROM ventas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE v.id = ?`,
            [req.params.id]
        );

        if (ventas.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Obtener detalle de la venta
        const [detalles] = await db.query(
            `SELECT dv.*, p.nombre as producto_nombre, p.unidad_medida
             FROM detalle_ventas dv
             INNER JOIN productos p ON dv.producto_id = p.id
             WHERE dv.venta_id = ?`,
            [req.params.id]
        );

        res.json({
            ...ventas[0],
            detalles
        });
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ error: 'Error al obtener venta' });
    }
});

// @route   POST /api/ventas
// @desc    Crear nueva venta
// @access  Private
router.post('/', [
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('metodo_pago').notEmpty().withMessage('El método de pago es requerido')
], async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await connection.rollback();
            return res.status(400).json({ errors: errors.array() });
        }

        const { items, cliente_id, metodo_pago, descuento, observaciones } = req.body;

        // Calcular totales
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.precio_unitario * (item.cantidad_presentacion || item.cantidad);
        }

        const descuentoTotal = descuento || 0;
        const total = subtotal - descuentoTotal;

        // Generar número de ticket
        const fecha = new Date();
        const numeroTicket = `T${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

        // Crear venta
        const [ventaResult] = await connection.query(
            `INSERT INTO ventas (numero_ticket, cliente_id, usuario_id, subtotal, descuento, total, metodo_pago, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [numeroTicket, cliente_id, req.user.id, subtotal, descuentoTotal, total, metodo_pago, observaciones]
        );

        const ventaId = ventaResult.insertId;

        // Insertar detalles y actualizar stock
        for (const item of items) {
            // Verificar stock (item.cantidad ya viene en unidades)
            const [productos] = await connection.query(
                'SELECT stock_actual FROM productos WHERE id = ?',
                [item.producto_id]
            );

            if (productos.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: `Producto ${item.producto_id} no encontrado` });
            }

            if (productos[0].stock_actual < item.cantidad) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente para producto ${item.producto_id}. Disponible: ${productos[0].stock_actual}, Requerido: ${item.cantidad}`
                });
            }

            // Insertar detalle
            const itemSubtotal = item.precio_unitario * (item.cantidad_presentacion || item.cantidad);
            const itemDescuento = item.descuento || 0;
            const itemTotal = itemSubtotal - itemDescuento;

            // Insertar con tipo_venta y cantidad_unidades
            await connection.query(
                `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal, descuento, total, tipo_venta, cantidad_unidades)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ventaId,
                    item.producto_id,
                    item.cantidad_presentacion || item.cantidad, // Cantidad de la presentación (ej: 2 blisters)
                    item.precio_unitario,
                    itemSubtotal,
                    itemDescuento,
                    itemTotal,
                    item.tipo_venta || 'Unidad',
                    item.cantidad // Unidades reales para stock
                ]
            );

            // Actualizar stock (item.cantidad ya está en unidades)
            await connection.query(
                'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
                [item.cantidad, item.producto_id]
            );

            // Registrar movimiento de inventario (en unidades)
            await connection.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id, referencia_id, referencia_tipo)
                 VALUES (?, 'Salida', ?, 'Venta', ?, ?, 'Venta')`,
                [item.producto_id, item.cantidad, req.user.id, ventaId]
            );
        }

        // Actualizar puntos de fidelidad si hay cliente
        if (cliente_id) {
            const puntosGanados = Math.floor(total / 10); // 1 punto por cada S/. 10
            await connection.query(
                'UPDATE clientes SET puntos_fidelidad = puntos_fidelidad + ? WHERE id = ?',
                [puntosGanados, cliente_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Venta registrada exitosamente',
            id: ventaId,
            numero_ticket: numeroTicket,
            total
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear venta:', error);
        res.status(500).json({ error: 'Error al registrar venta' });
    } finally {
        connection.release();
    }
});

// @route   PUT /api/ventas/:id/cancelar
// @desc    Cancelar una venta (devolver stock)
// @access  Private
router.put('/:id/cancelar', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Verificar que la venta existe y está completada
        const [ventas] = await connection.query(
            'SELECT * FROM ventas WHERE id = ?',
            [req.params.id]
        );

        if (ventas.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        if (ventas[0].estado === 'Cancelada') {
            await connection.rollback();
            return res.status(400).json({ error: 'La venta ya está cancelada' });
        }

        // Obtener detalles de la venta
        const [detalles] = await connection.query(
            'SELECT * FROM detalle_ventas WHERE venta_id = ?',
            [req.params.id]
        );

        // Devolver stock
        for (const detalle of detalles) {
            await connection.query(
                'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
                [detalle.cantidad, detalle.producto_id]
            );

            // Registrar movimiento
            await connection.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id, referencia_id, referencia_tipo)
                 VALUES (?, 'Entrada', ?, 'Cancelación de venta', ?, ?, 'Venta')`,
                [detalle.producto_id, detalle.cantidad, req.user.id, req.params.id]
            );
        }

        // Actualizar estado de la venta
        await connection.query(
            'UPDATE ventas SET estado = "Cancelada" WHERE id = ?',
            [req.params.id]
        );

        await connection.commit();

        res.json({ message: 'Venta cancelada exitosamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al cancelar venta:', error);
        res.status(500).json({ error: 'Error al cancelar venta' });
    } finally {
        connection.release();
    }
});

module.exports = router;
