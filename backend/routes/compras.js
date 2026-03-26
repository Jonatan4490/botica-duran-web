const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/compras
// @desc    Obtener todas las compras
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { proveedor_id, estado } = req.query;

        let query = `
            SELECT c.*, p.nombre as proveedor_nombre, u.nombre as usuario_nombre
            FROM compras c
            LEFT JOIN proveedores p ON c.proveedor_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (proveedor_id) {
            query += ' AND c.proveedor_id = ?';
            params.push(proveedor_id);
        }

        if (estado) {
            query += ' AND c.estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY c.created_at DESC';

        const [compras] = await db.query(query, params);
        res.json(compras);
    } catch (error) {
        console.error('Error al obtener compras:', error);
        res.status(500).json({ error: 'Error al obtener compras' });
    }
});

// @route   POST /api/compras
// @desc    Crear nueva compra
// @access  Private
router.post('/', [
    body('proveedor_id').notEmpty().withMessage('El proveedor es requerido'),
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('fecha_compra').notEmpty().withMessage('La fecha de compra es requerida')
], async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await connection.rollback();
            return res.status(400).json({ errors: errors.array() });
        }

        const { proveedor_id, items, fecha_compra, observaciones } = req.body;

        // Calcular total
        let total = 0;
        for (const item of items) {
            total += item.precio_unitario * item.cantidad;
        }

        // Generar número de compra
        const fecha = new Date();
        const numeroCompra = `C${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

        // Crear compra
        const [compraResult] = await connection.query(
            `INSERT INTO compras (numero_compra, proveedor_id, usuario_id, total, fecha_compra, observaciones, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'Recibida')`,
            [numeroCompra, proveedor_id, req.user.id, total, fecha_compra, observaciones]
        );

        const compraId = compraResult.insertId;

        // Insertar detalles y actualizar stock
        for (const item of items) {
            // Insertar detalle
            await connection.query(
                `INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, total)
                 VALUES (?, ?, ?, ?, ?)`,
                [compraId, item.producto_id, item.cantidad, item.precio_unitario, item.precio_unitario * item.cantidad]
            );

            // Actualizar stock y precio de compra
            await connection.query(
                `UPDATE productos 
                 SET stock_actual = stock_actual + ?,
                     precio_compra = ?
                 WHERE id = ?`,
                [item.cantidad, item.precio_unitario, item.producto_id]
            );

            // Registrar movimiento
            await connection.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id, referencia_id, referencia_tipo)
                 VALUES (?, 'Entrada', ?, 'Compra a proveedor', ?, ?, 'Compra')`,
                [item.producto_id, item.cantidad, req.user.id, compraId]
            );

            // Crear lote si se proporciona información
            if (item.numero_lote || item.fecha_vencimiento) {
                await connection.query(
                    `INSERT INTO lotes (producto_id, proveedor_id, numero_lote, cantidad, precio_compra, fecha_compra, fecha_vencimiento)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [item.producto_id, proveedor_id, item.numero_lote, item.cantidad, item.precio_unitario, fecha_compra, item.fecha_vencimiento]
                );
            }
        }

        await connection.commit();

        res.status(201).json({
            message: 'Compra registrada exitosamente',
            id: compraId,
            numero_compra: numeroCompra
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear compra:', error);
        res.status(500).json({ error: 'Error al registrar compra' });
    } finally {
        connection.release();
    }
});

module.exports = router;
