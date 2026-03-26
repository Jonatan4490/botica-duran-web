import { useEffect, useState } from 'react';
import api from '../utils/api';
import {
    FiBarChart2, FiDollarSign, FiPackage, FiAlertTriangle,
    FiTrendingUp, FiRefreshCw, FiAward, FiClock, FiAlertCircle,
    FiDownload, FiChevronUp
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const Reportes = () => {
    const [productosVendidos, setProductosVendidos] = useState([]);
    const [stockBajo, setStockBajo] = useState([]);
    const [porVencer, setPorVencer] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState('mes');

    useEffect(() => {
        fetchReportes();
    }, []);

    const fetchReportes = async () => {
        setLoading(true);
        try {
            const [prodRes, stockRes, vencerRes] = await Promise.all([
                api.get('/reportes/productos-mas-vendidos?limit=10'),
                api.get('/reportes/stock-bajo'),
                api.get('/reportes/productos-vencimiento?dias=30')
            ]);
            setProductosVendidos(prodRes.data || []);
            setStockBajo(stockRes.data || []);
            setPorVencer(vencerRes.data || []);
        } catch (error) {
            toast.error('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await api.get('/reportes/exportar-csv', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Reporte exportado exitosamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al exportar reporte');
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val || 0);

    const getStockPercent = (actual, minimo) => {
        if (!minimo || minimo === 0) return 100;
        const pct = (actual / (minimo * 2)) * 100;
        return Math.min(pct, 100);
    };

    const getStockColor = (actual, minimo) => {
        if (actual === 0) return 'var(--rose)';
        if (actual <= minimo) return 'var(--amber)';
        return 'var(--success)';
    };

    // Chart para top productos
    const topProductosChartData = {
        labels: productosVendidos.slice(0, 8).map(p =>
            p.nombre?.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre
        ),
        datasets: [{
            label: 'Unidades vendidas',
            data: productosVendidos.slice(0, 8).map(p => parseInt(p.cantidad_vendida) || 0),
            backgroundColor: (ctx) => {
                const colors = [
                    'rgba(14, 165, 233, 0.8)', 'rgba(16, 185, 129, 0.8)',
                    'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)',
                    'rgba(244, 63, 94, 0.8)', 'rgba(6, 182, 212, 0.8)',
                    'rgba(52, 211, 153, 0.8)', 'rgba(167, 139, 250, 0.8)',
                ];
                return colors[ctx.dataIndex % colors.length];
            },
            borderRadius: 8,
            borderSkipped: false,
        }]
    };

    const chartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                padding: 12,
                cornerRadius: 10,
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 11 }, color: '#94a3b8' },
                border: { display: false }
            },
            y: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#64748b', fontWeight: '500' },
                border: { display: false }
            }
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <span>Generando reportes...</span>
            </div>
        );
    }

    return (
        <div className="reportes-page fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FiBarChart2 /> Reportes & Análisis</h1>
                    <p className="page-subtitle">Analiza el rendimiento de tu botica</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline" onClick={fetchReportes}>
                        <FiRefreshCw /> Actualizar
                    </button>
                    <button className="btn btn-outline-primary" onClick={handleExportCSV}>
                        <FiDownload /> Exportar Ventas
                    </button>
                </div>
            </div>

            {/* Alertas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    {
                        label: 'Productos Top 10',
                        value: productosVendidos.length,
                        color: 'var(--primary)',
                        bg: 'rgba(14, 165, 233, 0.08)',
                        icon: <FiAward />
                    },
                    {
                        label: 'Stock Bajo Crítico',
                        value: stockBajo.filter(p => p.stock_actual === 0).length,
                        color: 'var(--rose)',
                        bg: 'rgba(244, 63, 94, 0.08)',
                        icon: <FiAlertCircle />
                    },
                    {
                        label: 'Stock Bajo Total',
                        value: stockBajo.length,
                        color: 'var(--amber)',
                        bg: 'rgba(245, 158, 11, 0.08)',
                        icon: <FiAlertTriangle />
                    },
                    {
                        label: 'Próx. a Vencer',
                        value: porVencer.length,
                        color: 'var(--accent)',
                        bg: 'rgba(139, 92, 246, 0.08)',
                        icon: <FiClock />
                    },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--white)',
                        border: '1px solid var(--gray-100)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-xs)'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: item.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.color, fontSize: '1.3rem', flexShrink: 0
                        }}>
                            {item.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gray-900)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Productos (Gráfica + Tabla) */}
            <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><FiAward /> Top Productos Vendidos</h3>
                        <span className="badge badge-info">Top {productosVendidos.length}</span>
                    </div>
                    <div style={{ height: '280px' }}>
                        {productosVendidos.length > 0 ? (
                            <Bar data={topProductosChartData} options={chartOptions} />
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><FiBarChart2 /></div>
                                <p className="empty-state-title">Sin datos de ventas</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                        <h3 className="card-title"><FiDollarSign /> Ranking de Ventas</h3>
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {productosVendidos.length > 0 ? (
                            productosVendidos.map((producto, i) => (
                                <div key={producto.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.875rem 1.5rem',
                                    borderBottom: '1px solid var(--gray-50)',
                                    transition: 'background 0.15s ease'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '28px', height: '28px',
                                        borderRadius: '8px',
                                        background: i < 3 ? 'var(--gradient-primary)' : 'var(--gray-100)',
                                        color: i < 3 ? 'white' : 'var(--gray-500)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.8rem', fontWeight: '800', flexShrink: 0,
                                        fontFamily: 'Outfit, sans-serif'
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {producto.nombre}
                                        </div>
                                        <div style={{ fontSize: '0.775rem', color: 'var(--gray-400)' }}>
                                            {producto.cantidad_vendida} unidades
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                                            {formatCurrency(producto.total_ventas)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem' }}>
                                <p className="empty-state-title">Sin ventas registradas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stock Bajo */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title"><FiPackage /> Productos con Stock Bajo</h3>
                    {stockBajo.length > 0 && (
                        <span className="badge badge-warning">{stockBajo.length} productos</span>
                    )}
                </div>
                {stockBajo.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stockBajo.map((producto) => {
                            const pct = getStockPercent(producto.stock_actual, producto.stock_minimo);
                            const color = getStockColor(producto.stock_actual, producto.stock_minimo);
                            return (
                                <div key={producto.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--gray-100)'
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{producto.nombre}</span>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                                                    Mín: <strong>{producto.stock_minimo}</strong>
                                                </span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color }}>
                                                    Actual: {producto.stock_actual}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: color,
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                    <span className={`badge ${producto.stock_actual === 0 ? 'badge-danger' : 'badge-warning'}`} style={{ flexShrink: 0 }}>
                                        {producto.stock_actual === 0 ? 'Sin stock' : 'Stock bajo'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">✅</div>
                        <p className="empty-state-title">Todo el stock está en orden</p>
                        <p className="empty-state-text">No hay productos con stock bajo en este momento</p>
                    </div>
                )}
            </div>

            {/* Productos por vencer */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><FiClock /> Próximos a Vencer (30 días)</h3>
                    {porVencer.length > 0 && (
                        <span className="badge badge-danger">{porVencer.length} lotes</span>
                    )}
                </div>
                {porVencer.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Nº Lote</th>
                                    <th>Cantidad</th>
                                    <th>Vencimiento</th>
                                    <th>Días Restantes</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {porVencer
                                    .sort((a, b) => a.dias_restantes - b.dias_restantes)
                                    .map((lote) => (
                                        <tr key={lote.id}>
                                            <td><strong style={{ fontSize: '0.9rem' }}>{lote.producto_nombre}</strong></td>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {lote.numero_lote || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{lote.cantidad}</td>
                                            <td style={{ color: 'var(--gray-500)' }}>
                                                {new Date(lote.fecha_vencimiento).toLocaleDateString('es-PE', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td>
                                                <span className={`badge ${lote.dias_restantes <= 7 ? 'badge-danger' : lote.dias_restantes <= 15 ? 'badge-warning' : 'badge-info'}`}>
                                                    {lote.dias_restantes} días
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${lote.dias_restantes <= 7 ? 'badge-danger' : 'badge-warning'}`}>
                                                    {lote.dias_restantes <= 7 ? '⚠️ Urgente' : 'Atención'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <p className="empty-state-title">Sin vencimientos próximos</p>
                        <p className="empty-state-text">No hay lotes que vencen en los próximos 30 días</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reportes;
