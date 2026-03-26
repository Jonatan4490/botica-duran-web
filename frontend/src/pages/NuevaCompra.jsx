import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FiShoppingBag, FiPlus, FiTrash2, FiSearch, FiSave, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const NuevaCompra = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [searchProducto, setSearchProducto] = useState('');
    const [formData, setFormData] = useState({
        proveedor_id: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, provRes] = await Promise.all([
                api.get('/productos?activo=true'),
                api.get('/proveedores?activo=true')
            ]);
            setProductos(prodRes.data);
            setProveedores(provRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        }
    };

    const agregarAlCarrito = (producto) => {
        const existe = carrito.find(item => item.producto_id === producto.id);

        if (existe) {
            setCarrito(carrito.map(item =>
                item.producto_id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: parseFloat(producto.precio_compra) || 0,
                cantidad: 1,
                numero_lote: '',
                fecha_vencimiento: ''
            }]);
        }
        setSearchProducto('');
    };

    const actualizarItem = (index, campo, valor) => {
        const newCarrito = [...carrito];
        newCarrito[index][campo] = valor;
        setCarrito(newCarrito);
    };

    const eliminarDelCarrito = (index) => {
        setCarrito(carrito.filter((_, i) => i !== index));
    };

    const calcularTotal = () => {
        return carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.proveedor_id) {
            toast.warning('Seleccione un proveedor');
            return;
        }

        if (carrito.length === 0) {
            toast.warning('Agrege productos a la compra');
            return;
        }

        setLoading(true);

        try {
            const compraData = {
                ...formData,
                items: carrito
            };

            await api.post('/compras', compraData);

            toast.success('Compra registrada y stock actualizado');
            navigate('/compras');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al registrar compra');
        } finally {
            setLoading(false);
        }
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchProducto.toLowerCase())
    ).slice(0, 10);

    return (
        <div className="nueva-compra-page fade-in">
            <div className="page-header">
                <h1 className="page-title"><FiShoppingBag /> Nueva Compra a Proveedor</h1>
                <p className="page-subtitle">Aumenta el stock y actualiza precios de compra</p>
            </div>

            <div className="grid grid-3">
                {/* Búsqueda y Proveedor */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="form-group">
                        <label className="form-label required"><FiTruck /> Proveedor</label>
                        <select
                            className="form-control"
                            value={formData.proveedor_id}
                            onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar proveedor</option>
                            {proveedores.map(prov => (
                                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Fecha de Compra</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.fecha_compra}
                            onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginTop: '2rem' }}>
                        <label className="form-label"><FiSearch /> Buscar Producto para agregar</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nombre del producto..."
                            value={searchProducto}
                            onChange={(e) => setSearchProducto(e.target.value)}
                        />
                    </div>

                    {searchProducto && productosFiltrados.length > 0 && (
                        <div className="productos-search-list card" style={{ padding: '0', marginTop: '0.5rem' }}>
                            {productosFiltrados.map(producto => (
                                <div
                                    key={producto.id}
                                    className="producto-search-item"
                                    onClick={() => agregarAlCarrito(producto)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid var(--gray-100)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <strong>{producto.nombre}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                                        P. Compra actual: S/. {parseFloat(producto.precio_compra).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lista de productos en la compra */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 className="card-title">Productos en esta Compra</h3>

                    {carrito.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th style={{ width: '100px' }}>Cant.</th>
                                        <th style={{ width: '120px' }}>P. Compra</th>
                                        <th style={{ width: '120px' }}>Lote / Venc.</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carrito.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.nombre}</strong></td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min="1"
                                                    value={item.cantidad}
                                                    onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control form-control-sm"
                                                    value={item.precio_unitario}
                                                    onChange={(e) => actualizarItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td>
                                                <div className="flex gap-1" style={{ flexDirection: 'column' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Lote"
                                                        className="form-control form-control-sm"
                                                        style={{ fontSize: '0.7rem' }}
                                                        value={item.numero_lote}
                                                        onChange={(e) => actualizarItem(index, 'numero_lote', e.target.value)}
                                                    />
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        style={{ fontSize: '0.7rem' }}
                                                        value={item.fecha_vencimiento}
                                                        onChange={(e) => actualizarItem(index, 'fecha_vencimiento', e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td><strong>S/. {(item.precio_unitario * item.cantidad).toFixed(2)}</strong></td>
                                            <td>
                                                <button className="btn btn-sm btn-danger" onClick={() => eliminarDelCarrito(index)}>
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                            <FiPlus style={{ fontSize: '2rem' }} />
                            <p>Busca y selecciona productos para agregar a la compra</p>
                        </div>
                    )}

                    {carrito.length > 0 && (
                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label">Observaciones</label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    placeholder="Detalles sobre el envío o pago..."
                                ></textarea>
                            </div>

                            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                                Total Compra: <strong style={{ color: 'var(--primary)' }}>S/. {calcularTotal().toFixed(2)}</strong>
                            </div>

                            <div className="flex gap-2">
                                <button className="btn btn-outline" onClick={() => navigate('/compras')}>
                                    Cancelar
                                </button>
                                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                                    <FiSave /> {loading ? 'Registrando...' : 'Registrar Compra'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NuevaCompra;
