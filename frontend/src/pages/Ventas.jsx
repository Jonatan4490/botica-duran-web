import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import {
    FiShoppingBag, FiEye, FiPlus, FiSearch, FiFilter,
    FiDownload, FiRefreshCw, FiShoppingCart, FiCalendar,
    FiDollarSign, FiTrendingUp, FiX, FiPrinter
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Ventas = () => {
    const [ventas, setVentas] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filtroMetodo, setFiltroMetodo] = useState('');
    const [filtroFecha, setFiltroFecha] = useState('');
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [detalleVenta, setDetalleVenta] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    useEffect(() => {
        fetchVentas();
    }, []);

    useEffect(() => {
        let filtradas = [...ventas];
        if (search) {
            filtradas = filtradas.filter(v =>
                v.numero_ticket?.toLowerCase().includes(search.toLowerCase()) ||
                v.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (filtroMetodo) {
            filtradas = filtradas.filter(v => v.metodo_pago === filtroMetodo);
        }
        if (filtroFecha) {
            filtradas = filtradas.filter(v => {
                const fecha = new Date(v.created_at).toISOString().split('T')[0];
                return fecha === filtroFecha;
            });
        }
        setVentasFiltradas(filtradas);
    }, [ventas, search, filtroMetodo, filtroFecha]);

    const fetchVentas = async () => {
        try {
            const response = await api.get('/ventas');
            setVentas(response.data || []);
        } catch (error) {
            toast.error('Error al cargar ventas');
        } finally {
            setLoading(false);
        }
    };

    const openDetalle = async (venta) => {
        setSelectedVenta(venta);
        setLoadingDetalle(true);
        try {
            const res = await api.get(`/ventas/${venta.id}`);
            setDetalleVenta(res.data);
        } catch (error) {
            toast.error('Error al cargar detalle');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const closeDetalle = () => {
        setSelectedVenta(null);
        setDetalleVenta(null);
    };

    const clearFilters = () => {
        setSearch('');
        setFiltroMetodo('');
        setFiltroFecha('');
    };

    const hasFilters = search || filtroMetodo || filtroFecha;

    const formatCurrency = (value) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

    const getMetodoBadge = (metodo) => {
        const map = {
            'Efectivo': 'badge-success',
            'Yape': 'badge-info',
            'Plin': 'badge-info',
            'Tarjeta': 'badge-accent',
            'Transferencia': 'badge-warning',
        };
        return map[metodo] || 'badge-gray';
    };

    // Función para imprimir ticket térmico
    const handlePrintTicket = async (ventaId, ventaDatos = null) => {
        try {
            // Obtener el detalle si no se tiene
            let dVenta = ventaDatos;
            if (!dVenta) {
                const res = await api.get(`/ventas/${ventaId}`);
                dVenta = res.data;
            }

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
                    <p><strong>Fecha:</strong> ${new Date(dVenta.created_at).toLocaleString('es-PE')}</p>
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
            toast.error('Error al generar comprobante');
        }
    };

    // Estadísticas rápidas
    const totalVentas = ventasFiltradas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
    const ventasHoy = ventas.filter(v =>
        new Date(v.created_at).toDateString() === new Date().toDateString()
    ).length;

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <span>Cargando ventas...</span>
            </div>
        );
    }

    return (
        <div className="ventas-page fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FiShoppingBag /> Historial de Ventas</h1>
                    <p className="page-subtitle">Gestiona y revisa todas las transacciones</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline" onClick={fetchVentas}>
                        <FiRefreshCw /> Actualizar
                    </button>
                    <Link to="/ventas/nueva" className="btn btn-primary">
                        <FiPlus /> Nueva Venta
                    </Link>
                </div>
            </div>

            {/* Stats rápidas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                {[
                    { label: 'Total Mostrado', value: formatCurrency(totalVentas), icon: <FiDollarSign />, color: 'var(--primary)' },
                    { label: 'Ventas Hoy', value: ventasHoy, icon: <FiCalendar />, color: 'var(--success)' },
                    { label: 'Total Registros', value: ventas.length, icon: <FiShoppingCart />, color: 'var(--accent)' },
                    { label: 'Filtradas', value: ventasFiltradas.length, icon: <FiFilter />, color: 'var(--amber)' }
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--white)',
                        border: '1px solid var(--gray-100)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        boxShadow: 'var(--shadow-xs)'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: `${item.color}14`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.color, fontSize: '1.1rem', flexShrink: 0
                        }}>
                            {item.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--gray-900)', fontFamily: 'Outfit, sans-serif' }}>{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="filter-bar">
                <div className="search-box flex-1" style={{ minWidth: '200px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Buscar por ticket o cliente..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="form-control"
                    style={{ width: 'auto', minWidth: '150px' }}
                    value={filtroMetodo}
                    onChange={e => setFiltroMetodo(e.target.value)}
                >
                    <option value="">Todos los métodos</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                </select>
                <input
                    type="date"
                    className="form-control"
                    style={{ width: 'auto' }}
                    value={filtroFecha}
                    onChange={e => setFiltroFecha(e.target.value)}
                />
                {hasFilters && (
                    <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                        <FiX /> Limpiar
                    </button>
                )}
            </div>

            {/* Tabla */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="table-count">
                        Mostrando <strong>{ventasFiltradas.length}</strong> de {ventas.length} ventas
                    </span>
                </div>
                <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
                    {ventasFiltradas.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Método</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasFiltradas.map((venta) => (
                                    <tr key={venta.id}>
                                        <td>
                                            <span className="ticket-number">{venta.numero_ticket}</span>
                                        </td>
                                        <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                            {formatDate(venta.created_at)}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: '500' }}>
                                                {venta.cliente_nombre || 'Público general'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getMetodoBadge(venta.metodo_pago)}`}>
                                                {venta.metodo_pago}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--gray-900)' }}>
                                                {formatCurrency(venta.total)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${venta.estado === 'Completada' ? 'badge-success' : 'badge-danger'}`}>
                                                {venta.estado}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handlePrintTicket(venta.id)}
                                                    title="Imprimir Ticket"
                                                >
                                                    <FiPrinter size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => openDetalle(venta)}
                                                    title="Ver Detalle"
                                                >
                                                    <FiEye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon"><FiShoppingBag /></div>
                            <p className="empty-state-title">
                                {hasFilters ? 'Sin resultados' : 'No hay ventas registradas'}
                            </p>
                            <p className="empty-state-text">
                                {hasFilters
                                    ? 'Prueba cambiando los filtros de búsqueda'
                                    : 'Las ventas aparecerán aquí cuando sean registradas'
                                }
                            </p>
                            {!hasFilters && (
                                <Link to="/ventas/nueva" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                                    <FiPlus /> Registrar primera venta
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalle */}
            {selectedVenta && (
                <div className="modal-overlay" onClick={closeDetalle}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiShoppingCart style={{ color: 'var(--primary)' }} />
                                Venta {selectedVenta.numero_ticket}
                            </h3>
                            <button className="btn-close" onClick={closeDetalle}><FiX /></button>
                        </div>
                        <div className="modal-body">
                            {loadingDetalle ? (
                                <div className="loading" style={{ padding: '2rem' }}>
                                    <div className="spinner" />
                                    <span>Cargando detalle...</span>
                                </div>
                            ) : detalleVenta ? (
                                <>
                                    {/* Info de la venta */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {[
                                            { label: 'Ticket', value: detalleVenta.numero_ticket || selectedVenta.numero_ticket },
                                            { label: 'Fecha', value: formatDate(detalleVenta.created_at || selectedVenta.created_at) },
                                            { label: 'Cliente', value: detalleVenta.cliente_nombre || 'Público general' },
                                            { label: 'Método de pago', value: detalleVenta.metodo_pago || selectedVenta.metodo_pago },
                                            { label: 'Estado', value: detalleVenta.estado || selectedVenta.estado },
                                            { label: 'Vendedor', value: detalleVenta.usuario_nombre || 'Admin' }
                                        ].map((item, i) => (
                                            <div key={i} style={{
                                                background: 'var(--gray-50)',
                                                borderRadius: 'var(--radius-lg)',
                                                padding: '0.75rem 1rem',
                                                border: '1px solid var(--gray-100)'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Items */}
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</h4>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th>P. Unit.</th>
                                                    <th style={{ textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(detalleVenta.items || detalleVenta.detalles || []).map((item, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: '500' }}>{item.producto_nombre || item.nombre}</td>
                                                        <td>{item.cantidad || item.cantidad_presentacion} {item.tipo_venta || 'unid.'}</td>
                                                        <td>{formatCurrency(item.precio_unitario)}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                                            {formatCurrency(item.total || (item.precio_unitario * (item.cantidad || 1)))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Totales */}
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)' }}>
                                        {detalleVenta.descuento > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--rose)' }}>
                                                <span>Descuento:</span>
                                                <span>- {formatCurrency(detalleVenta.descuento)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                                            <span>TOTAL:</span>
                                            <span style={{ color: 'var(--primary)' }}>{formatCurrency(detalleVenta.total || selectedVenta.total)}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                                    <p>No se encontró el detalle de esta venta</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button className="btn btn-outline-primary" onClick={() => handlePrintTicket(selectedVenta.id, detalleVenta)} disabled={!detalleVenta}>
                                <FiPrinter /> Imprimir Ticket
                            </button>
                            <button className="btn btn-outline" onClick={closeDetalle}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ventas;
