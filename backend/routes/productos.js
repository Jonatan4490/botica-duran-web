const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// @route   GET /api/productos
// @desc    Obtener todos los productos
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { search, categoria, bajo_stock, activo } = req.query;

        let query = `
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            // Usamos COLLATE utf8mb4_unicode_ci para ignorar acentos en la búsqueda
            query += ' AND (p.nombre COLLATE utf8mb4_unicode_ci LIKE ? OR p.codigo_interno LIKE ? OR p.codigo_barras LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (categoria) {
            query += ' AND p.categoria_id = ?';
            params.push(categoria);
        }

        if (bajo_stock === 'true') {
            query += ' AND p.stock_actual <= p.stock_minimo';
        }

        if (activo !== undefined) {
            query += ' AND p.activo = ?';
            params.push(activo === 'true');
        }

        query += ' ORDER BY p.nombre ASC';

        const [productos] = await db.query(query, params);
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// @route   GET /api/productos/:id
// @desc    Obtener un producto por ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const [productos] = await db.query(
            `SELECT p.*, c.nombre as categoria_nombre
             FROM productos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (productos.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Obtener lotes del producto
        const [lotes] = await db.query(
            `SELECT l.*, pr.nombre as proveedor_nombre
             FROM lotes l
             LEFT JOIN proveedores pr ON l.proveedor_id = pr.id
             WHERE l.producto_id = ? AND l.activo = TRUE
             ORDER BY l.fecha_vencimiento ASC`,
            [req.params.id]
        );

        res.json({
            ...productos[0],
            lotes
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// @route   POST /api/productos
// @desc    Crear nuevo producto
// @access  Private
router.post('/', [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('precio_compra').isFloat({ min: 0 }).withMessage('El precio de compra debe ser mayor o igual a 0'),
    body('precio_venta').isFloat({ min: 0 }).withMessage('El precio de venta debe ser mayor o igual a 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            nombre,
            descripcion,
            categoria_id,
            unidad_medida,
            precio_compra,
            precio_venta,
            stock_actual,
            stock_minimo,
            requiere_receta,
            codigo_barras,
            laboratorio,
            ubicacion
        } = req.body;

        // Generar código interno automático
        const [ultimoProducto] = await db.query(
            'SELECT MAX(id) as max_id FROM productos'
        );
        const nuevoId = (ultimoProducto[0].max_id || 0) + 1;
        const codigoInterno = `PROD-${String(nuevoId).padStart(5, '0')}`;

        const [result] = await db.query(
            `INSERT INTO productos 
            (nombre, descripcion, categoria_id, unidad_medida, precio_compra, precio_venta, 
             stock_actual, stock_minimo, requiere_receta,
             codigo_barras, codigo_interno, laboratorio, ubicacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion, categoria_id, unidad_medida || 'Unidad', precio_compra, precio_venta,
                stock_actual || 0, stock_minimo || 5, requiere_receta || false,
                codigo_barras, codigoInterno, laboratorio, ubicacion]
        );

        // Registrar movimiento de inventario si hay stock inicial
        if (stock_actual > 0) {
            await db.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
                 VALUES (?, 'Entrada', ?, 'Stock inicial', ?)`,
                [result.insertId, stock_actual, req.user.id]
            );
        }

        // Ya no insertamos en precios_producto aquí, 
        // ahora se usa el sistema de presentaciones_producto gestionado por el frontend

        res.status(201).json({
            message: 'Producto creado exitosamente',
            id: result.insertId,
            codigo_interno: codigoInterno
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// @route   PUT /api/productos/:id
// @desc    Actualizar producto
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const {
            nombre, descripcion, categoria_id, unidad_medida, precio_compra,
            precio_venta, stock_minimo, requiere_receta, codigo_barras,
            laboratorio, ubicacion, activo
        } = req.body;

        // Obtener datos actuales para permitir actualización parcial
        const [actual] = await db.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        
        if (actual.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const p = actual[0];

        const [result] = await db.query(
            `UPDATE productos 
            SET nombre = ?, descripcion = ?, categoria_id = ?, unidad_medida = ?,
                precio_compra = ?, precio_venta = ?, stock_minimo = ?, 
                requiere_receta = ?, codigo_barras = ?, laboratorio = ?, 
                ubicacion = ?, activo = ?
            WHERE id = ?`,
            [
                nombre !== undefined ? nombre : p.nombre,
                descripcion !== undefined ? descripcion : p.descripcion,
                categoria_id !== undefined ? categoria_id : p.categoria_id,
                unidad_medida !== undefined ? unidad_medida : p.unidad_medida,
                precio_compra !== undefined ? precio_compra : p.precio_compra,
                precio_venta !== undefined ? precio_venta : p.precio_venta,
                stock_minimo !== undefined ? stock_minimo : p.stock_minimo,
                requiere_receta !== undefined ? requiere_receta : p.requiere_receta,
                codigo_barras !== undefined ? codigo_barras : p.codigo_barras,
                laboratorio !== undefined ? laboratorio : p.laboratorio,
                ubicacion !== undefined ? ubicacion : p.ubicacion,
                activo !== undefined ? activo : p.activo,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// @route   POST /api/productos/:id/ajustar-stock
// @desc    Ajustar stock de producto
// @access  Private
router.post('/:id/ajustar-stock', [
    body('cantidad').isInt().withMessage('La cantidad debe ser un número entero'),
    body('motivo').notEmpty().withMessage('El motivo es requerido')
], async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { cantidad, motivo } = req.body;
        const productoId = req.params.id;

        // Obtener stock actual
        const [productos] = await connection.query(
            'SELECT stock_actual FROM productos WHERE id = ?',
            [productoId]
        );

        if (productos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const stockNuevo = productos[0].stock_actual + cantidad;

        if (stockNuevo < 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        // Actualizar stock
        await connection.query(
            'UPDATE productos SET stock_actual = ? WHERE id = ?',
            [stockNuevo, productoId]
        );

        // Registrar movimiento
        await connection.query(
            `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id)
             VALUES (?, ?, ?, ?, ?)`,
            [productoId, cantidad > 0 ? 'Entrada' : 'Salida', Math.abs(cantidad), motivo, req.user.id]
        );

        await connection.commit();
        res.json({
            message: 'Stock ajustado exitosamente',
            stock_nuevo: stockNuevo
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al ajustar stock:', error);
        res.status(500).json({ error: 'Error al ajustar stock' });
    } finally {
        connection.release();
    }
});

// @route   DELETE /api/productos/:id
// @desc    Eliminar (desactivar) producto
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE productos SET activo = FALSE WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

module.exports = router;
