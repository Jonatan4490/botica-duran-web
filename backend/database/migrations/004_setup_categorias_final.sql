-- 1. Normalizar categorías existentes
UPDATE categorias SET nombre = 'Antidiarreicos' WHERE nombre = 'ANTIDIARREICOS';

-- 2. Crear nuevas categorías profesionales
INSERT INTO categorias (nombre, descripcion)
SELECT * FROM (
    SELECT 'Antigripales y Tos', 'Medicamentos para resfriado, gripe y diversos tipos de tos' UNION ALL
    SELECT 'Dermatológicos', 'Cremas, ungüentos y tratamientos para la piel' UNION ALL
    SELECT 'Oftalmológicos / Otológicos', 'Gotas y tratamientos para ojos y oídos' UNION ALL
    SELECT 'Material Médico y Curación', 'Alcohol, gasas, algodón, jeringas y primeros auxilios' UNION ALL
    SELECT 'Salud Bucal', 'Cuidado de dientes y encías, pastas y cepillos' UNION ALL
    SELECT 'Salud Sexual y Planificación', 'Preservativos, anticonceptivos y pruebas de embarazo' UNION ALL
    SELECT 'Inyectables y Sueros', 'Medicamentos de administración parenteral y sueros de hidratación'
) AS tmp
WHERE NOT EXISTS (
    SELECT nombre FROM categorias WHERE nombre = tmp.column1
) LIMIT 7;

-- 3. (Opcional) Si deseas renombrar Jarabes a algo más específico, descomenta la siguiente línea:
-- UPDATE categorias SET nombre = 'Jarabes y Suspensiones' WHERE nombre = 'Jarabes';
