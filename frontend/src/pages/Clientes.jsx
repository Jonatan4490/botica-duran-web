import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiSearch, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        dni: '',
        telefono: '',
        email: '',
        direccion: ''
    });

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/clientes?activo=true');
            setClientes(response.data);
        } catch (error) {
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cliente = null) => {
        if (cliente) {
            setEditingCliente(cliente);
            setFormData({
                nombre: cliente.nombre,
                dni: cliente.dni || '',
                telefono: cliente.telefono || '',
                email: cliente.email || '',
                direccion: cliente.direccion || ''
            });
        } else {
            setEditingCliente(null);
            setFormData({
                nombre: '',
                dni: '',
                telefono: '',
                email: '',
                direccion: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCliente(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await api.put(`/clientes/${editingCliente.id}`, formData);
                toast.success('Cliente actualizado');
            } else {
                await api.post('/clientes', formData);
                toast.success('Cliente registrado');
            }
            fetchClientes();
            handleCloseModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al guardar cliente');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Desactivar este cliente?')) {
            try {
                await api.put(`/clientes/${id}`, { activo: false });
                toast.success('Cliente desactivado');
                fetchClientes();
            } catch (error) {
                toast.error('Error al desactivar cliente');
            }
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (c.dni && c.dni.includes(search))
    );

    if (loading && clientes.length === 0) {
        return <div className="loading"><div className="spinner" /><span>Cargando clientes...</span></div>;
    }

    return (
        <div className="clientes-page fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FiUsers /> Clientes</h1>
                    <p className="page-subtitle">{clientes.length} clientes registrados</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <FiPlus /> Nuevo Cliente
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
                        placeholder="Buscar por nombre o DNI..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        <strong style={{ color: 'var(--gray-800)' }}>{filteredClientes.length}</strong> clientes encontrados
                    </span>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>DNI</th>
                                <th>Contacto</th>
                                <th>Email</th>
                                <th>Puntos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClientes.map((cliente) => (
                                <tr key={cliente.id}>
                                    <td><strong>{cliente.nombre}</strong></td>
                                    <td>{cliente.dni || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{cliente.telefono || '-'}</span>
                                            <small style={{ color: 'var(--gray-500)' }}>{cliente.direccion || '-'}</small>
                                        </div>
                                    </td>
                                    <td>{cliente.email || '-'}</td>
                                    <td>
                                        <span className="badge badge-success">
                                            {cliente.puntos_fidelidad} pts
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                title="Editar"
                                                onClick={() => handleOpenModal(cliente)}
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                title="Eliminar"
                                                onClick={() => handleDelete(cliente.id)}
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

                {filteredClientes.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon"><FiUsers /></div>
                        <p className="empty-state-title">{search ? 'Sin resultados' : 'No hay clientes registrados'}</p>
                        <p className="empty-state-text">{search ? 'Prueba con otro nombre o DNI' : 'Registra tu primer cliente'}</p>
                        {!search && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()} style={{ marginTop: '1rem' }}>
                                <FiPlus /> Nuevo Cliente
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Cliente */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingCliente ? <><FiEdit /> Editar Cliente</> : <><FiPlus /> Nuevo Cliente</>}
                            </h2>
                            <button className="btn-close" onClick={handleCloseModal}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Nombre Completo</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        className="form-control"
                                        required
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">DNI</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            className="form-control"
                                            maxLength="8"
                                            value={formData.dni}
                                            onChange={handleChange}
                                            placeholder="8 dígitos"
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
                                            placeholder="Ej: 987654321"
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
                                        placeholder="ejemplo@correo.com"
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
                                        placeholder="Dirección del domicilio..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FiSave /> {editingCliente ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;
