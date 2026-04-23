-- 1. Agregar nuevas categorías
INSERT INTO categorias (nombre, descripcion) VALUES 
('Antigripales y Tos', 'Medicamentos para resfriados, gripe y tos'),
('Digestivos y Antácidos', 'Tratamiento para estómago y digestión'),
('Dermatológicos', 'Cuidado de la piel y afecciones cutáneas'),
('Oftalmológicos', 'Gotas y cuidado ocular'),
('Inyectables y Sueros', 'Medicamentos de administración parenteral'),
('Material Médico', 'Insumos de primeros auxilios y curación'),
('Salud Bucal', 'Higiene y tratamiento bucal'),
('Salud Sexual', 'Preservativos y anticonceptivos'),
('Nutrición y Suplementos', 'Vitaminas y complementos alimenticios');

-- 2. Agregar productos reales de marcas y laboratorios variados
-- Nota: Los IDs de categoría pueden variar dependiendo de la base de datos, 
-- aquí se usan IDs estimados basados en el orden de inserción anterior (9 a 17)

INSERT INTO productos (nombre, descripcion, categoria_id, laboratorio, precio_compra, precio_venta, stock_actual, stock_minimo, codigo_interno) VALUES
('Panadol Forte 500mg', 'Paracetamol para dolor fuerte y fiebre', 1, 'GSK', 0.20, 0.50, 50, 10, 'PROD-R0001'),
('Amoxicilina 500mg', 'Antibiótico de amplio espectro', 2, 'Genfar', 0.50, 1.20, 100, 20, 'PROD-R0002'),
('Apronax 550mg', 'Antiinflamatorio y analgésico potente', 3, 'Bayer', 1.20, 3.00, 60, 15, 'PROD-R0003'),
('Bismutol Suspensión 150ml', 'Antácido y protector estomacal', 10, 'Medifarma', 9.00, 16.00, 20, 5, 'PROD-R0004'),
('Tapsin Antigripal Día/Noche', 'Tratamiento completo para la gripe', 9, 'Mavenne', 1.00, 2.50, 80, 20, 'PROD-R0005'),
('Dexametasona 4mg/2ml Ampolla', 'Corticoide inyectable', 13, 'Genfar', 2.00, 5.00, 30, 10, 'PROD-R0006'),
('Diclofenaco Sódico 75mg Ampolla', 'Analgésico inyectable', 13, 'Portugal', 1.50, 4.00, 30, 10, 'PROD-R0007'),
('Alcohol 70% Portugal 1 Litro', 'Desinfectante de manos y superficies', 14, 'Portugal', 6.50, 12.00, 40, 10, 'PROD-R0008'),
('Redoxon Vitamina C 1g efervescente', 'Suplemento de vitamina C', 4, 'Bayer', 18.00, 30.00, 25, 5, 'PROD-R0009'),
('Nastizol Jarabe 60ml', 'Antigripal infantil', 8, 'Bago', 14.00, 22.00, 15, 5, 'PROD-R0010'),
('Vick VapoRub 50g', 'Ungüento tópico para congestión', 9, 'P&G', 8.00, 14.00, 30, 10, 'PROD-R0011'),
('Enterogermina 5ml vial', 'Probiótico para flora intestinal', 10, 'Sanofi', 4.00, 8.00, 50, 10, 'PROD-R0012'),
('Sal de Andrews x50 sobres', 'Antiácido efervescente', 10, 'GSK', 0.50, 1.20, 100, 20, 'PROD-R0013'),
('Kolynos Triple Acción 90g', 'Crema dental', 15, 'Colgate', 3.50, 6.00, 40, 10, 'PROD-R0014'),
('Durex Clásico x3', 'Preservativos', 16, 'Reckitt', 6.00, 15.00, 20, 5, 'PROD-R0015'),
('Lansoprazol 30mg', 'Protector gástrico', 10, 'Genfar', 0.70, 1.80, 60, 15, 'PROD-R0016'),
('Ibuprofeno 400mg', 'Analgésico y antiinflamatorio', 3, 'Genfar', 0.30, 0.80, 200, 30, 'PROD-R0017'),
('Betametasona Crema 0.05%', 'Para dermatitis y alergias', 11, 'Portugal', 5.00, 10.00, 25, 5, 'PROD-R0018'),
('Visina Gotas 15ml', 'Lubricante ocular', 12, 'Pfizer', 12.00, 20.00, 15, 3, 'PROD-R0019'),
('Algodón Hidrófilo 100g', 'Para uso médico', 14, 'Galeno', 3.00, 5.50, 40, 10, 'PROD-R0020');
