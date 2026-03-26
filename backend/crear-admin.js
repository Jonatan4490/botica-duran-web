// Script para crear usuario admin con contraseña correcta
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function crearAdmin() {
    try {
        // Conectar a la base de datos
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'botica_duran'
        });

        console.log('✅ Conectado a MySQL');

        // Generar hash de la contraseña
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('\n📝 Generando hash de contraseña...');
        console.log('Contraseña:', password);
        console.log('Hash:', hashedPassword);

        // Eliminar usuario admin existente
        await connection.query('DELETE FROM usuarios WHERE usuario = ?', ['admin']);
        console.log('\n🗑️  Usuario admin anterior eliminado (si existía)');

        // Insertar nuevo usuario admin
        await connection.query(
            'INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)',
            ['Administrador', 'admin', hashedPassword, 'admin']
        );

        console.log('\n✅ Usuario admin creado correctamente');
        console.log('\n📋 Credenciales:');
        console.log('   Usuario: admin');
        console.log('   Contraseña: admin123');

        // Verificar
        const [users] = await connection.query(
            'SELECT id, nombre, usuario, rol FROM usuarios WHERE usuario = ?',
            ['admin']
        );

        console.log('\n✅ Verificación:');
        console.log(users[0]);

        await connection.end();
        console.log('\n✅ ¡Todo listo! Ahora puedes iniciar sesión.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

crearAdmin();
