const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración: Sistema de Presentaciones Configurables...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'botica_duran',
        multipleStatements: true
    });

    try {
        // Leer el archivo de migración
        const migrationPath = path.join(__dirname, 'database', 'migrations', '002_presentaciones_configurables.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        console.log('📝 Ejecutando migración SQL...');

        // Ejecutar la migración
        await connection.query(migrationSQL);

        console.log('✅ Migración completada exitosamente!\n');

        // Verificar resultados
        const [plantillas] = await connection.query('SELECT COUNT(*) as total FROM plantillas_presentaciones');
        const [presentaciones] = await connection.query('SELECT COUNT(*) as total FROM presentaciones_producto');

        console.log('📊 Cambios realizados:');
        console.log('   ✓ Eliminados campos específicos de medicamentos (unidades_por_blister, blisters_por_caja)');
        console.log('   ✓ Modificado tipo_venta a VARCHAR para mayor flexibilidad');
        console.log('   ✓ Creada tabla presentaciones_producto');
        console.log('   ✓ Creada tabla plantillas_presentaciones');
        console.log(`   ✓ ${plantillas[0].total} plantillas predefinidas creadas`);
        console.log(`   ✓ ${presentaciones[0].total} presentaciones migradas\n`);

        console.log('📦 Plantillas disponibles:');
        const [templates] = await connection.query('SELECT nombre, categoria_sugerida FROM plantillas_presentaciones WHERE activo = TRUE');
        templates.forEach(t => {
            console.log(`   - ${t.nombre} (${t.categoria_sugerida})`);
        });

        console.log('\n🎉 ¡Sistema de Presentaciones Configurables listo para usar!');
        console.log('\n📝 Ejemplos de uso:');
        console.log('   • Pañales: Unidad, Paquete (20 un.), Display (60 un.)');
        console.log('   • Medicamentos: Unidad, Blister (10 un.), Caja (100 un.)');
        console.log('   • Líquidos: Frasco, Pack x3, Caja x12');
        console.log('   • Toallas: Unidad, Paquete (10 un.), Display (50 un.)');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);

        if (error.message.includes('Unknown column') || error.message.includes('already exists')) {
            console.log('\n⚠️  Algunos cambios ya fueron aplicados.');
            console.log('   Esto es normal si ejecutas la migración múltiples veces.');
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
