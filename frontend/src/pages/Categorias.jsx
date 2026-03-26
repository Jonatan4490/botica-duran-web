import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiGrid, FiPlus, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            setLoading(true);
            const response = await api.get('/categorias?activo=true');
            setCategorias(response.data);
        } catch (error) {
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (categoria = null) => {
        if (categoria) {
            setEditingCategoria(categoria);
            setFormData({
                nombre: categoria.nombre,
                descripcion: categoria.descripcion || ''
            });
        } else {
            setEditingCategoria(null);
            setFormData({
                nombre: '',
                descripcion: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategoria(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategoria) {
                await api.put(`/categorias/${editingCategoria.id}`, formData);
                toast.success('Categoría actualizada');
            } else {
                await api.post('/categorias', formData);
                toast.success('Categoría creada');
            }
            fetchCategorias();
            handleCloseModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al guardar categoría');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Desactivar esta categoría?')) {
            try {
                await api.put(`/categorias/${id}`, { activo: false });
                toast.success('Categoría desactivada');
                fetchCategorias();
            } catch (error) {
                toast.error('Error al desactivar categoría');
            }
        }
    };

    if (loading && categorias.length === 0) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="categorias-page fade-in">
            <div className="card-header">
                <h1 className="card-title"><FiGrid /> Categorías de Productos</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <FiPlus /> Nueva Categoría
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorias.map((cat) => (
                                <tr key={cat.id}>
                                    <td><strong>{cat.nombre}</strong></td>
                                    <td>{cat.descripcion || '-'}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                title="Editar"
                                                onClick={() => handleOpenModal(cat)}
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                title="Eliminar"
                                                onClick={() => handleDelete(cat.id)}
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

                {categorias.length === 0 && (
                    <p className="text-center" style={{ padding: '2rem', color: 'var(--gray-500)' }}>
                        No hay categorías registradas
                    </p>
                )}
            </div>

            {/* Modal de Categoría */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingCategoria ? <><FiEdit /> Editar Categoría</> : <><FiPlus /> Nueva Categoría</>}
                            </h2>
                            <button className="btn-close" onClick={handleCloseModal}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Nombre de Categoría</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        className="form-control"
                                        required
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Antibióticos, Analgésicos..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        className="form-control"
                                        rows="3"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        placeholder="Descripción opcional..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <FiSave /> {editingCategoria ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categorias;
