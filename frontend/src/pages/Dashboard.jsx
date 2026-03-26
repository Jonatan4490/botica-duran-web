import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    FiDollarSign, FiShoppingCart, FiPackage, FiAlertTriangle,
    FiTrendingUp, FiUsers, FiRefreshCw, FiArrowUpRight,
    FiArrowDownRight, FiClock, FiCheckCircle, FiAlertCircle,
    FiShoppingBag, FiBarChart2, FiActivity
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [ventasRecientes, setVentasRecientes] = useState([]);
    const [graficaData, setGraficaData] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [topProductosHoy, setTopProductosHoy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [statsRes, ventasRes, graficaRes, metodosRes, topRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/ventas-recientes'),
                api.get('/dashboard/graficas-ventas').catch(() => ({ data: [] })),
                api.get('/dashboard/metodos-pago').catch(() => ({ data: [] })),
                api.get('/dashboard/top-productos-hoy').catch(() => ({ data: [] }))
            ]);
            setStats(statsRes.data);
            setVentasRecientes(ventasRes.data);
            setGraficaData(graficaRes.data || []);
            setMetodosPago(metodosRes.data || []);
            setTopProductosHoy(topRes.data || []);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            toast.error('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleString('es-PE', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const formatLastUpdate = () =>
        lastUpdate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    // === CHART DATA ===
    const lineChartData = {
        labels: graficaData.length > 0
            ? graficaData.map(d => {
                const date = new Date(d.fecha);
                return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
            })
            : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
            {
                label: 'Ventas (S/.)',
                data: graficaData.length > 0
                    ? graficaData.map(d => parseFloat(d.total_ventas) || 0)
                    : [0, 0, 0, 0, 0, 0, 0],
                fill: true,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.08)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#0ea5e9',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.4,
            },
            {
                label: 'Ganancias (S/.)',
                data: graficaData.length > 0
                    ? graficaData.map(d => parseFloat(d.ganancia) || 0)
                    : [0, 0, 0, 0, 0, 0, 0],
                fill: true,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.06)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.4,
            }
        ]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: { size: 12, family: 'Inter', weight: '600' },
                    color: '#64748b'
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: S/. ${ctx.raw.toFixed(2)}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, family: 'Inter' }, color: '#94a3b8' },
                border: { display: false }
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                ticks: {
                    font: { size: 11, family: 'Inter' },
                    color: '#94a3b8',
                    callback: (v) => 'S/.' + v
                },
                border: { display: false }
            }
        },
        interaction: { mode: 'index', intersect: false }
    };

    const barChartData = {
        labels: graficaData.length > 0
            ? graficaData.map(d => new Date(d.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }))
            : ['Sin datos'],
        datasets: [{
            label: 'Nº Ventas',
            data: graficaData.length > 0
                ? graficaData.map(d => parseInt(d.cantidad_ventas) || 0)
                : [0],
            backgroundColor: (ctx) => {
                const chart = ctx.chart;
                const { ctx: chartCtx, chartArea } = chart;
                if (!chartArea) return 'rgba(139, 92, 246, 0.7)';
                const g = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                g.addColorStop(0, 'rgba(139, 92, 246, 0.85)');
                g.addColorStop(1, 'rgba(139, 92, 246, 0.2)');
                return g;
            },
            borderRadius: 8,
            borderSkipped: false,
            borderColor: 'rgba(139, 92, 246, 0.6)',
            borderWidth: 1
        }]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, family: 'Inter' }, color: '#94a3b8' },
                border: { display: false }
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 11, family: 'Inter' }, color: '#94a3b8', stepSize: 1 },
                border: { display: false }
            }
        }
    };

    // === DOUGHNUT METODOS PAGO (datos reales) ===
    const PAGO_COLORS = {
        'Efectivo': '#10b981',
        'Yape': '#0ea5e9',
        'Plin': '#06b6d4',
        'Tarjeta': '#8b5cf6',
        'Transferencia': '#f59e0b'
    };
    const doughnutData = metodosPago.length > 0 ? {
        labels: metodosPago.map(m => m.metodo_pago),
        datasets: [{
            data: metodosPago.map(m => parseFloat(m.monto) || 0),
            backgroundColor: metodosPago.map(m => PAGO_COLORS[m.metodo_pago] || '#94a3b8'),
            borderWidth: 0,
            hoverOffset: 6
        }]
    } : {
        labels: ['Sin ventas este mes'],
        datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 16, font: { size: 11, family: 'Inter' }, color: '#64748b' }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                padding: 12,
                cornerRadius: 10,
            }
        },
        cutout: '65%'
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <span>Cargando dashboard...</span>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Ventas Hoy',
            value: formatCurrency(stats?.ventas_hoy?.monto),
            footer: `${stats?.ventas_hoy?.cantidad || 0} transacciones`,
            icon: <FiDollarSign />,
            variant: 'primary',
            trend: 'up'
        },
        {
            label: 'Ganancia Hoy',
            value: formatCurrency(stats?.ganancia_hoy),
            footer: `Mes: ${formatCurrency(stats?.ganancia_mes)}`,
            icon: <FiTrendingUp />,
            variant: 'success',
            trend: 'up'
        },
        {
            label: 'Ventas del Mes',
            value: formatCurrency(stats?.ventas_mes?.monto),
            footer: `${stats?.ventas_mes?.cantidad || 0} ventas totales`,
            icon: <FiShoppingBag />,
            variant: 'accent',
            trend: 'up'
        },
        {
            label: 'Total Productos',
            value: stats?.total_productos || 0,
            footer: `${stats?.total_clientes || 0} clientes registrados`,
            icon: <FiPackage />,
            variant: 'success',
        },
        {
            label: 'Stock Bajo',
            value: stats?.stock_bajo || 0,
            footer: 'Requieren reposición',
            icon: <FiAlertTriangle />,
            variant: 'warning',
            alert: (stats?.stock_bajo || 0) > 0
        },
        {
            label: 'Próx. Vencer',
            value: stats?.proximos_vencer || 0,
            footer: 'En los próximos 30 días',
            icon: <FiAlertCircle />,
            variant: 'danger',
            alert: (stats?.proximos_vencer || 0) > 0
        }
    ];

    const getPaymentBadge = (metodo) => {
        const map = {
            'Efectivo': 'badge-success',
            'Yape': 'badge-info',
            'Plin': 'badge-info',
            'Tarjeta': 'badge-accent',
            'Transferencia': 'badge-warning',
        };
        return map[metodo] || 'badge-gray';
    };

    return (
        <div className="dashboard fade-in">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <FiActivity /> Dashboard
                    </h1>
                    <p className="page-subtitle">
                        Resumen de tu botica · Actualizado a las {formatLastUpdate()}
                    </p>
                </div>
                <div className="page-actions">
                    <button
                        className="btn btn-outline"
                        onClick={() => fetchDashboardData(true)}
                        disabled={refreshing}
                        style={{ gap: '6px' }}
                    >
                        <FiRefreshCw style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                    <a href="/ventas/nueva" className="btn btn-primary">
                        <FiShoppingCart /> Nueva Venta
                    </a>
                </div>
            </div>

            {/* Alertas si hay stock bajo o vencimientos */}
            {((stats?.stock_bajo || 0) > 0 || (stats?.proximos_vencer || 0) > 0) && (
                <div className="dash-alerts" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {(stats?.stock_bajo || 0) > 0 && (
                        <div className="alert alert-warning" style={{ flex: 1, minWidth: '250px' }}>
                            <FiAlertTriangle />
                            <span><strong>{stats.stock_bajo} productos</strong> con stock bajo requieren reposición</span>
                        </div>
                    )}
                    {(stats?.proximos_vencer || 0) > 0 && (
                        <div className="alert alert-danger" style={{ flex: 1, minWidth: '250px' }}>
                            <FiAlertCircle />
                            <span><strong>{stats.proximos_vencer} lotes</strong> vencen en los próximos 30 días</span>
                        </div>
                    )}
                </div>
            )}

            {/* Stat Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {statCards.map((card, i) => (
                    <div key={i} className={`stat-card ${card.variant}`} style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="stat-header">
                            <div className={`stat-icon ${card.variant}`}>{card.icon}</div>
                            {card.trend && (
                                <div className={`stat-trend ${card.trend}`}>
                                    {card.trend === 'up' ? <FiArrowUpRight /> : <FiArrowDownRight />}
                                </div>
                            )}
                        </div>
                        <div className="stat-label">{card.label}</div>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-footer">{card.footer}</div>
                    </div>
                ))}
            </div>

            {/* Gráficas */}
            <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="card-header" style={{ marginBottom: '1rem' }}>
                        <h3 className="card-title">
                            <FiTrendingUp /> Ventas y Ganancias (7 días)
                        </h3>
                    </div>
                    <div style={{ height: '230px' }}>
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>

                <div className="grid" style={{ gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div className="card-header" style={{ marginBottom: '1rem' }}>
                            <h3 className="card-title">
                                <FiBarChart2 /> Transacciones Diarias
                            </h3>
                        </div>
                        <div style={{ height: '160px' }}>
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                            <h3 className="card-title">
                                <FiDollarSign /> Métodos de Pago
                            </h3>
                        </div>
                        <div style={{ height: '140px' }}>
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen rápido + Ventas recientes */}
            <div className="grid grid-2">
                {/* Resumen */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <FiBarChart2 /> Resumen del Mes
                        </h3>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="summary-list">
                        <div className="summary-item">
                            <span className="summary-label">Total Ventas</span>
                            <span className="summary-value">{stats?.ventas_mes?.cantidad || 0}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Ingresos</span>
                            <span className="summary-value text-primary">{formatCurrency(stats?.ventas_mes?.monto)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Ganancias</span>
                            <span className="summary-value text-success">{formatCurrency(stats?.ganancia_mes)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Productos</span>
                            <span className="summary-value">{stats?.total_productos || 0}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Clientes Activos</span>
                            <span className="summary-value">{stats?.total_clientes || 0}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Alertas Total</span>
                            <span className="summary-value text-warning">
                                {(stats?.stock_bajo || 0) + (stats?.proximos_vencer || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ventas Recientes */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <FiClock /> Últimas Ventas
                        </h3>
                        <a href="/ventas" className="btn btn-sm btn-outline-primary">
                            Ver todas
                        </a>
                    </div>

                    {ventasRecientes.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {ventasRecientes.slice(0, 6).map((venta) => (
                                <div
                                    key={venta.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--gray-50)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--gray-100)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.08))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--primary)', fontSize: '1rem', flexShrink: 0
                                        }}>
                                            <FiShoppingCart />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                                                {venta.numero_ticket}
                                            </div>
                                            <div style={{ fontSize: '0.775rem', color: 'var(--gray-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {venta.cliente_nombre || 'Público general'} · {formatDate(venta.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                                            {formatCurrency(venta.total)}
                                        </div>
                                        <span className={`badge ${getPaymentBadge(venta.metodo_pago)}`} style={{ fontSize: '0.7rem' }}>
                                            {venta.metodo_pago}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon"><FiShoppingCart /></div>
                            <p className="empty-state-title">No hay ventas aún</p>
                            <p className="empty-state-text">Las ventas aparecerán aquí una vez registradas</p>
                            <a href="/ventas/nueva" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                                Registrar primera venta
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* TOP PRODUCTOS HOY */}
            {topProductosHoy.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">
                            <FiActivity /> Top Productos del Día
                        </h3>
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Hoy</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {topProductosHoy.map((p, i) => (
                            <div key={i} style={{
                                flex: '1', minWidth: '160px',
                                background: 'var(--gray-50)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem',
                                border: '1px solid var(--gray-100)',
                                display: 'flex', alignItems: 'center', gap: '0.75rem'
                            }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    background: i === 0 ? 'var(--gradient-primary)' : i === 1 ? 'var(--gradient-success)' : 'var(--gradient-violet)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.85rem', fontWeight: '800', flexShrink: 0
                                }}>{i + 1}</div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--gray-800)' }}>
                                        {p.nombre?.length > 20 ? p.nombre.substring(0, 20) + '...' : p.nombre}
                                    </div>
                                    <div style={{ fontSize: '0.775rem', color: 'var(--gray-400)' }}>
                                        {p.unidades} unid. · {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(p.monto || 0)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
