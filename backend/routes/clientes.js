const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/clientes
// @desc    Obtener todos los clientes
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { search, activo } = req.query;

        let query = 'SELECT * FROM clientes WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (nombre LIKE ? OR dni LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (activo !== undefined) {
            query += ' AND activo = ?';
            params.push(activo === 'true');
        }

        query += ' ORDER BY nombre ASC';

        const [clientes] = await db.query(query, params);
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// @route   POST /api/clientes
// @desc    Crear nuevo cliente
// @access  Private
router.post('/', [
    body('nombre').notEmpty().withMessage('El nombre es requerido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, dni, telefono, email, direccion } = req.body;

        const [result] = await db.query(
            'INSERT INTO clientes (nombre, dni, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)',
            [nombre, dni, telefono, email, direccion]
        );

        res.status(201).json({
            message: 'Cliente creado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// @route   PUT /api/clientes/:id
// @desc    Actualizar cliente
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { nombre, dni, telefono, email, direccion, activo } = req.body;

        const [result] = await db.query(
            `UPDATE clientes 
            SET nombre = ?, dni = ?, telefono = ?, email = ?, direccion = ?, activo = ?
            WHERE id = ?`,
            [nombre, dni, telefono, email, direccion, activo !== undefined ? activo : true, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// @route   GET /api/clientes/:id/historial
// @desc    Obtener historial de compras de un cliente
// @access  Private
router.get('/:id/historial', async (req, res) => {
    try {
        const [ventas] = await db.query(
            `SELECT v.*, u.nombre as usuario_nombre
             FROM ventas v
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE v.cliente_id = ? AND v.estado = 'Completada'
             ORDER BY v.created_at DESC
             LIMIT 50`,
            [req.params.id]
        );

        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

module.exports = router;
