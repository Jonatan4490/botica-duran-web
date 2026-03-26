import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiPackage, FiPlus, FiEdit, FiAlertCircle, FiX, FiSave, FiTrash2, FiSettings, FiShoppingBag, FiLayers, FiSliders } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Productos = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Ajuste de Stock
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockForm, setStockForm] = useState({ cantidad: '', motivo: '', tipo: 'Entrada' });
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Estado para presentaciones dinámicas
    const [plantillas, setPlantillas] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria_id: '',
        unidad_medida: 'Unidad',
        precio_compra: '',
        precio_venta: '',
        stock_actual: '',
        stock_minimo: 5,
        requiere_receta: false,
        codigo_barras: '',
        laboratorio: '',
        ubicacion: ''
    });

    useEffect(() => {
        fetchData();
        fetchPlantillas();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                api.get('/productos?activo=true'),
                api.get('/categorias?activo=true')
            ]);
            setProductos(prodRes.data);
            setCategorias(catRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlantillas = async () => {
        try {
            const res = await api.get('/presentaciones/plantillas');
            setPlantillas(res.data);
        } catch (error) {
            console.error('Error cargando plantillas', error);
        }
    };

    const fetchPresentacionesProducto = async (productoId) => {
        try {
            const res = await api.get(`/presentaciones/producto/${productoId}`);
            // Convertir al formato del estado local
            const presentations = res.data.map(p => ({
                id: p.id,
                nombre: p.nombre,
                unidades: p.unidades_equivalentes,
                precio: p.precio_venta,
                descuento: p.porcentaje_descuento
            }));
            setPresentaciones(presentations);
        } catch (error) {
            console.error('Error cargando presentaciones', error);
            setPresentaciones([]);
        }
    };

    const handleOpenModal = async (producto = null) => {
        if (producto) {
            setEditingProduct(producto);
            setFormData({
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                categoria_id: producto.categoria_id || '',
                unidad_medida: producto.unidad_medida,
                precio_compra: producto.precio_compra,
                precio_venta: producto.precio_venta,
                stock_actual: producto.stock_actual,
                stock_minimo: producto.stock_minimo,
                requiere_receta: !!producto.requiere_receta,
                codigo_barras: producto.codigo_barras || '',
                laboratorio: producto.laboratorio || '',
                ubicacion: producto.ubicacion || ''
            });
            // Cargar presentaciones existentes
            await fetchPresentacionesProducto(producto.id);
        } else {
            setEditingProduct(null);
            setFormData({
                nombre: '',
                descripcion: '',
                categoria_id: '',
                unidad_medida: 'Unidad',
                precio_compra: '',
                precio_venta: '',
                stock_actual: '',
                stock_minimo: 5,
                requiere_receta: false,
                codigo_barras: '',
                laboratorio: '',
                ubicacion: ''
            });
            setPresentaciones([]);
            setPlantillaSeleccionada('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setPresentaciones([]);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Funciones para gestión de presentaciones
    const addPresentacion = () => {
        setPresentaciones([...presentaciones, { nombre: '', unidades: '', precio: '' }]);
    };

    const updatePresentacion = (index, field, value) => {
        const newPresentaciones = [...presentaciones];
        newPresentaciones[index][field] = value;
        setPresentaciones(newPresentaciones);
    };

    const removePresentacion = (index) => {
        const newPresentaciones = presentaciones.filter((_, i) => i !== index);
        setPresentaciones(newPresentaciones);
    };

    const aplicarPlantilla = (e) => {
        const plantillaId = parseInt(e.target.value);
        setPlantillaSeleccionada(plantillaId);

        if (!plantillaId) return;

        const plantilla = plantillas.find(p => p.id === plantillaId);
        if (plantilla) {
            // Convertir formato de plantilla al formato de estado
            const nuevasPresentaciones = plantilla.presentaciones.map(p => ({
                nombre: p.nombre,
                unidades: p.unidades,
                precio: '' // El usuario debe definir el precio
            })).filter(p => p.nombre !== 'Unidad'); // Excluir unidad base ya que esa es el producto principal

            setPresentaciones(nuevasPresentaciones);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // 1. Guardar/Actualizar producto base
            let productoId;
            let response;

            if (editingProduct) {
                response = await api.put(`/productos/${editingProduct.id}`, formData);
                productoId = editingProduct.id;
                toast.success('Producto actualizado');
            } else {
                response = await api.post('/productos', formData);
                productoId = response.data.id;
                toast.success('Producto creado');
            }

            // 2. Guardar presentaciones dinámicas
            // Primero eliminar las anteriores (simplificación)
            // En una implementación más robusta actualizaríamos por ID
            if (presentaciones.length > 0) {
                const promesas = presentaciones.filter(p => p.nombre && p.unidades && p.precio).map(p => {
                    return api.post('/presentaciones', {
                        producto_id: productoId,
                        nombre: p.nombre,
                        unidades_equivalentes: p.unidades,
                        precio_venta: p.precio,
                        orden: 0 // El backend manejará el orden si es necesario
                    });
                });

                await Promise.all(promesas);
            }

            handleCloseModal();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al guardar producto');
        }
    };

    const handleOpenStockModal = (producto) => {
        setSelectedProduct(producto);
        setStockForm({ cantidad: '', motivo: 'Actualización manual de stock', tipo: 'Entrada' });
        setIsStockModalOpen(true);
    };

    const handleAjustarStock = async (e) => {
        e.preventDefault();
        try {
            const cantidad = parseInt(stockForm.cantidad);
            if (!cantidad || cantidad <= 0) {
                toast.warning('Ingrese una cantidad válida mayor a 0');
                return;
            }

            const cantidadFinal = stockForm.tipo === 'Entrada' ? cantidad : -Math.abs(cantidad);

            if (stockForm.tipo === 'Salida' && selectedProduct.stock_actual + cantidadFinal < 0) {
                toast.error('El stock no puede ser negativo');
                return;
            }

            await api.post(`/productos/${selectedProduct.id}/ajustar-stock`, {
                cantidad: cantidadFinal,
                motivo: stockForm.motivo
            });

            toast.success('Stock ajustado exitosamente');
            setIsStockModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al ajustar stock');
        }
    };

    const productosFiltrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(search.toLowerCase()) ||
        producto.codigo_barras?.includes(search)
    );

    return (
        <div className="productos-page fade-in">
            <div className="page-header">
                <h1 className="page-title"><FiPackage /> Inventario de Productos</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <FiPlus /> Nuevo Producto
                </button>
            </div>

            <div className="card mb-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nombre, código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">Cargando productos...</div>
            ) : (
                <div className="grid grid-3">
                    {productosFiltrados.map(producto => (
                        <div key={producto.id} className="card product-card">
                            <div className="product-header">
                                <h3 className="product-title">{producto.nombre}</h3>
                                <span className={`status-badge ${producto.stock_actual <= producto.stock_minimo ? 'status-low' : 'status-ok'}`}>
                                    {producto.stock_actual} {producto.unidad_medida}s
                                </span>
                            </div>

                            <div className="product-details">
                                <p><strong>Categoría:</strong> {producto.categoria_nombre || 'Sin categoría'}</p>
                                <div className="price-tag">
                                    S/. {parseFloat(producto.precio_venta).toFixed(2)}
                                </div>
                                {producto.ubicacion && <p><small>📍 {producto.ubicacion}</small></p>}
                            </div>

                            <div className="product-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleOpenModal(producto)}
                                    title="Editar detalles del producto"
                                >
                                    <FiEdit /> Editar
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleOpenStockModal(producto)}
                                    title="Realizar ajuste manual de inventario"
                                >
                                    <FiSliders /> Ajustar Stock
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}><FiX /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            {/* Tabs o secciones visuales */}
                            <div className="form-section-title"><FiLayers /> Información Básica</div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label required">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        className="form-control"
                                        required
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Pañales Huggies G"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">Categoría</label>
                                    <select
                                        name="categoria_id"
                                        className="form-control"
                                        required
                                        value={formData.categoria_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    className="form-control"
                                    rows="2"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    placeholder="Detalles adicionales del producto..."
                                ></textarea>
                            </div>

                            <div className="grid grid-3">
                                <div className="form-group">
                                    <label className="form-label">Unidad Base</label>
                                    <select
                                        name="unidad_medida"
                                        className="form-control"
                                        value={formData.unidad_medida}
                                        onChange={handleChange}
                                    >
                                        <option value="Unidad">Unidad</option>
                                        <option value="Pañal">Pañal</option>
                                        <option value="Pastilla">Pastilla</option>
                                        <option value="Frasco">Frasco</option>
                                        <option value="Sobre">Sobre</option>
                                        <option value="Ampolla">Ampolla</option>
                                        <option value="Ml">Mililitro</option>
                                        <option value="Gr">Gramo</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">Precio Compra Base</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="precio_compra"
                                        className="form-control"
                                        required
                                        value={formData.precio_compra}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">Precio Venta Base</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="precio_venta"
                                        className="form-control"
                                        required
                                        value={formData.precio_venta}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

                            {/* SECCIÓN DE PRESENTACIONES DINÁMICAS */}
                            <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><FiShoppingBag /> Presentaciones y Precios</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="form-control form-control-sm"
                                        style={{ width: '200px' }}
                                        value={plantillaSeleccionada}
                                        onChange={aplicarPlantilla}
                                    >
                                        <option value="">Cargar Plantilla...</option>
                                        {plantillas.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                    <button type="button" className="btn btn-sm btn-outline" onClick={addPresentacion}>
                                        <FiPlus /> Agregar
                                    </button>
                                </div>
                            </div>

                            <div className="presentations-container" style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                {presentaciones.length === 0 ? (
                                    <div className="text-center text-muted py-3">
                                        <small>No hay presentaciones adicionales configuradas.</small><br />
                                        <small>Usa una plantilla (ej: Pañales) o agrega manualmente.</small>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm" style={{ marginBottom: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '30%' }}>Nombre (Ej: Paquete)</th>
                                                    <th style={{ width: '20%' }}>Unidades Equiv.</th>
                                                    <th style={{ width: '25%' }}>Precio Venta</th>
                                                    <th style={{ width: '20%' }}>Descuento</th>
                                                    <th style={{ width: '5%' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {presentaciones.map((pres, index) => {
                                                    // Calcular descuento en tiempo real
                                                    const precioBaseTotal = parseFloat(formData.precio_venta || 0) * (parseFloat(pres.unidades) || 0);
                                                    const precioVenta = parseFloat(pres.precio) || 0;
                                                    const descuento = precioBaseTotal > 0 && precioVenta > 0
                                                        ? ((1 - (precioVenta / precioBaseTotal)) * 100).toFixed(1)
                                                        : 0;

                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    placeholder="Ej: Caja"
                                                                    value={pres.nombre}
                                                                    onChange={(e) => updatePresentacion(index, 'nombre', e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    placeholder="Ej: 100"
                                                                    value={pres.unidades}
                                                                    onChange={(e) => updatePresentacion(index, 'unidades', e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <div className="input-group-sm symbol">
                                                                    <span>S/.</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="form-control form-control-sm"
                                                                        placeholder="Ej: 80.00"
                                                                        value={pres.precio}
                                                                        onChange={(e) => updatePresentacion(index, 'precio', e.target.value)}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${descuento > 0 ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.75rem' }}>
                                                                    {descuento}%
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="btn-icon text-danger"
                                                                    onClick={() => removePresentacion(index)}
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* PREVIEW DE PRECIOS */}
                            {formData.precio_venta && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    marginTop: '1rem'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        💰 Lista de Precios al Público:
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                                        {/* Precio Base */}
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Unitario ({formData.unidad_medida})</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                                                S/. {parseFloat(formData.precio_venta || 0).toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Precio base</div>
                                        </div>

                                        {/* Precios adicionales */}
                                        {presentaciones.map((p, i) => (
                                            p.nombre && p.precio && (
                                                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{p.nombre} ({p.unidades} un.)</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                                                        S/. {parseFloat(p.precio).toFixed(2)}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                                        {parseFloat(p.precio) < (parseFloat(formData.precio_venta) * parseFloat(p.unidades))
                                                            ? '🔥 Ahorra dinero'
                                                            : 'Precio normal'}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

                            <div className="grid grid-3">
                                <div className="form-group">
                                    <label className="form-label">Código de Barras</label>
                                    <input
                                        type="text"
                                        name="codigo_barras"
                                        className="form-control"
                                        value={formData.codigo_barras}
                                        onChange={handleChange}
                                        placeholder="Escanea aquí..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Laboratorio / Marca</label>
                                    <input
                                        type="text"
                                        name="laboratorio"
                                        className="form-control"
                                        value={formData.laboratorio}
                                        onChange={handleChange}
                                        placeholder="Ej: Huggies, Panadol..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ubicación</label>
                                    <input
                                        type="text"
                                        name="ubicacion"
                                        className="form-control"
                                        value={formData.ubicacion}
                                        onChange={handleChange}
                                        placeholder="Ej: A-12"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label required">Stock Actual (Total en unidades)</label>
                                    <input
                                        type="number"
                                        name="stock_actual"
                                        className="form-control"
                                        required
                                        value={formData.stock_actual}
                                        onChange={handleChange}
                                        placeholder="0"
                                        disabled={!!editingProduct} // No editar stock desde aquí para evitar descuadres
                                    />
                                    {editingProduct && <small className="text-muted">Use el módulo de Compras para ajustar stock</small>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        name="stock_minimo"
                                        className="form-control"
                                        required
                                        value={formData.stock_minimo}
                                        onChange={handleChange}
                                        placeholder="5"
                                    />
                                </div>
                            </div>

                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    name="requiere_receta"
                                    id="requiere_receta"
                                    className="form-check-input"
                                    checked={formData.requiere_receta}
                                    onChange={handleChange}
                                />
                                <label htmlFor="requiere_receta" className="form-check-label">
                                    Este producto requiere receta médica
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancelar</button>
                                <button type="submit" className="btn btn-primary"><FiSave /> Guardar Producto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Ajuste de Stock */}
            {isStockModalOpen && selectedProduct && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Ajuste de Stock</h2>
                            <button className="close-btn" onClick={() => setIsStockModalOpen(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleAjustarStock} className="modal-body">
                            <div style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '8px', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Producto:</div>
                                <div style={{ fontWeight: '700' }}>{selectedProduct.nombre}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Stock Actual:</span>
                                    <strong style={{ color: 'var(--primary)' }}>{selectedProduct.stock_actual} {selectedProduct.unidad_medida}s</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Tipo de Movimiento</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="tipo_ajuste"
                                            checked={stockForm.tipo === 'Entrada'}
                                            onChange={() => setStockForm({ ...stockForm, tipo: 'Entrada' })}
                                        />
                                        <span style={{ color: 'var(--success)', fontWeight: '600' }}>+ Ingreso</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="tipo_ajuste"
                                            checked={stockForm.tipo === 'Salida'}
                                            onChange={() => setStockForm({ ...stockForm, tipo: 'Salida' })}
                                        />
                                        <span style={{ color: 'var(--error)', fontWeight: '600' }}>- Salida</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Cantidad (Unidades)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="1"
                                    required
                                    value={stockForm.cantidad}
                                    onChange={e => setStockForm({ ...stockForm, cantidad: e.target.value })}
                                />
                                {stockForm.cantidad && (
                                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--gray-500)' }}>
                                        Nuevo stock proyectado: <strong>
                                            {stockForm.tipo === 'Entrada' 
                                                ? selectedProduct.stock_actual + parseInt(stockForm.cantidad) 
                                                : selectedProduct.stock_actual - parseInt(stockForm.cantidad)}
                                        </strong>
                                    </small>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Motivo del Ajuste</label>
                                <select
                                    className="form-control"
                                    required
                                    value={stockForm.motivo}
                                    onChange={e => setStockForm({ ...stockForm, motivo: e.target.value })}
                                >
                                    <option value="Actualización manual de stock">Actualización manual (Conteo)</option>
                                    {stockForm.tipo === 'Salida' && (
                                        <>
                                            <option value="Producto vencido">Producto vencido</option>
                                            <option value="Mercadería dañada">Mercadería dañada</option>
                                            <option value="Muestra médica / Promoción">Muestra médica / Promoción</option>
                                            <option value="Uso interno">Uso interno de botica</option>
                                        </>
                                    )}
                                    {stockForm.tipo === 'Entrada' && (
                                        <>
                                            <option value="Ingreso no registrado de compras">Ingreso por orden de compra omitida</option>
                                            <option value="Devolución de cliente">Devolución de cliente</option>
                                        </>
                                    )}
                                    <option value="Otro">Otro motivo</option>
                                </select>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsStockModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar Ajuste</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Productos;
