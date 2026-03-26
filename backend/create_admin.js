require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function reescribirAdmin() {
    try {
        console.log('🔄 Encriptando temporalmente la nueva contraseña de forma segura...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        console.log('🛠️ Buscando a "admin" y actualizando con la clave nueva...');
        const [result] = await db.query(
            'UPDATE usuarios SET password = ?, activo = TRUE, ultimo_acceso = NOW() WHERE usuario = "admin"',
            [hashedPassword]
        );
        
        if (result.affectedRows === 0) {
            console.log('⚠️ El usuario "admin" no existía. Creándolo desde cero...');
            await db.query(
                'INSERT INTO usuarios (nombre, usuario, password, rol, activo, ultimo_acceso) VALUES (?, ?, ?, ?, TRUE, NOW())',
                ['Administrador Principal', 'admin', hashedPassword, 'admin']
            );
        }
        
        console.log('🎉 Usuario admin reseteado con éxito. ¡Inicia sesión con: admin / admin123 !');
    } catch (error) {
        console.error('❌ Hubo un error al actualizar el admin:', error.message);
    } finally {
        process.exit();
    }
}

reescribirAdmin();
