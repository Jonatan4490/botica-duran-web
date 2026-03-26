require('dotenv').config();
const db = require('./config/database');

async function fixColumn() {
    const columnas = [
        "ALTER TABLE productos ADD COLUMN requiere_receta BOOLEAN DEFAULT false",
        "ALTER TABLE productos ADD COLUMN unidades_por_blister INT DEFAULT 10",
        "ALTER TABLE productos ADD COLUMN blisters_por_caja INT DEFAULT 10",
        "ALTER TABLE productos ADD COLUMN codigo_interno VARCHAR(50) NULL",
        "ALTER TABLE productos ADD COLUMN laboratorio VARCHAR(100) NULL",
        "ALTER TABLE productos ADD COLUMN ubicacion VARCHAR(100) NULL",
        "ALTER TABLE productos ADD COLUMN unidad_medida VARCHAR(50) DEFAULT 'Unidad'",
        "ALTER TABLE productos ADD COLUMN codigo_barras VARCHAR(100) NULL"
    ];

    for (let c of columnas) {
        try {
            await db.query(c);
            console.log("Exito:", c);
        } catch(e) {
            // Ignorar los que ya existan o reboten
        }
    }
    
    console.log("✅ Columnas nuevas parcheadas");
    process.exit();
}
fixColumn();
