const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// @route   GET /api/presentaciones/producto/:producto_id
// @desc    Obtener todas las presentaciones de un producto
// @access  Private
router.get('/producto/:producto_id', async (req, res) => {
    try {
        const [presentaciones] = await db.query(
            `SELECT * FROM presentaciones_producto 
             WHERE producto_id = ? AND activo = TRUE
             ORDER BY orden ASC, unidades_equivalentes ASC`,
            [req.params.producto_id]
        );

        res.json(presentaciones);
    } catch (error) {
        console.error('Error al obtener presentaciones:', error);
        res.status(500).json({ error: 'Error al obtener presentaciones' });
    }
});

// @route   GET /api/presentaciones/plantillas
// @desc    Obtener plantillas de presentaciones predefinidas
// @access  Private
router.get('/plantillas', async (req, res) => {
    try {
        const [plantillas] = await db.query(
            'SELECT * FROM plantillas_presentaciones WHERE activo = TRUE ORDER BY nombre ASC'
        );

        // Parsear el JSON de presentaciones
        const plantillasConPresentaciones = plantillas.map(p => ({
            ...p,
            presentaciones: JSON.parse(p.presentaciones)
        }));

        res.json(plantillasConPresentaciones);
    } catch (error) {
        console.error('Error al obtener plantillas:', error);
        res.status(500).json({ error: 'Error al obtener plantillas' });
    }
});

// @route   POST /api/presentaciones
// @desc    Crear o actualizar presentación de un producto
// @access  Private
router.post('/', [
    body('producto_id').isInt().withMessage('producto_id es requerido'),
    body('nombre').notEmpty().withMessage('El nombre de la presentación es requerido'),
    body('unidades_equivalentes').isInt({ min: 1 }).withMessage('unidades_equivalentes debe ser mayor a 0'),
    body('precio_venta').isFloat({ min: 0 }).withMessage('precio_venta debe ser mayor o igual a 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id, producto_id, nombre, unidades_equivalentes, precio_venta, orden } = req.body;

        // Obtener el precio por unidad del producto
        const [producto] = await db.query('SELECT precio_venta FROM productos WHERE id = ?', [producto_id]);

        if (producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const precioUnidad = producto[0].precio_venta;

        // Calcular porcentaje de descuento
        const precioSinDescuento = precioUnidad * unidades_equivalentes;
        const porcentajeDescuento = precioSinDescuento > 0
            ? (((precioSinDescuento - precio_venta) / precioSinDescuento) * 100).toFixed(2)
            : 0;

        // Verificar si existe (por ID o por Nombre en el mismo producto)
        let existeId = id;
        
        if (!existeId) {
            const [existe] = await db.query(
                'SELECT id FROM presentaciones_producto WHERE producto_id = ? AND nombre = ? AND activo = TRUE',
                [producto_id, nombre]
            );
            if (existe.length > 0) {
                existeId = existe[0].id;
            }
        }

        if (existeId) {
            // Actualizar existente
            await db.query(
                `UPDATE presentaciones_producto 
                 SET nombre = ?, unidades_equivalentes = ?, precio_venta = ?, porcentaje_descuento = ?, orden = ?, activo = TRUE
                 WHERE id = ?`,
                [nombre, unidades_equivalentes, precio_venta, porcentajeDescuento, orden || 0, existeId]
            );

            res.json({
                message: 'Presentación actualizada exitosamente',
                id: existeId
            });
        } else {
            // Crear nueva
            const [result] = await db.query(
                `INSERT INTO presentaciones_producto 
                 (producto_id, nombre, unidades_equivalentes, precio_venta, porcentaje_descuento, orden)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [producto_id, nombre, unidades_equivalentes, precio_venta, porcentajeDescuento, orden || 0]
            );

            res.status(201).json({
                message: 'Presentación creada exitosamente',
                id: result.insertId
            });
        }
    } catch (error) {
        console.error('Error al crear/actualizar presentación:', error);
        res.status(500).json({ error: 'Error al procesar presentación' });
    }
});

// @route   POST /api/presentaciones/aplicar-plantilla
// @desc    Aplicar una plantilla de presentaciones a un producto
// @access  Private
router.post('/aplicar-plantilla', [
    body('producto_id').isInt().withMessage('producto_id es requerido'),
    body('plantilla_id').isInt().withMessage('plantilla_id es requerido'),
    body('precio_base').optional().isFloat({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { producto_id, plantilla_id, precio_base, descuentos } = req.body;

        // Obtener producto
        const [producto] = await db.query('SELECT precio_venta FROM productos WHERE id = ?', [producto_id]);

        if (producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const precioUnidad = precio_base || producto[0].precio_venta;

        // Obtener plantilla
        const [plantilla] = await db.query(
            'SELECT presentaciones FROM plantillas_presentaciones WHERE id = ?',
            [plantilla_id]
        );

        if (plantilla.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }

        const presentaciones = JSON.parse(plantilla[0].presentaciones);

        // Eliminar presentaciones existentes del producto
        await db.query('DELETE FROM presentaciones_producto WHERE producto_id = ?', [producto_id]);

        // Crear nuevas presentaciones
        let orden = 1;
        for (const pres of presentaciones) {
            // Calcular precio con descuento personalizado o por defecto
            const descuentoPorcentaje = descuentos && descuentos[pres.nombre] !== undefined
                ? descuentos[pres.nombre]
                : (pres.unidades * 10 <= 100 ? pres.unidades * 10 / 10 : 20); // Descuento progresivo

            const precioSinDescuento = precioUnidad * pres.unidades;
            const precio_venta = (precioSinDescuento * (1 - descuentoPorcentaje / 100)).toFixed(2);

            await db.query(
                `INSERT INTO presentaciones_producto 
                 (producto_id, nombre, unidades_equivalentes, precio_venta, porcentaje_descuento, orden)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [producto_id, pres.nombre, pres.unidades, precio_venta, descuentoPorcentaje, orden]
            );

            orden++;
        }

        res.json({
            message: 'Plantilla aplicada exitosamente',
            presentaciones_creadas: presentaciones.length
        });
    } catch (error) {
        console.error('Error al aplicar plantilla:', error);
        res.status(500).json({ error: 'Error al aplicar plantilla' });
    }
});

// @route   DELETE /api/presentaciones/:id
// @desc    Eliminar una presentación
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        await db.query(
            'UPDATE presentaciones_producto SET activo = FALSE WHERE id = ?',
            [req.params.id]
        );

        res.json({ message: 'Presentación eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar presentación:', error);
        res.status(500).json({ error: 'Error al eliminar presentación' });
    }
});

module.exports = router;
