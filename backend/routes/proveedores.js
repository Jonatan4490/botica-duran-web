const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/proveedores
// @desc    Obtener todos los proveedores
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { search, activo } = req.query;

        let query = 'SELECT * FROM proveedores WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (nombre LIKE ? OR ruc LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (activo !== undefined) {
            query += ' AND activo = ?';
            params.push(activo === 'true');
        }

        query += ' ORDER BY nombre ASC';

        const [proveedores] = await db.query(query, params);
        res.json(proveedores);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

// @route   POST /api/proveedores
// @desc    Crear nuevo proveedor
// @access  Private
router.post('/', [
    body('nombre').notEmpty().withMessage('El nombre es requerido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, ruc, direccion, telefono, email, contacto } = req.body;

        const [result] = await db.query(
            'INSERT INTO proveedores (nombre, ruc, direccion, telefono, email, contacto) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, ruc, direccion, telefono, email, contacto]
        );

        res.status(201).json({
            message: 'Proveedor creado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ error: 'Error al crear proveedor' });
    }
});

// @route   PUT /api/proveedores/:id
// @desc    Actualizar proveedor
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { nombre, ruc, direccion, telefono, email, contacto, activo } = req.body;

        const [result] = await db.query(
            `UPDATE proveedores 
            SET nombre = ?, ruc = ?, direccion = ?, telefono = ?, email = ?, contacto = ?, activo = ?
            WHERE id = ?`,
            [nombre, ruc, direccion, telefono, email, contacto,
                activo !== undefined ? activo : true, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({ message: 'Proveedor actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
});

module.exports = router;
