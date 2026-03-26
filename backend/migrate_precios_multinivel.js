const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración: Sistema de Precios Multinivel...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'botica_duran',
        multipleStatements: true
    });

    try {
        // Leer el archivo de migración
        const migrationPath = path.join(__dirname, 'database', 'migrations', '001_precios_multinivel.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        console.log('📝 Ejecutando migración SQL...');

        // Ejecutar la migración
        await connection.query(migrationSQL);

        console.log('✅ Migración completada exitosamente!\n');

        // Generar precios para productos existentes
        console.log('� Generando precios multinivel para productos existentes...');

        const [productos] = await connection.query(
            'SELECT id, precio_venta, unidades_por_blister, blisters_por_caja FROM productos WHERE activo = TRUE'
        );

        let preciosCreados = 0;
        for (const producto of productos) {
            const precioUnidad = producto.precio_venta;
            const unidadesBlister = producto.unidades_por_blister || 10;
            const blistersCaja = producto.blisters_por_caja || 10;

            // Verificar si ya existen precios
            const [preciosExistentes] = await connection.query(
                'SELECT COUNT(*) as count FROM precios_producto WHERE producto_id = ?',
                [producto.id]
            );

            if (preciosExistentes[0].count === 0) {
                const precioBlister = (precioUnidad * unidadesBlister * 0.90).toFixed(2);
                const precioCaja = (precioUnidad * unidadesBlister * blistersCaja * 0.80).toFixed(2);

                await connection.query(
                    `INSERT INTO precios_producto (producto_id, tipo_venta, cantidad_minima, cantidad_equivalente, precio_venta, porcentaje_descuento)
                     VALUES 
                     (?, 'Unidad', 1, 1, ?, 0),
                     (?, 'Blister', ?, ?, ?, 10.00),
                     (?, 'Caja', ?, ?, ?, 20.00)`,
                    [
                        producto.id, precioUnidad,
                        producto.id, unidadesBlister, unidadesBlister, precioBlister,
                        producto.id, unidadesBlister * blistersCaja, unidadesBlister * blistersCaja, precioCaja
                    ]
                );
                preciosCreados += 3;
            }
        }

        console.log(`✅ Se crearon ${preciosCreados} precios nuevos!\n`);
        console.log('📊 Cambios realizados:');
        console.log('   ✓ Agregados campos de configuración a productos');
        console.log('   ✓ Creada tabla precios_producto');
        console.log('   ✓ Creada tabla descuentos_volumen');
        console.log('   ✓ Agregado campo tipo_venta a detalle_ventas');
        console.log('   ✓ Generados precios por defecto para productos existentes');
        console.log('   ✓ Asignados códigos internos a productos existentes\n');

        // Verificar resultados
        const [productosCount] = await connection.query('SELECT COUNT(*) as total FROM productos');
        const [preciosCount] = await connection.query('SELECT COUNT(*) as total FROM precios_producto');

        console.log(`📦 Productos en sistema: ${productosCount[0].total}`);
        console.log(`💰 Precios multinivel creados: ${preciosCount[0].total}\n`);

        console.log('🎉 ¡Sistema de Precios Multinivel listo para usar!');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);

        if (error.message.includes('Duplicate column') || error.message.includes('already exists')) {
            console.log('\n⚠️  Algunos cambios ya fueron aplicados anteriormente.');
            console.log('   Intentando completar el proceso...\n');

            // Intentar solo generar precios
            try {
                console.log('💰 Generando precios para productos sin precios...');
                const [productos] = await connection.query(
                    'SELECT id, precio_venta, unidades_por_blister, blisters_por_caja FROM productos WHERE activo = TRUE'
                );

                let preciosCreados = 0;
                for (const producto of productos) {
                    const [preciosExistentes] = await connection.query(
                        'SELECT COUNT(*) as count FROM precios_producto WHERE producto_id = ?',
                        [producto.id]
                    );

                    if (preciosExistentes[0].count === 0) {
                        const precioUnidad = producto.precio_venta;
                        const unidadesBlister = producto.unidades_por_blister || 10;
                        const blistersCaja = producto.blisters_por_caja || 10;
                        const precioBlister = (precioUnidad * unidadesBlister * 0.90).toFixed(2);
                        const precioCaja = (precioUnidad * unidadesBlister * blistersCaja * 0.80).toFixed(2);

                        await connection.query(
                            `INSERT INTO precios_producto (producto_id, tipo_venta, cantidad_minima, cantidad_equivalente, precio_venta, porcentaje_descuento)
                             VALUES 
                             (?, 'Unidad', 1, 1, ?, 0),
                             (?, 'Blister', ?, ?, ?, 10.00),
                             (?, 'Caja', ?, ?, ?, 20.00)`,
                            [
                                producto.id, precioUnidad,
                                producto.id, unidadesBlister, unidadesBlister, precioBlister,
                                producto.id, unidadesBlister * blistersCaja, unidadesBlister * blistersCaja, precioCaja
                            ]
                        );
                        preciosCreados += 3;
                    }
                }

                console.log(`✅ Se crearon ${preciosCreados} precios nuevos`);

                const [preciosCount] = await connection.query('SELECT COUNT(*) as total FROM precios_producto');
                console.log(`💰 Total precios en sistema: ${preciosCount[0].total}\n`);
                console.log('🎉 ¡Proceso completado!');
            } catch (innerError) {
                console.error('   Error al generar precios:', innerError.message);
            }
        } else {
            process.exit(1);
        }
    } finally {
        await connection.end();
    }
}

// Ejecutar migración
runMigration().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
