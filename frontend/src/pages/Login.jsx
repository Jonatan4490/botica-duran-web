import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff, FiPackage, FiTrendingUp, FiShield, FiBarChart2 } from 'react-icons/fi';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ usuario: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(formData.usuario, formData.password);
        setLoading(false);
        if (result.success) navigate('/');
    };

    const features = [
        {
            icon: '📦',
            iconClass: 'blue',
            title: 'Control de Inventario',
            desc: 'Stock en tiempo real con alertas automáticas'
        },
        {
            icon: '💰',
            iconClass: 'green',
            title: 'Gestión de Ventas',
            desc: 'Registro rápido con múltiples formas de pago'
        },
        {
            icon: '📊',
            iconClass: 'purple',
            title: 'Reportes Avanzados',
            desc: 'Análisis de ganancias y tendencias de venta'
        },
        {
            icon: '🔒',
            iconClass: 'amber',
            title: 'Seguridad Total',
            desc: 'Acceso protegido y control de usuarios'
        }
    ];

    return (
        <div className="login-wrapper">
            {/* Panel Izquierdo */}
            <div className="login-left">
                <div className="login-left-bg">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
                <div className="login-left-content">
                    <div className="login-hero-icon">💊</div>
                    <h1 className="login-brand-name">Botica Duran</h1>
                    <p className="login-brand-subtitle">Sistema de Gestión Farmacéutica Profesional</p>

                    <div className="login-features">
                        {features.map((feature, i) => (
                            <div key={i} className="login-feature-item">
                                <div className={`feature-icon ${feature.iconClass}`}>
                                    {feature.icon}
                                </div>
                                <div className="feature-text">
                                    <h4>{feature.title}</h4>
                                    <p>{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Panel Derecho - Formulario */}
            <div className="login-right">
                <div className="login-form-container">
                    <div className="login-form-header">
                        <h2>Bienvenido 👋</h2>
                        <p>Ingresa tus credenciales para acceder al sistema</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="login-form-group">
                            <label className="login-form-label">
                                <FiUser /> Usuario
                            </label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon"><FiUser /></span>
                                <input
                                    type="text"
                                    name="usuario"
                                    className="login-input"
                                    placeholder="Ingresa tu usuario"
                                    value={formData.usuario}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="login-form-group">
                            <label className="login-form-label">
                                <FiLock /> Contraseña
                            </label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon"><FiLock /></span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="login-input"
                                    placeholder="Ingresa tu contraseña"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="login-input-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="login-btn-spinner" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <FiLogIn />
                                    Iniciar Sesión
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-divider" />

                    <div className="login-info-box">
                        <strong>🔑 Credenciales por defecto</strong>
                        <div className="cred-row">
                            <span>Usuario:</span>
                            <code>admin</code>
                        </div>
                        <div className="cred-row">
                            <span>Contraseña:</span>
                            <code>admin123</code>
                        </div>
                    </div>

                    <p className="login-footer-text">
                        © 2025 Botica Duran · Sistema de Gestión Pro
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
