require('dotenv').config();
const db = require('./config/database');

async function fixDB() {
    try {
        console.log('Agregando columna ultimo_acceso a la tabla usuarios...');
        await db.query('ALTER TABLE usuarios ADD COLUMN ultimo_acceso DATETIME NULL');
        console.log('✅ Columna agregada correctamente.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna ya existe, no se requieren cambios.');
        } else {
            console.error('❌ Error actualizando base de datos:', error.message);
        }
    } finally {
        process.exit();
    }
}

fixDB();
