const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// @route   GET /api/precios/producto/:id
// @desc    Obtener todos los precios de un producto
// @access  Private
router.get('/producto/:id', async (req, res) => {
    try {
        const [precios] = await db.query(
            `SELECT pp.*, p.nombre as producto_nombre, p.precio_venta as precio_base
             FROM precios_producto pp
             INNER JOIN productos p ON pp.producto_id = p.id
             WHERE pp.producto_id = ? AND pp.activo = TRUE
             ORDER BY pp.cantidad_minima ASC`,
            [req.params.id]
        );

        // Obtener configuración del producto
        const [producto] = await db.query(
            `SELECT unidades_por_blister, blisters_por_caja, precio_venta
             FROM productos WHERE id = ?`,
            [req.params.id]
        );

        res.json({
            precios,
            configuracion: producto[0] || {}
        });
    } catch (error) {
        console.error('Error al obtener precios:', error);
        res.status(500).json({ error: 'Error al obtener precios del producto' });
    }
});

// @route   POST /api/precios
// @desc    Crear o actualizar precio de producto
// @access  Private
router.post('/', [
    body('producto_id').isInt().withMessage('ID de producto inválido'),
    body('tipo_venta').isIn(['Unidad', 'Blister', 'Caja', 'Mayorista']).withMessage('Tipo de venta inválido'),
    body('precio_venta').isFloat({ min: 0 }).withMessage('Precio debe ser mayor o igual a 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            producto_id,
            tipo_venta,
            cantidad_minima,
            cantidad_equivalente,
            precio_venta,
            porcentaje_descuento
        } = req.body;

        // Verificar que el producto existe
        const [productos] = await db.query(
            'SELECT id, precio_venta, unidades_por_blister, blisters_por_caja FROM productos WHERE id = ?',
            [producto_id]
        );

        if (productos.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = productos[0];

        // Calcular cantidad equivalente si no se proporciona
        let cantEquivalente = cantidad_equivalente;
        if (!cantEquivalente) {
            switch (tipo_venta) {
                case 'Unidad':
                    cantEquivalente = 1;
                    break;
                case 'Blister':
                    cantEquivalente = producto.unidades_por_blister || 10;
                    break;
                case 'Caja':
                    cantEquivalente = (producto.unidades_por_blister || 10) * (producto.blisters_por_caja || 10);
                    break;
                default:
                    cantEquivalente = cantidad_minima || 1;
            }
        }

        // Verificar si ya existe un precio para este tipo
        const [precioExistente] = await db.query(
            'SELECT id FROM precios_producto WHERE producto_id = ? AND tipo_venta = ?',
            [producto_id, tipo_venta]
        );

        if (precioExistente.length > 0) {
            // Actualizar
            await db.query(
                `UPDATE precios_producto 
                 SET cantidad_minima = ?, cantidad_equivalente = ?, precio_venta = ?, 
                     porcentaje_descuento = ?, activo = TRUE
                 WHERE id = ?`,
                [cantidad_minima || cantEquivalente, cantEquivalente, precio_venta,
                porcentaje_descuento || 0, precioExistente[0].id]
            );

            res.json({
                message: 'Precio actualizado exitosamente',
                id: precioExistente[0].id
            });
        } else {
            // Crear nuevo
            const [result] = await db.query(
                `INSERT INTO precios_producto 
                 (producto_id, tipo_venta, cantidad_minima, cantidad_equivalente, precio_venta, porcentaje_descuento)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [producto_id, tipo_venta, cantidad_minima || cantEquivalente, cantEquivalente,
                    precio_venta, porcentaje_descuento || 0]
            );

            res.status(201).json({
                message: 'Precio creado exitosamente',
                id: result.insertId
            });
        }
    } catch (error) {
        console.error('Error al guardar precio:', error);
        res.status(500).json({ error: 'Error al guardar precio' });
    }
});

// @route   POST /api/precios/calcular
// @desc    Calcular precio según cantidad y tipo de venta
// @access  Private
router.post('/calcular', [
    body('producto_id').isInt().withMessage('ID de producto inválido'),
    body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { producto_id, cantidad, tipo_venta } = req.body;

        // Obtener producto y sus precios
        const [productos] = await db.query(
            `SELECT p.*, 
                    (SELECT precio_venta FROM precios_producto 
                     WHERE producto_id = p.id AND tipo_venta = 'Unidad' AND activo = TRUE LIMIT 1) as precio_unidad,
                    (SELECT precio_venta FROM precios_producto 
                     WHERE producto_id = p.id AND tipo_venta = 'Blister' AND activo = TRUE LIMIT 1) as precio_blister,
                    (SELECT precio_venta FROM precios_producto 
                     WHERE producto_id = p.id AND tipo_venta = 'Caja' AND activo = TRUE LIMIT 1) as precio_caja,
                    (SELECT precio_venta FROM precios_producto 
                     WHERE producto_id = p.id AND tipo_venta = 'Mayorista' AND activo = TRUE LIMIT 1) as precio_mayorista
             FROM productos p
             WHERE p.id = ?`,
            [producto_id]
        );

        if (productos.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = productos[0];
        let precioFinal = 0;
        let tipoAplicado = tipo_venta || 'Unidad';
        let descuento = 0;

        // Determinar el mejor precio según cantidad
        if (tipo_venta) {
            // Tipo específico solicitado
            switch (tipo_venta) {
                case 'Unidad':
                    precioFinal = producto.precio_unidad || producto.precio_venta;
                    break;
                case 'Blister':
                    precioFinal = producto.precio_blister || (producto.precio_venta * producto.unidades_por_blister);
                    break;
                case 'Caja':
                    precioFinal = producto.precio_caja || (producto.precio_venta * producto.unidades_por_blister * producto.blisters_por_caja);
                    break;
                case 'Mayorista':
                    precioFinal = producto.precio_mayorista || producto.precio_venta;
                    break;
            }
        } else {
            // Auto-determinar mejor precio
            const unidadesTotales = cantidad;
            const precioBase = producto.precio_unidad || producto.precio_venta;

            // Verificar si conviene por caja
            if (producto.precio_caja &&
                unidadesTotales >= (producto.unidades_por_blister * producto.blisters_por_caja)) {
                const cajas = Math.floor(unidadesTotales / (producto.unidades_por_blister * producto.blisters_por_caja));
                const resto = unidadesTotales % (producto.unidades_por_blister * producto.blisters_por_caja);
                precioFinal = (producto.precio_caja * cajas) + (precioBase * resto);
                tipoAplicado = 'Caja';
            }
            // Verificar si conviene por blister
            else if (producto.precio_blister &&
                unidadesTotales >= producto.unidades_por_blister) {
                const blisters = Math.floor(unidadesTotales / producto.unidades_por_blister);
                const resto = unidadesTotales % producto.unidades_por_blister;
                precioFinal = (producto.precio_blister * blisters) + (precioBase * resto);
                tipoAplicado = 'Blister';
            }
            // Precio por unidad
            else {
                precioFinal = precioBase * cantidad;
                tipoAplicado = 'Unidad';
            }
        }

        // Calcular descuento aplicado
        const precioSinDescuento = (producto.precio_unidad || producto.precio_venta) * cantidad;
        descuento = precioSinDescuento - precioFinal;
        const porcentajeDescuento = precioSinDescuento > 0 ? ((descuento / precioSinDescuento) * 100).toFixed(2) : 0;

        res.json({
            producto_id,
            cantidad,
            tipo_venta_aplicado: tipoAplicado,
            precio_unitario: precioFinal / cantidad,
            precio_total: precioFinal,
            descuento_monto: descuento,
            descuento_porcentaje: porcentajeDescuento,
            ahorro: descuento > 0 ? `Ahorras S/. ${descuento.toFixed(2)}` : null
        });
    } catch (error) {
        console.error('Error al calcular precio:', error);
        res.status(500).json({ error: 'Error al calcular precio' });
    }
});

// @route   PUT /api/precios/:id
// @desc    Actualizar precio específico
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { precio_venta, porcentaje_descuento, activo } = req.body;

        const [result] = await db.query(
            `UPDATE precios_producto 
             SET precio_venta = ?, porcentaje_descuento = ?, activo = ?
             WHERE id = ?`,
            [precio_venta, porcentaje_descuento || 0, activo !== undefined ? activo : true, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Precio no encontrado' });
        }

        res.json({ message: 'Precio actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar precio:', error);
        res.status(500).json({ error: 'Error al actualizar precio' });
    }
});

// @route   DELETE /api/precios/:id
// @desc    Eliminar (desactivar) precio
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE precios_producto SET activo = FALSE WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Precio no encontrado' });
        }

        res.json({ message: 'Precio eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar precio:', error);
        res.status(500).json({ error: 'Error al eliminar precio' });
    }
});

// @route   POST /api/precios/generar-automatico/:producto_id
// @desc    Generar precios automáticamente basados en configuración
// @access  Private
router.post('/generar-automatico/:producto_id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { producto_id } = req.params;

        // Obtener configuración del producto
        const [productos] = await connection.query(
            `SELECT precio_venta, unidades_por_blister, blisters_por_caja
             FROM productos WHERE id = ?`,
            [producto_id]
        );

        if (productos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = productos[0];
        const precioBase = producto.precio_venta;

        // Limpiar precios existentes
        await connection.query(
            'DELETE FROM precios_producto WHERE producto_id = ?',
            [producto_id]
        );

        // Precio por Unidad (sin descuento)
        await connection.query(
            `INSERT INTO precios_producto 
             (producto_id, tipo_venta, cantidad_minima, cantidad_equivalente, precio_venta, porcentaje_descuento)
             VALUES (?, 'Unidad', 1, 1, ?, 0)`,
            [producto_id, precioBase]
        );

        // Precio por Blister (10% descuento)
        if (producto.unidades_por_blister > 0) {
            const precioBlister = (precioBase * producto.unidades_por_blister * 0.90).toFixed(2);
            await connection.query(
                `INSERT INTO precios_producto 
                 (producto_id, tipo_venta, cantidad_minima, cantidad_equivalente, precio_venta, porcentaje_descuento)
                 VALUES (?, 'Blister', ?, ?, ?, 10.00)`,
                [producto_id, producto.unidades_por_blister, producto.unidades_por_blister, precioBlister]
            );
        }

        // Precio por Caja (20% descuento)
        if (producto.unidades_por_blister > 0 && producto.blisters_por_caja > 0) {
            const unidadesPorCaja = producto.unidades_por_blister * producto.blisters_por_caja;
            const precioCaja = (precioBase * unidadesPorCaja * 0.80).toFixed(2);
            await connection.query(
                `INSERT INTO precios_producto 
                 (producto_id, tipo_venta, cantidad_minima, cantidad_equivalente, precio_venta, porcentaje_descuento)
                 VALUES (?, 'Caja', ?, ?, ?, 20.00)`,
                [producto_id, unidadesPorCaja, unidadesPorCaja, precioCaja]
            );
        }

        await connection.commit();
        res.json({
            message: 'Precios generados automáticamente',
            precios_creados: 1 + (producto.unidades_por_blister > 0 ? 1 : 0) +
                (producto.unidades_por_blister > 0 && producto.blisters_por_caja > 0 ? 1 : 0)
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al generar precios:', error);
        res.status(500).json({ error: 'Error al generar precios automáticamente' });
    } finally {
        connection.release();
    }
});

module.exports = router;
