import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import {
    FiTruck, FiPlus, FiSearch, FiRefreshCw,
    FiEye, FiX, FiCheckCircle, FiClock,
    FiPackage, FiDollarSign, FiCalendar
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Compras = () => {
    const [compras, setCompras] = useState([]);
    const [comprasFiltradas, setComprasFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [selectedCompra, setSelectedCompra] = useState(null);

    useEffect(() => {
        fetchCompras();
    }, []);

    useEffect(() => {
        let filtradas = [...compras];
        if (search) {
            filtradas = filtradas.filter(c =>
                c.numero_compra?.toLowerCase().includes(search.toLowerCase()) ||
                c.proveedor_nombre?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (filtroEstado) {
            filtradas = filtradas.filter(c => c.estado === filtroEstado);
        }
        setComprasFiltradas(filtradas);
    }, [compras, search, filtroEstado]);

    const fetchCompras = async () => {
        try {
            const response = await api.get('/compras');
            setCompras(response.data || []);
        } catch (error) {
            toast.error('Error al cargar compras');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

    const totalInvertido = comprasFiltradas.reduce((s, c) => s + parseFloat(c.total || 0), 0);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <span>Cargando compras...</span>
            </div>
        );
    }

    return (
        <div className="compras-page fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FiTruck /> Compras a Proveedores</h1>
                    <p className="page-subtitle">Gestiona tus órdenes de compra e inventario</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline" onClick={fetchCompras}>
                        <FiRefreshCw /> Actualizar
                    </button>
                    <Link to="/compras/nueva" className="btn btn-primary">
                        <FiPlus /> Nueva Compra
                    </Link>
                </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Compras', value: compras.length, icon: <FiPackage />, color: 'var(--primary)' },
                    { label: 'Total Invertido', value: formatCurrency(compras.reduce((s, c) => s + parseFloat(c.total || 0), 0)), icon: <FiDollarSign />, color: 'var(--rose)' },
                    { label: 'Recibidas', value: compras.filter(c => c.estado === 'Recibida').length, icon: <FiCheckCircle />, color: 'var(--success)' },
                    { label: 'Pendientes', value: compras.filter(c => c.estado !== 'Recibida').length, icon: <FiClock />, color: 'var(--amber)' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--white)', border: '1px solid var(--gray-100)',
                        borderRadius: 'var(--radius-xl)', padding: '1rem 1.25rem',
                        display: 'flex', alignItems: 'center', gap: '0.875rem',
                        boxShadow: 'var(--shadow-xs)'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: `${item.color}14`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.color, fontSize: '1.1rem', flexShrink: 0
                        }}>{item.icon}</div>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--gray-900)', fontFamily: 'Outfit, sans-serif' }}>{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="filter-bar">
                <div className="flex-1" style={{ position: 'relative', minWidth: '200px' }}>
                    <FiSearch style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '1rem' }} />
                    <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Buscar por N° compra o proveedor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="form-control"
                    style={{ width: 'auto' }}
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value)}
                >
                    <option value="">Todos los estados</option>
                    <option value="Recibida">Recibida</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cancelada">Cancelada</option>
                </select>
                {(search || filtroEstado) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFiltroEstado(''); }}>
                        <FiX /> Limpiar
                    </button>
                )}
            </div>

            {/* Tabla */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <strong style={{ color: 'var(--gray-800)' }}>{comprasFiltradas.length}</strong> registros | Total: <strong style={{ color: 'var(--rose)' }}>{formatCurrency(totalInvertido)}</strong>
                    </span>
                </div>
                <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
                    {comprasFiltradas.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>N° Compra</th>
                                    <th>Proveedor</th>
                                    <th>Fecha</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                    <th>Estado</th>
                                    <th>Registrado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comprasFiltradas.map((compra) => (
                                    <tr key={compra.id}>
                                        <td>
                                            <span className="ticket-number">{compra.numero_compra}</span>
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{compra.proveedor_nombre}</td>
                                        <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                            <FiCalendar style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            {formatDate(compra.fecha_compra)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--gray-900)' }}>
                                                {formatCurrency(compra.total)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${compra.estado === 'Recibida' ? 'badge-success' : compra.estado === 'Pendiente' ? 'badge-warning' : 'badge-danger'}`}>
                                                {compra.estado === 'Recibida' ? '✓ ' : compra.estado === 'Pendiente' ? '⏳ ' : '✗ '}
                                                {compra.estado}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{compra.usuario_nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon"><FiTruck /></div>
                            <p className="empty-state-title">{search || filtroEstado ? 'Sin resultados' : 'No hay compras registradas'}</p>
                            <p className="empty-state-text">
                                {search || filtroEstado
                                    ? 'Prueba cambiando los filtros'
                                    : 'Registra tu primera compra a proveedor'}
                            </p>
                            {!search && !filtroEstado && (
                                <Link to="/compras/nueva" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                                    <FiPlus /> Nueva Compra
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Compras;
