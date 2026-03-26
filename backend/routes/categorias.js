const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/categorias
// @desc    Obtener todas las categorías
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { activo } = req.query;

        let query = 'SELECT * FROM categorias WHERE 1=1';
        const params = [];

        if (activo !== undefined) {
            query += ' AND activo = ?';
            params.push(activo === 'true');
        }

        query += ' ORDER BY nombre ASC';

        const [categorias] = await db.query(query, params);
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// @route   POST /api/categorias
// @desc    Crear nueva categoría
// @access  Private
router.post('/', [
    body('nombre').notEmpty().withMessage('El nombre es requerido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, descripcion } = req.body;

        const [result] = await db.query(
            'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );

        res.status(201).json({
            message: 'Categoría creada exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});

// @route   PUT /api/categorias/:id
// @desc    Actualizar categoría
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { nombre, descripcion, activo } = req.body;

        const [result] = await db.query(
            'UPDATE categorias SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
            [nombre, descripcion, activo !== undefined ? activo : true, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});

// @route   DELETE /api/categorias/:id
// @desc    Eliminar categoría
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE categorias SET activo = FALSE WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

module.exports = router;
