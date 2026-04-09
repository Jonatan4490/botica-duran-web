import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import { FiMenu } from 'react-icons/fi';
import './pages/Pages.css';

// Layouts
import Sidebar from './components/Layout/Sidebar';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Ventas from './pages/Ventas';
import NuevaVenta from './pages/NuevaVenta';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Compras from './pages/Compras';
import NuevaCompra from './pages/NuevaCompra';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

// Componente de ruta protegida
const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    const { isAuthenticated } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <Router>
            <div className={`app ${mobileOpen ? 'sidebar-open' : ''}`}>
                {isAuthenticated && (
                    <>
                        <Sidebar 
                            mobileOpen={mobileOpen} 
                            setMobileOpen={setMobileOpen} 
                            theme={theme}
                            toggleTheme={toggleTheme}
                        />
                        <button 
                            className="mobile-toggle-btn" 
                            onClick={() => setMobileOpen(true)}
                        >
                            <FiMenu />
                        </button>
                    </>
                )}
                <div className={`main-content ${!isAuthenticated ? 'sidebar-collapsed' : ''}`}>
                    <Routes>
                        <Route path="/login" element={
                            isAuthenticated ? <Navigate to="/" replace /> : <Login />
                        } />

                        <Route path="/" element={
                            <PrivateRoute><Dashboard /></PrivateRoute>
                        } />

                        <Route path="/productos" element={
                            <PrivateRoute><Productos /></PrivateRoute>
                        } />

                        <Route path="/categorias" element={
                            <PrivateRoute><Categorias /></PrivateRoute>
                        } />

                        <Route path="/ventas" element={
                            <PrivateRoute><Ventas /></PrivateRoute>
                        } />

                        <Route path="/ventas/nueva" element={
                            <PrivateRoute><NuevaVenta /></PrivateRoute>
                        } />

                        <Route path="/clientes" element={
                            <PrivateRoute><Clientes /></PrivateRoute>
                        } />

                        <Route path="/proveedores" element={
                            <PrivateRoute><Proveedores /></PrivateRoute>
                        } />

                        <Route path="/compras" element={
                            <PrivateRoute><Compras /></PrivateRoute>
                        } />

                        <Route path="/compras/nueva" element={
                            <PrivateRoute><NuevaCompra /></PrivateRoute>
                        } />

                        <Route path="/reportes" element={
                            <PrivateRoute><Reportes /></PrivateRoute>
                        } />

                        <Route path="/configuracion" element={
                            <PrivateRoute><Configuracion /></PrivateRoute>
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover
                theme="light"
                toastStyle={{
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                }}
            />
        </Router>
    );
}

export default App;
