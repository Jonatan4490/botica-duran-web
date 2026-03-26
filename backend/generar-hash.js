// Script para generar hash de contraseña
const bcrypt = require('bcryptjs');

async function generarHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    console.log('='.repeat(60));
    console.log('HASH GENERADO PARA LA CONTRASEÑA: admin123');
    console.log('='.repeat(60));
    console.log(hash);
    console.log('='.repeat(60));
    console.log('\nCopia este hash y úsalo en el schema.sql');
}

generarHash();
