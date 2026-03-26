const pool = require('./config/database');

const migrate = async () => {
    try {
        console.log('Iniciando migración de unidades...');

        // 1. Modificar tabla productos
        await pool.query(`
            ALTER TABLE productos 
            ADD COLUMN unidades_por_blister INT DEFAULT 1,
            ADD COLUMN unidades_por_caja INT DEFAULT 1,
            ADD COLUMN precio_venta_blister DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN precio_venta_caja DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN precio_compra_blister DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN precio_compra_caja DECIMAL(10, 2) DEFAULT 0
        `);
        console.log('✅ Tabla productos actualizada');

        // 2. Modificar detalle_ventas
        await pool.query(`
            ALTER TABLE detalle_ventas 
            ADD COLUMN tipo_unidad ENUM('Unidad', 'Blister', 'Caja') DEFAULT 'Unidad'
        `);
        console.log('✅ Tabla detalle_ventas actualizada');

        // 3. Modificar detalle_compras
        await pool.query(`
            ALTER TABLE detalle_compras 
            ADD COLUMN tipo_unidad ENUM('Unidad', 'Blister', 'Caja') DEFAULT 'Unidad'
        `);
        console.log('✅ Tabla detalle_compras actualizada');

        console.log('✨ Migración completada con éxito');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        process.exit(1);
    }
};

migrate();
