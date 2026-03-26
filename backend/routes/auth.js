const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Public
router.post('/login', [
    body('usuario').notEmpty().withMessage('El usuario es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { usuario, password } = req.body;

        // Buscar usuario
        const [users] = await db.query(
            'SELECT * FROM usuarios WHERE usuario = ? AND activo = TRUE',
            [usuario]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            {
                id: user.id,
                usuario: user.usuario,
                nombre: user.nombre,
                rol: user.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Registrar último acceso
        await db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// @route   GET /api/auth/me
// @desc    Obtener datos del usuario autenticado
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, nombre, usuario, rol FROM usuarios WHERE id = ? AND activo = TRUE',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener datos del usuario' });
    }
});

// @route   POST /api/auth/change-password
// @desc    Cambiar contraseña
// @access  Private
router.post('/change-password', [
    verifyToken,
    body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida'),
    body('passwordNueva').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { passwordActual, passwordNueva } = req.body;

        // Obtener usuario
        const [users] = await db.query(
            'SELECT password FROM usuarios WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(passwordActual, users[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hash nueva contraseña
        const hashedPassword = await bcrypt.hash(passwordNueva, 10);

        // Actualizar contraseña
        await db.query(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
});

// @route   GET /api/auth/usuarios
// @desc    Listar todos los usuarios (solo admin)
// @access  Private/Admin
router.get('/usuarios', verifyToken, async (req, res) => {
    try {
        const [usuarios] = await db.query(
            'SELECT id, nombre, usuario, rol, activo, ultimo_acceso, created_at FROM usuarios ORDER BY nombre ASC'
        );
        res.json(usuarios);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

// @route   POST /api/auth/usuarios
// @desc    Crear nuevo usuario (solo admin)
// @access  Private/Admin
router.post('/usuarios', [
    verifyToken,
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('usuario').notEmpty().withMessage('El usuario es requerido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').isIn(['admin', 'vendedor']).withMessage('El rol debe ser admin o vendedor')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { nombre, usuario, password, rol } = req.body;
        // Verificar que el usuario no exista
        const [existing] = await db.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, usuario, hashedPassword, rol]
        );
        res.status(201).json({ message: 'Usuario creado exitosamente', id: result.insertId });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// @route   PUT /api/auth/usuarios/:id/toggle
// @desc    Activar/Desactivar usuario
// @access  Private/Admin
router.put('/usuarios/:id/toggle', verifyToken, async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        }
        await db.query('UPDATE usuarios SET activo = NOT activo WHERE id = ?', [req.params.id]);
        res.json({ message: 'Estado de usuario actualizado' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

module.exports = router;
