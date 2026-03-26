import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    FiSettings, FiPlus, FiX, FiSave, FiUser, FiShield,
    FiLock, FiRefreshCw, FiToggleLeft, FiToggleRight,
    FiCheckCircle, FiAlertCircle, FiInfo, FiServer
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Configuracion = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);

    // Form nuevo usuario
    const [newUserForm, setNewUserForm] = useState({
        nombre: '',
        usuario: '',
        password: '',
        rol: 'vendedor'
    });

    // Form cambio de contraseña
    const [pwdForm, setPwdForm] = useState({
        password_actual: '',
        password_nueva: '',
        password_confirmar: ''
    });
    const [savingPwd, setSavingPwd] = useState(false);

    useEffect(() => {
        if (activeTab === 'usuarios') fetchUsuarios();
        if (activeTab === 'sistema') fetchSystemInfo();
    }, [activeTab]);

    const fetchUsuarios = async () => {
        try {
            setLoadingUsers(true);
            const res = await api.get('/auth/usuarios');
            setUsuarios(res.data);
        } catch {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchSystemInfo = async () => {
        try {
            const res = await api.get('/health');
            setSystemInfo(res.data);
        } catch {
            setSystemInfo({ status: 'error', database: 'unknown' });
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (newUserForm.password.length < 6) {
            toast.warning('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        try {
            await api.post('/auth/usuarios', newUserForm);
            toast.success('Usuario creado exitosamente');
            setIsModalOpen(false);
            setNewUserForm({ nombre: '', usuario: '', password: '', rol: 'vendedor' });
            fetchUsuarios();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear usuario');
        }
    };

    const handleToggleUser = async (uid) => {
        if (uid === user.id) {
            toast.warning('No puedes desactivar tu propia cuenta');
            return;
        }
        try {
            await api.put(`/auth/usuarios/${uid}/toggle`);
            toast.success('Estado de usuario actualizado');
            fetchUsuarios();
        } catch {
            toast.error('Error al actualizar estado');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwdForm.password_nueva !== pwdForm.password_confirmar) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }
        if (pwdForm.password_nueva.length < 6) {
            toast.warning('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        setSavingPwd(true);
        try {
            await api.put('/auth/perfil/password', {
                password_actual: pwdForm.password_actual,
                password_nueva: pwdForm.password_nueva
            });
            toast.success('Contraseña cambiada exitosamente');
            setPwdForm({ password_actual: '', password_nueva: '', password_confirmar: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
        } finally {
            setSavingPwd(false);
        }
    };

    const tabs = [
        { id: 'usuarios', label: 'Gestión de Usuarios', icon: <FiUser /> },
        { id: 'seguridad', label: 'Seguridad', icon: <FiLock /> },
        { id: 'sistema', label: 'Sistema', icon: <FiServer /> },
    ];

    return (
        <div className="configuracion-page fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FiSettings /> Configuración</h1>
                    <p className="page-subtitle">Administra usuarios, seguridad y el sistema</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '1.5rem',
                background: 'var(--gray-100)', borderRadius: 'var(--radius-xl)',
                padding: '4px', width: 'fit-content'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '0.5rem 1.25rem', border: 'none', cursor: 'pointer',
                            borderRadius: 'var(--radius-lg)', fontSize: '0.875rem', fontWeight: '600',
                            transition: 'var(--transition-fast)',
                            background: activeTab === tab.id ? 'var(--white)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-500)',
                            boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* === TAB: USUARIOS === */}
            {activeTab === 'usuarios' && (
                <div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-100)'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--gray-800)' }}>
                                    <FiUser style={{ marginRight: '8px' }} />
                                    Usuarios del Sistema
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                                    {usuarios.length} usuarios registrados
                                </p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                <FiPlus /> Nuevo Usuario
                            </button>
                        </div>

                        {loadingUsers ? (
                            <div className="loading"><div className="spinner" /><span>Cargando usuarios...</span></div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Nombre</th>
                                            <th>Rol</th>
                                            <th>Último Acceso</th>
                                            <th>Estado</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuarios.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '50%',
                                                            background: u.rol === 'admin' ? 'var(--gradient-primary)' : 'var(--gradient-success)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'white', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0
                                                        }}>
                                                            {u.nombre?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>@{u.usuario}</div>
                                                            {u.id === user.id && (
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>Tú</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '500' }}>{u.nombre}</td>
                                                <td>
                                                    <span className={`badge ${u.rol === 'admin' ? 'badge-info' : 'badge-success'}`}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        {u.rol === 'admin' ? <FiShield style={{ fontSize: '0.7rem' }} /> : null}
                                                        {u.rol === 'admin' ? 'Administrador' : 'Vendedor'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                                    {u.ultimo_acceso
                                                        ? new Date(u.ultimo_acceso).toLocaleDateString('es-PE', {
                                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })
                                                        : 'Nunca'
                                                    }
                                                </td>
                                                <td>
                                                    <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                                                        {u.activo ? '● Activo' : '○ Inactivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${u.activo ? 'btn-outline' : 'btn-primary'}`}
                                                        onClick={() => handleToggleUser(u.id)}
                                                        disabled={u.id === user.id}
                                                        title={u.id === user.id ? 'No puedes desactivarte a ti mismo' : (u.activo ? 'Desactivar' : 'Activar')}
                                                    >
                                                        {u.activo ? <FiToggleRight /> : <FiToggleLeft />}
                                                        {u.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === TAB: SEGURIDAD === */}
            {activeTab === 'seguridad' && (
                <div style={{ maxWidth: '520px' }}>
                    <div className="card">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiLock style={{ color: 'var(--primary)' }} /> Cambiar Contraseña
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-400)' }}>
                                Cambia la contraseña de tu cuenta <strong>@{user?.usuario}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label className="form-label required">Contraseña Actual</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    required
                                    value={pwdForm.password_actual}
                                    onChange={e => setPwdForm({ ...pwdForm, password_actual: e.target.value })}
                                    placeholder="Tu contraseña actual"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    required
                                    value={pwdForm.password_nueva}
                                    onChange={e => setPwdForm({ ...pwdForm, password_nueva: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    required
                                    value={pwdForm.password_confirmar}
                                    onChange={e => setPwdForm({ ...pwdForm, password_confirmar: e.target.value })}
                                    placeholder="Repite la nueva contraseña"
                                />
                                {pwdForm.password_confirmar && pwdForm.password_nueva !== pwdForm.password_confirmar && (
                                    <small style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <FiAlertCircle /> Las contraseñas no coinciden
                                    </small>
                                )}
                                {pwdForm.password_confirmar && pwdForm.password_nueva === pwdForm.password_confirmar && (
                                    <small style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <FiCheckCircle /> Las contraseñas coinciden
                                    </small>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={savingPwd}
                                style={{ marginTop: '0.5rem' }}
                            >
                                {savingPwd ? <><FiRefreshCw className="spin" /> Guardando...</> : <><FiSave /> Cambiar Contraseña</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* === TAB: SISTEMA === */}
            {activeTab === 'sistema' && (
                <div style={{ maxWidth: '600px' }}>
                    <div className="card">
                        <h3 style={{ margin: '0 0 1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiInfo style={{ color: 'var(--primary)' }} /> Información del Sistema
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Sistema', value: 'Botica Duran Enterprise Pro' },
                                { label: 'Versión', value: systemInfo?.version || '2.0.0' },
                                { label: 'Entorno', value: systemInfo?.environment || 'development' },
                                {
                                    label: 'Base de Datos',
                                    value: systemInfo?.database || 'Verificando...',
                                    color: systemInfo?.database === 'connected' ? 'var(--success)' : 'var(--amber)'
                                },
                                { label: 'Usuario Conectado', value: `${user?.nombre} (@${user?.usuario})` },
                                { label: 'Rol', value: user?.rol === 'admin' ? 'Administrador' : 'Vendedor' },
                                {
                                    label: 'Última Actualización',
                                    value: new Date().toLocaleDateString('es-PE', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })
                                },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)'
                                }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: '500' }}>{item.label}</span>
                                    <span style={{
                                        fontSize: '0.875rem', fontWeight: '700',
                                        color: item.color || 'var(--gray-800)'
                                    }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn btn-outline w-full"
                            style={{ marginTop: '1.25rem' }}
                            onClick={fetchSystemInfo}
                        >
                            <FiRefreshCw /> Verificar Estado
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Nuevo Usuario */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title"><FiPlus /> Nuevo Usuario</h2>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={newUserForm.nombre}
                                        onChange={e => setNewUserForm({ ...newUserForm, nombre: e.target.value })}
                                        placeholder="Ej: María García"
                                    />
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label required">Nombre de Usuario</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            required
                                            value={newUserForm.usuario}
                                            onChange={e => setNewUserForm({ ...newUserForm, usuario: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                            placeholder="sin espacios"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Rol</label>
                                        <select
                                            className="form-control"
                                            value={newUserForm.rol}
                                            onChange={e => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                                        >
                                            <option value="vendedor">Vendedor</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">Contraseña Temporal</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        required
                                        value={newUserForm.password}
                                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <small style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                                        El usuario podrá cambiarla desde Configuración → Seguridad
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary"><FiSave /> Crear Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuracion;
