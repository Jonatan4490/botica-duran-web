import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FiShoppingCart, FiPlus, FiTrash2, FiSearch, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const NuevaVenta = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [searchProducto, setSearchProducto] = useState('');
    const [formData, setFormData] = useState({
        cliente_id: '',
        metodo_pago: 'Efectivo',
        descuento: 0,
        monto_recibido: '',
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, cliRes] = await Promise.all([
                api.get('/productos?activo=true'),
                api.get('/clientes?activo=true')
            ]);

            // Protección contra respuestas nulas
            setProductos(prodRes && prodRes.data && Array.isArray(prodRes.data) ? prodRes.data : []);
            setClientes(cliRes && cliRes.data && Array.isArray(cliRes.data) ? cliRes.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar datos iniciales');
            setProductos([]);
            setClientes([]);
        }
    };

    const fetchPresentaciones = async (productoId) => {
        try {
            const res = await api.get(`/presentaciones/producto/${productoId}`);
            return res && res.data && Array.isArray(res.data) ? res.data : [];
        } catch (error) {
            console.error('Error al cargar presentaciones', error);
            return []; // Retorna array vacío en caso de error
        }
    };

    const agregarAlCarrito = async (producto) => {
        if (!producto) return;

        try {
            // Cargar presentaciones dinámicas del producto
            const presentacionesExtra = await fetchPresentaciones(producto.id);

            // Unificar presentaciones: Base (Unidad) + Adicionales
            const basePresentacion = {
                id: 'base',
                nombre: 'Unidad',
                unidades_equivalentes: 1,
                precio_venta: parseFloat(producto.precio_venta) || 0,
                tipo: 'base'
            };

            const todasPresentaciones = [basePresentacion, ...presentacionesExtra];

            // Buscar si ya existe en carrito
            const existeIndex = carrito.findIndex(item => item.producto_id === producto.id);

            if (existeIndex >= 0) {
                // Actualizar existente
                const itemExistente = carrito[existeIndex];
                const nuevaCantidad = itemExistente.cantidad + 1;

                // Usar optional chaining y defaults
                const presentacionActual = itemExistente.presentacion_seleccionada || basePresentacion;
                const unidadesPorPresentacion = presentacionActual.unidades_equivalentes || 1;
                const nuevasUnidadesTotales = nuevaCantidad * unidadesPorPresentacion;

                if (nuevasUnidadesTotales > producto.stock_actual) {
                    toast.warning('No hay suficiente stock');
                    return;
                }

                const nuevoCarrito = [...carrito];
                nuevoCarrito[existeIndex] = {
                    ...itemExistente,
                    cantidad: nuevaCantidad,
                    cantidadUnidades: nuevasUnidadesTotales
                };
                setCarrito(nuevoCarrito);

            } else {
                // Nuevo item
                if (producto.stock_actual <= 0) {
                    toast.warning('Producto sin stock');
                    return;
                }

                const nuevoItem = {
                    producto_id: producto.id,
                    nombre: producto.nombre || 'Producto sin nombre',
                    presentaciones: todasPresentaciones,
                    presentacion_seleccionada: todasPresentaciones[0], // Siempre existe al menos la base
                    cantidad: 1,
                    cantidadUnidades: 1,
                    stock_disponible: producto.stock_actual || 0
                };

                setCarrito(prev => [...prev, nuevoItem]);
            }
            setSearchProducto('');
        } catch (error) {
            console.error('Error al agregar al carrito', error);
            toast.error('Error al procesar producto');
        }
    };

    const actualizarCantidad = (index, valor) => {
        const cantidad = valor === '' ? 0 : parseInt(valor);
        
        if (isNaN(cantidad) || cantidad < 0) return;

        const newCarrito = [...carrito];
        const item = newCarrito[index];

        if (!item || !item.presentacion_seleccionada) return;

        const unidadesPorPresentacion = item.presentacion_seleccionada.unidades_equivalentes || 1;
        const unidadesTotales = cantidad * unidadesPorPresentacion;

        // Ya no eliminamos el item si la cantidad es 0, para permitir que el usuario escriba
        // La eliminación se hace explícitamente con el icono de basurero
        if (unidadesTotales <= item.stock_disponible) {
            item.cantidad = cantidad;
            item.cantidadUnidades = unidadesTotales;
            setCarrito(newCarrito);
        } else {
            toast.warning(`Stock insuficiente. Intentas vender ${unidadesTotales} unidades, pero solo hay ${item.stock_disponible}.`);
        }
    };

    const cambiarPresentacion = (index, presentacionNombre) => {
        const newCarrito = [...carrito];
        const item = newCarrito[index];

        if (!item || !item.presentaciones) return;

        const nuevaPresentacion = item.presentaciones.find(p => p.nombre === presentacionNombre);

        if (!nuevaPresentacion) return;

        const nuevasUnidadesTotales = item.cantidad * (nuevaPresentacion.unidades_equivalentes || 1);

        if (nuevasUnidadesTotales > item.stock_disponible) {
            toast.warning(`No hay stock suficiente. Requiere ${nuevasUnidadesTotales} unidades.`);
            return;
        }

        item.presentacion_seleccionada = nuevaPresentacion;
        item.cantidadUnidades = nuevasUnidadesTotales;

        setCarrito(newCarrito);
    };

    const eliminarDelCarrito = (index) => {
        setCarrito(prev => prev.filter((_, i) => i !== index));
    };

    const calcularSubtotal = () => {
        return carrito.reduce((sum, item) => {
            const precio = parseFloat(item.presentacion_seleccionada?.precio_venta) || 0;
            const cantidad = parseInt(item.cantidad) || 0;
            return sum + (precio * cantidad);
        }, 0);
    };

    const calcularTotal = () => {
        let total = calcularSubtotal() - (parseFloat(formData.descuento) || 0);
        return total > 0 ? total : 0;
    };

    const handlePrintTicket = async (ventaId, dVenta) => {
        try {
            const w = window.open('', '_blank', 'width=400,height=600');
            w.document.write(`
                <html>
                <head>
                    <title>Ticket ${dVenta.numero_ticket}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 10px; color: #000; font-size: 12px; }
                        h1 { text-align: center; font-size: 16px; margin: 0 0 10px 0; }
                        P { margin: 2px 0; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 4px 0; }
                        th { border-bottom: 1px dashed #000; text-align: left; }
                        .total-row { font-size: 14px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>BOTICA DURAN</h1>
                    <div class="text-center">
                        <p>RUC: 20123456789</p>
                        <p>Av. Principal 123 - Ciudad</p>
                        <p>Tel: (01) 987-6543</p>
                    </div>
                    <div class="divider"></div>
                    <p><strong>Ticket:</strong> ${dVenta.numero_ticket}</p>
                    <p><strong>Fecha:</strong> ${new Date(dVenta.created_at || new Date()).toLocaleString('es-PE')}</p>
                    <p><strong>Cajero:</strong> ${dVenta.usuario_nombre || 'Administrador'}</p>
                    <p><strong>Cliente:</strong> ${dVenta.cliente_nombre || 'Público general'}</p>
                    <div class="divider"></div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50%">Cant/Prod</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(dVenta.items || dVenta.detalles || []).map(item => `
                                <tr>
                                    <td colspan="2">${item.producto_nombre || item.nombre}</td>
                                </tr>
                                <tr>
                                    <td>${item.cantidad || item.cantidad_presentacion}x ${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                    <td class="text-right">${parseFloat((item.cantidad || 1) * item.precio_unitario).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="divider"></div>
                    
                    ${dVenta.descuento > 0 ? `
                        <table style="margin-bottom: 4px;">
                            <tr>
                                <td>Subtotal:</td>
                                <td class="text-right">${(parseFloat(dVenta.total) + parseFloat(dVenta.descuento)).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Descuento:</td>
                                <td class="text-right">-${parseFloat(dVenta.descuento).toFixed(2)}</td>
                            </tr>
                        </table>
                    ` : ''}

                    <table>
                        <tr class="total-row">
                            <td>TOTAL a pagar:</td>
                            <td class="text-right">S/. ${parseFloat(dVenta.total).toFixed(2)}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 5px;">M. Pago: ${dVenta.metodo_pago}</p>

                    <div class="divider"></div>
                    <div class="text-center" style="margin-top: 15px;">
                        <p>¡Gracias por su compra!</p>
                        <p>Conserve este ticket para</p>
                        <p>cualquier reclamo.</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
                </html>
            `);
            w.document.close();
        } catch (error) {
            console.error(error);
            toast.error('Error al imprimir comprobante');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const itemsValidos = carrito.filter(item => item.cantidad > 0);

        if (itemsValidos.length === 0) {
            toast.warning('Agrega productos con cantidad válida (mayor a 0) al carrito');
            setLoading(false);
            return;
        }

        try {
            const ventaData = {
                ...formData,
                items: itemsValidos.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidadUnidades,
                    cantidad_presentacion: item.cantidad,
                    precio_unitario: item.presentacion_seleccionada?.precio_venta || 0,
                    tipo_venta: item.presentacion_seleccionada?.nombre || 'Unidad'
                })),
                cliente_id: formData.cliente_id || null
            };

            const response = await api.post('/ventas', ventaData);

            if (response.status === 200 || response.status === 201) {
                toast.success('Venta registrada exitosamente');
                
                // Opción para imprimir el ticket al instante
                if (window.confirm('Venta realizada con éxito. ¿Desea imprimir el ticket ahora?')) {
                    handlePrintTicket(response.data.id, response.data);
                }

                setCarrito([]);
                setFormData({
                    cliente_id: '',
                    metodo_pago: 'Efectivo',
                    descuento: 0,
                    monto_recibido: '',
                    observaciones: ''
                });
                
                // Mantiene al cajero en la misma pantalla para seguir vendiendo
            } else {
                throw new Error('Respuesta inesperada del servidor');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al registrar venta');
        } finally {
            setLoading(false);
        }
    };

    // Render seguro
    return (
        <div className="nueva-venta-page fade-in">
            <div className="page-header">
                <h1 className="page-title"><FiShoppingCart /> Nueva Venta</h1>
            </div>

            <div className="grid grid-2">
                {/* Búsqueda */}
                <div className="card">
                    <h3 className="card-title"><FiSearch /> Buscar Producto</h3>
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar producto..."
                            value={searchProducto}
                            onChange={(e) => setSearchProducto(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {searchProducto && Array.isArray(productos) && (
                        <div className="productos-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {productos
                                .filter(p => !searchProducto || (p.nombre && p.nombre.toLowerCase().includes(searchProducto.toLowerCase())))
                                .slice(0, 10)
                                .map(producto => (
                                    <div
                                        key={producto.id}
                                        className="producto-item"
                                        onClick={() => agregarAlCarrito(producto)}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--gray-200)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{producto.nombre || 'Sin nombre'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                                                Stock: {producto.stock_actual} {producto.unidad_medida || 'Unidad'}s
                                            </div>
                                        </div>
                                        <div className="text-primary product-action-icon">
                                            <FiPlus />
                                        </div>
                                    </div>
                                ))
                            }
                            {productos.filter(p => p.nombre && p.nombre.toLowerCase().includes(searchProducto.toLowerCase())).length === 0 && (
                                <div className="text-center py-4 text-muted">
                                    No se encontraron productos
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Carrito */}
                <div className="card">
                    <h3 className="card-title"><FiShoppingCart /> Carrito de Compras</h3>

                    {carrito.length > 0 ? (
                        <>
                            <div className="carrito-items" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                                {carrito.map((item, index) => (
                                    <div key={index} className="carrito-item" style={{
                                        background: 'var(--gray-50)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.5rem',
                                        border: '1px solid var(--gray-200)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <strong style={{ fontSize: '1rem' }}>{item.nombre}</strong>
                                            <button
                                                type="button"
                                                className="btn-icon text-danger"
                                                onClick={() => eliminarDelCarrito(index)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>

                                        <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                            {/* Selector de Presentación */}
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Presentación</label>
                                                <select
                                                    className="form-control form-control-sm"
                                                    value={item.presentacion_seleccionada?.nombre || ''}
                                                    onChange={(e) => cambiarPresentacion(index, e.target.value)}
                                                >
                                                    {item.presentaciones && item.presentaciones.map((p, idx) => (
                                                        <option key={p.id || idx} value={p.nombre}>
                                                            {p.nombre} ({p.unidades_equivalentes} un.) - S/. {parseFloat(p.precio_venta || 0).toFixed(2)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Cantidad */}
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Cantidad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                    value={item.cantidad || ''}
                                                    onChange={(e) => actualizarCantidad(index, e.target.value)}
                                                />
                                            </div>

                                            {/* Subtotal */}
                                            <div className="text-right">
                                                <label style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Subtotal</label>
                                                <div style={{ fontWeight: '700', color: 'var(--primary)' }}>
                                                    S/. {(parseFloat(item.presentacion_seleccionada?.precio_venta || 0) * (item.cantidad || 0)).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totales */}
                            <div className="carrito-summary" style={{ borderTop: '2px dashed var(--gray-300)', paddingTop: '1rem' }}>
                                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Subtotal</span>
                                    <strong>S/. {calcularSubtotal().toFixed(2)}</strong>
                                </div>
                                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--error)' }}>
                                    <span>Descuento</span>
                                    <strong>- S/. {(parseFloat(formData.descuento) || 0).toFixed(2)}</strong>
                                </div>
                                <div className="summary-row total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', marginTop: '0.5rem', color: 'var(--primary)' }}>
                                    <span>TOTAL</span>
                                    <span>S/. {calcularTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <FiShoppingCart size={40} style={{ opacity: 0.2 }} />
                            <p className="mt-2">Carrito vacío</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="card mt-4">
                <div className="grid grid-3">
                    <div className="form-group">
                        <label className="form-label">Cliente</label>
                        <select
                            className="form-control"
                            value={formData.cliente_id}
                            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                        >
                            <option value="">Público General</option>
                            {Array.isArray(clientes) && clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre} {cliente.dni ? `- ${cliente.dni}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Método de Pago</label>
                        <select
                            className="form-control"
                            value={formData.metodo_pago}
                            onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                            required
                        >
                            <option value="Efectivo">💵 Efectivo</option>
                            <option value="Tarjeta">💳 Tarjeta</option>
                            <option value="Yape">📱 Yape</option>
                            <option value="Plin">📱 Plin</option>
                            <option value="Transferencia">🏦 Transferencia</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Descuento (S/.)</label>
                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={formData.descuento}
                            onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                {/* Campo de monto recibido - solo para efectivo */}
                {formData.metodo_pago === 'Efectivo' && (
                    <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Monto Recibido (S/.)</label>
                            <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.10"
                                placeholder="0.00"
                                value={formData.monto_recibido}
                                onChange={(e) => setFormData({ ...formData, monto_recibido: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Vuelto / Cambio</label>
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: formData.monto_recibido && (parseFloat(formData.monto_recibido) - calcularTotal()) >= 0
                                    ? 'rgba(16, 185, 129, 0.08)'
                                    : formData.monto_recibido ? 'rgba(239, 68, 68, 0.08)' : 'var(--gray-100)',
                                border: `2px solid ${formData.monto_recibido && (parseFloat(formData.monto_recibido) - calcularTotal()) >= 0
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : formData.monto_recibido ? 'rgba(239, 68, 68, 0.3)' : 'var(--gray-200)'}`,
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                color: formData.monto_recibido && (parseFloat(formData.monto_recibido) - calcularTotal()) >= 0
                                    ? 'var(--success)' : formData.monto_recibido ? 'var(--error)' : 'var(--gray-400)'
                            }}>
                                {formData.monto_recibido
                                    ? `S/. ${Math.max(0, parseFloat(formData.monto_recibido) - calcularTotal()).toFixed(2)}`
                                    : '---'
                                }
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Observaciones</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nota adicional..."
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                <div className="form-actions text-right">
                    <button
                        type="button"
                        className="btn btn-outline mr-2"
                        onClick={() => navigate('/ventas')}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading || carrito.length === 0}
                    >
                        {loading ? 'Procesando...' : <><FiCheck /> Confirmar Venta</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NuevaVenta;
