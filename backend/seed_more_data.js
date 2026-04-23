const db = require('./config/database');

async function seed() {
    try {
        console.log('--- Iniciando siembra de datos adicionales ---');

        // 1. Agregar nuevas categorías si no existen
        const nuevasCategorias = [
            ['Antigripales y Tos', 'Medicamentos para resfriados, gripe y tos'],
            ['Digestivos y Antácidos', 'Tratamiento para estómago y digestión'],
            ['Dermatológicos', 'Cuidado de la piel y afecciones cutáneas'],
            ['Oftalmológicos', 'Gotas y cuidado ocular'],
            ['Inyectables y Sueros', 'Medicamentos de administración parenteral'],
            ['Material Médico', 'Insumos de primeros auxilios y curación'],
            ['Salud Bucal', 'Higiene y tratamiento bucal'],
            ['Salud Sexual', 'Preservativos y anticonceptivos']
        ];

        for (const [nombre, descripcion] of nuevasCategorias) {
            const [existe] = await db.query('SELECT id FROM categorias WHERE nombre = ?', [nombre]);
            if (existe.length === 0) {
                await db.query('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
                console.log(`Categoría añadida: ${nombre}`);
            }
        }

        // Obtener IDs Actualizados
        const [cats] = await db.query('SELECT id, nombre FROM categorias');
        const getCatId = (name) => cats.find(c => c.nombre === name)?.id || 6; // Default a 'Otros'

        // 2. Agregar productos reales
        const nuevosProductos = [
            // [Nombre, Descripcion, Categoria, Laboratorio, Precio Compra, Precio Venta]
            ['Panadol Forte 500mg', 'Paracetamol para dolor fuerte y fiebre', 'Analgésicos', 'GSK', 0.20, 0.50],
            ['Amoxicilina 500mg', 'Antibiótico de amplio espectro', 'Antibióticos', 'Genfar', 0.50, 1.20],
            ['Apronax 550mg', 'Antiinflamatorio y analgésico potente', 'Antiinflamatorios', 'Bayer', 1.00, 2.50],
            ['Bismutol Suspensión 150ml', 'Antácido y protector estomacal', 'Digestivos y Antácidos', 'Medifarma', 8.50, 15.00],
            ['Tapsin Antigripal Día/Noche', 'Tratamiento completo para la gripe', 'Antigripales y Tos', 'Mavenne', 1.20, 3.00],
            ['Dexametasona 4mg/2ml Ampolla', 'Corticoide inyectable', 'Inyectables y Sueros', 'Genfar', 2.00, 5.00],
            ['Diclofenaco Sódico 75mg Ampolla', 'Analgésico inyectable', 'Inyectables y Sueros', 'Portugal', 1.50, 4.00],
            ['Alcohol 70% Portugal 1 Litro', 'Desinfectante de manos y superficies', 'Material Médico', 'Portugal', 6.00, 10.00],
            ['Gasa Estéril 10cm x 10cm', 'Para limpieza de heridas', 'Material Médico', 'Galeno', 0.30, 0.80],
            ['Redoxon Vitamina C 1g efervescente', 'Suplemento de vitamina C', 'Vitaminas', 'Bayer', 15.00, 25.00],
            ['Nastizol Jarabe 60ml', 'Antigripal infantil', 'Cuidado Infantil', 'Bago', 12.00, 20.00],
            ['Vick VapoRub 50g', 'Ungüento tópico para congestión', 'Antigripales y Tos', 'P&G', 7.00, 12.00],
            ['Povidona Yodada 120ml', 'Antiséptico para heridas', 'Material Médico', 'Medifarma', 5.50, 10.00],
            ['Dolocordralan Extra Fuerte', 'Relajante muscular y analgésico', 'Analgésicos', 'Hersil', 0.80, 2.00],
            ['Mucosolvan Jarabe Adulto', 'Expectorante para tos con flema', 'Antigripales y Tos', 'Sanofi', 18.00, 30.00],
            ['Enterogermina 5ml vial', 'Probiótico para flora intestinal', 'Digestivos y Antácidos', 'Sanofi', 3.50, 7.00],
            ['Sal de Andrews', 'Antiácido efervescente', 'Digestivos y Antácidos', 'GSK', 0.40, 1.00],
            ['Kolynos Triple Acción 90g', 'Crema dental', 'Salud Bucal', 'Colgate', 3.00, 5.50],
            ['Durex Clásico x3', 'Preservativos', 'Salud Sexual', 'Reckitt', 5.00, 12.00],
            ['Lansoprazol 30mg', 'Protector gástrico', 'Digestivos y Antácidos', 'Genfar', 0.60, 1.50]
        ];

        for (const [nombre, desc, catName, lab, pComp, pVent] of nuevosProductos) {
            const [existe] = await db.query('SELECT id FROM productos WHERE nombre = ?', [nombre]);
            if (existe.length === 0) {
                const catId = getCatId(catName);
                
                // Generar código interno (estilo PROD-XXXXX)
                const [ultimoId] = await db.query('SELECT MAX(id) as max_id FROM productos');
                const nextId = (ultimoId[0].max_id || 0) + 1;
                const codInterno = `PROD-${String(nextId).padStart(5, '0')}`;

                await db.query(`
                    INSERT INTO productos 
                    (nombre, descripcion, categoria_id, laboratorio, precio_compra, precio_venta, stock_actual, stock_minimo, codigo_interno) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [nombre, desc, catId, lab, pComp, pVent, 20, 5, codInterno]);
                
                console.log(`Producto añadido: ${nombre} (${lab})`);
            }
        }

        console.log('--- Siembra completada exitosamente ---');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la siembra:', error);
        process.exit(1);
    }
}

seed();
