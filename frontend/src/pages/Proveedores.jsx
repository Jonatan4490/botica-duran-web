import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiTruck, FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Proveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        ruc: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: ''
    });

    useEffect(() => {
        fetchProveedores();
    }, []);

    const fetchProveedores = async () => {
        try {
            setLoading(true);
            const response = await api.get('/proveedores?activo=true');
            setProveedores(response.data);
        } catch (error) {
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (proveedor = null) => {
        if (proveedor) {
            setEditingProveedor(proveedor);
            setFormData({
                nombre: proveedor.nombre,
                ruc: proveedor.ruc || '',
                contacto: proveedor.contacto || '',
                telefono: proveedor.telefono || '',
                email: proveedor.email || '',
                direccion: proveedor.direccion || ''
            });
        } else {
            setEditingProveedor(null);
            setFormData({
                nombre: '',
                ruc: '',
                contacto: '',
                telefono: '',
                email: '',
                direccion: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProveedor(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProveedor) {
                await api.put(`/proveedores/${editingProveedor.id}`, formData);
                toast.success('Proveedor actualizado');
            } else {
                await api.post('/proveedores', formData);
                toast.success('Proveedor registrado');
            }
            fetchProveedores();
            handleCloseModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al guardar proveedor');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Desactivar este proveedor?')) {
            try {
                await api.put(`/proveedores/${id}`, { activo: false });
                toast.success('Proveedor desactivado');
                fetchProveedores();
            } catch (error) {
                toast.error('Error al desactivar proveedor');
            }
        }
    };

    const filteredProveedores = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.ruc && p.ruc.includes(search))
    );

    if (loading && proveedores.length === 0) {
        return <div className="loading"><div className="spinner" /><span>Cargando proveedores...</span></div>;
    }

    return (
        <div className="proveedores-page fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FiTruck /> Proveedores</h1>
                    <p className="page-subtitle">{proveedores.length} proveedores registrados</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <FiPlus /> Nuevo Proveedor
                    </button>
                </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <FiSearch style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Buscar por nombre o RUC..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <strong style={{ color: 'var(--gray-800)' }}>{filteredProveedores.length}</strong> proveedores encontrados
                    </span>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre / RUC</th>
                                <th>Contacto</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProveedores.map((proveedor) => (
                                <tr key={proveedor.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <strong>{proveedor.nombre}</strong>
                                            <small style={{ color: 'var(--gray-500)' }}>RUC: {proveedor.ruc || '-'}</small>
                                        </div>
                                    </td>
                                    <td>{proveedor.contacto || '-'}</td>
                                    <td>{proveedor.telefono || '-'}</td>
                                    <td>{proveedor.email || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${proveedor.activo ? 'success' : 'danger'}`}>
                                            {proveedor.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                title="Editar"
                                                onClick={() => handleOpenModal(proveedor)}
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                title="Eliminar"
                                                onClick={() => handleDelete(proveedor.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProveedores.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon"><FiTruck /></div>
                        <p className="empty-state-title">{search ? 'Sin resultados' : 'No hay proveedores registrados'}</p>
                        <p className="empty-state-text">{search ? 'Prueba con otro nombre o RUC' : 'Registra tu primer proveedor'}</p>
                        {!search && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()} style={{ marginTop: '1rem' }}>
                                <FiPlus /> Nuevo Proveedor
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Proveedor */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingProveedor ? <><FiEdit /> Editar Proveedor</> : <><FiPlus /> Nuevo Proveedor</>}
                            </h2>
                            <button className="btn-close" onClick={handleCloseModal}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label required">Nombre / Razón Social</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            className="form-control"
                                            required
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            placeholder="Ej: Distribuidora Farmacéutica S.A."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">RUC</label>
                                        <input
                                            type="text"
                                            name="ruc"
                                            className="form-control"
                                            maxLength="11"
                                            value={formData.ruc}
                                            onChange={handleChange}
                                            placeholder="11 dígitos"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Persona de Contacto</label>
                                        <input
                                            type="text"
                                            name="contacto"
                                            className="form-control"
                                            value={formData.contacto}
                                            onChange={handleChange}
                                            placeholder="Nombre del vendedor"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            className="form-control"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            placeholder="987654321"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="contacto@proveedor.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Dirección</label>
                                    <textarea
                                        name="direccion"
                                        className="form-control"
                                        rows="2"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        placeholder="Dirección fiscal o de almacén..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FiSave /> {editingProveedor ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proveedores;
