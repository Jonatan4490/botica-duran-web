import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiHome,
    FiPackage,
    FiGrid,
    FiShoppingCart,
    FiUsers,
    FiTruck,
    FiShoppingBag,
    FiBarChart2,
    FiLogOut,
    FiMenu,
    FiX,
    FiSettings,
    FiActivity,
    FiBell,
    FiSun,
    FiMoon
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Sidebar.css';

const Sidebar = ({ mobileOpen, setMobileOpen, theme, toggleTheme }) => {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const [alertCount, setAlertCount] = useState(0);

    // Cerrar sidebar al cambiar de ruta en móvil
    useEffect(() => {
        if (mobileOpen) {
            setMobileOpen(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                const count = (res.data?.stock_bajo || 0) + (res.data?.proximos_vencer || 0);
                setAlertCount(count);
            } catch {}
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10 * 60 * 1000); // cada 10 min
        return () => clearInterval(interval);
    }, []);

    const navSections = [
        {
            label: 'Principal',
            items: [
                { path: '/', icon: <FiHome />, label: 'Dashboard', exact: true },
                { path: '/ventas/nueva', icon: <FiShoppingCart />, label: 'Nueva Venta' },
            ]
        },
        {
            label: 'Inventario',
            items: [
                { path: '/productos', icon: <FiPackage />, label: 'Productos' },
                { path: '/categorias', icon: <FiGrid />, label: 'Categorías' },
            ]
        },
        {
            label: 'Gestión',
            items: [
                { path: '/ventas', icon: <FiShoppingBag />, label: 'Ventas' },
                { path: '/compras', icon: <FiTruck />, label: 'Compras' },
                { path: '/clientes', icon: <FiUsers />, label: 'Clientes' },
                { path: '/proveedores', icon: <FiActivity />, label: 'Proveedores' },
            ]
        },
        {
            label: 'Análisis',
            items: [
                { path: '/reportes', icon: <FiBarChart2 />, label: 'Reportes', badge: alertCount > 0 ? alertCount : null },
            ]
        },
        {
            label: 'Sistema',
            items: [
                { path: '/configuracion', icon: <FiSettings />, label: 'Configuración' },
            ]
        }
    ];

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const getUserInitials = (nombre) => {
        if (!nombre) return 'U';
        const parts = nombre.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return nombre.charAt(0).toUpperCase();
    };

    return (
        <>
            {/* Overlay para móvil */}
            {mobileOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Header / Brand */}
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-logo">💊</div>
                        {(!collapsed || mobileOpen) && (
                            <div className="brand-text">
                                <h3>Botica Duran</h3>
                                <p>Sistema Pro</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Botón X para cerrar en móvil */}
                    <button 
                        className="sidebar-close-mobile"
                        onClick={() => setMobileOpen(false)}
                    >
                        <FiX />
                    </button>

                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expandir menú' : 'Contraer menú'}
                    >
                        {collapsed ? <FiMenu /> : <FiX />}
                    </button>
                </div>

                {/* User Info */}
                <div className="sidebar-user">
                    <div className="user-avatar">
                        {getUserInitials(user?.nombre)}
                        <div className="user-online-dot" />
                    </div>
                    {(!collapsed || mobileOpen) && (
                        <div className="user-info">
                            <p className="user-name">{user?.nombre || 'Administrador'}</p>
                            <p className="user-role">Administrador</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navSections.map((section) => (
                        <div key={section.label}>
                            {(!collapsed || mobileOpen) && (
                                <div className="nav-section">
                                    <span className="nav-section-label">{section.label}</span>
                                </div>
                            )}
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive: navActive }) =>
                                        `nav-item ${navActive ? 'active' : ''}`
                                    }
                                    title={collapsed ? item.label : ''}
                                    end={item.exact}
                                >
                                    <span className="nav-icon" style={{ position: 'relative' }}>
                                        {item.icon}
                                        {item.badge && (
                                            <span style={{
                                                position: 'absolute', top: '-6px', right: '-8px',
                                                background: '#f43f5e', color: 'white',
                                                fontSize: '0.6rem', fontWeight: '800',
                                                width: '16px', height: '16px',
                                                borderRadius: '50%', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                lineHeight: 1
                                            }}>
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </span>
                                    {(!collapsed || mobileOpen) && <span className="nav-label">{item.label}</span>}
                                    {(!collapsed || mobileOpen) && item.badge && (
                                        <span style={{
                                            marginLeft: 'auto', background: '#f43f5e', color: 'white',
                                            fontSize: '0.65rem', fontWeight: '700',
                                            padding: '2px 6px', borderRadius: '20px'
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    title={collapsed ? (theme === 'light' ? 'Modo Oscuro' : 'Modo Claro') : ''}
                >
                    {theme === 'light' ? <FiMoon /> : <FiSun />}
                    {(!collapsed || mobileOpen) && <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>}
                </button>
                <div style={{ marginBottom: '0.5rem' }} />
                <button
                    className="logout-btn"
                    onClick={logout}
                    title={collapsed ? 'Cerrar Sesión' : ''}
                >
                    <FiLogOut />
                    {(!collapsed || mobileOpen) && <span>Cerrar Sesión</span>}
                </button>
            </div>
            </aside>
        </>
    );
};

export default Sidebar;
