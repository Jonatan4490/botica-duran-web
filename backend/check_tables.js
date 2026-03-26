const db = require('./config/database');

async function fixTables() {
    try {
        console.log('Comprobando tabla precios_producto...');
        await db.query('SELECT 1 FROM precios_producto LIMIT 1');
        console.log('✅ precios_producto ya existe');
    } catch(e) {
        console.log('❌ precios_producto NO EXISTE. Creando...');
        await db.query(`CREATE TABLE precios_producto (
            id INT PRIMARY KEY AUTO_INCREMENT,
            producto_id INT,
            tipo_venta VARCHAR(50) NOT NULL,
            precio_venta DECIMAL(10,2) NOT NULL,
            unidades_equivalentes INT DEFAULT 1,
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        )`);
        console.log('✅ precios_producto CREADA exitosamente');
    }

    try {
        console.log('Comprobando tabla movimientos_inventario...');
        await db.query('SELECT 1 FROM movimientos_inventario LIMIT 1');
        console.log('✅ movimientos_inventario ya existe');
    } catch(e) {
        console.log('❌ movimientos_inventario NO EXISTE. Creando...');
        await db.query(`CREATE TABLE movimientos_inventario (
            id INT PRIMARY KEY AUTO_INCREMENT,
            producto_id INT,
            tipo VARCHAR(50) NOT NULL,
            cantidad INT NOT NULL,
            motivo VARCHAR(255),
            usuario_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )`);
        console.log('✅ movimientos_inventario CREADA exitosamente');
    }
    
    process.exit();
}

fixTables();
