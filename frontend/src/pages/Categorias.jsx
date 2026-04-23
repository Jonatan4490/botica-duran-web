import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiGrid, FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiChevronDown, FiChevronRight, FiBox } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState(null);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);
    const [productosPorCategoria, setProductosPorCategoria] = useState({});
    const [loadingProductos, setLoadingProductos] = useState(false);
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

    const toggleExpandCategory = async (catId) => {
        if (expandedCategoryId === catId) {
            setExpandedCategoryId(null);
            return;
        }

        setExpandedCategoryId(catId);
        
        // Cargar productos si aún no están en el estado
        if (!productosPorCategoria[catId]) {
            try {
                setLoadingProductos(true);
                const res = await api.get(`/productos?categoria=${catId}&activo=true`);
                setProductosPorCategoria(prev => ({
                    ...prev,
                    [catId]: res.data
                }));
            } catch (error) {
                toast.error('Error al cargar productos de la categoría');
            } finally {
                setLoadingProductos(false);
            }
        }
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
                                <React.Fragment key={cat.id}>
                                    <tr 
                                        onClick={() => toggleExpandCategory(cat.id)}
                                        style={{ 
                                            cursor: 'pointer',
                                            background: expandedCategoryId === cat.id ? 'var(--gray-50)' : 'transparent',
                                            transition: 'var(--transition-fast)'
                                        }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {expandedCategoryId === cat.id ? 
                                                    <FiChevronDown className="text-primary" /> : 
                                                    <FiChevronRight className="text-muted" />
                                                }
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong>{cat.nombre}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                        {cat.total_productos || 0} medicamentos registrados
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'middle' }}>{cat.descripcion || '-'}</td>
                                        <td onClick={(e) => e.stopPropagation()}>
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

                                    {/* Sub-tabla desplegable de productos */}
                                    {expandedCategoryId === cat.id && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '0', border: 'none' }}>
                                                <div className="productos-expanded" style={{ 
                                                    padding: '1.5rem', 
                                                    background: 'var(--white)',
                                                    borderBottom: '2px solid var(--gray-100)',
                                                    animation: 'slideInUp 0.3s ease-out'
                                                }}>
                                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                                        <FiBox /> Productos en la categoría: {cat.nombre}
                                                    </h4>
                                                    
                                                    {loadingProductos ? (
                                                        <div className="text-center py-4">
                                                            <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto' }}></div>
                                                        </div>
                                                    ) : productosPorCategoria[cat.id]?.length > 0 ? (
                                                        <div className="grid grid-3" style={{ gap: '1rem' }}>
                                                            {productosPorCategoria[cat.id].map(prod => (
                                                                <div key={prod.id} style={{
                                                                    padding: '0.75rem 1rem',
                                                                    background: 'var(--gray-50)',
                                                                    borderRadius: 'var(--radius-lg)',
                                                                    border: '1px solid var(--gray-200)',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '0.25rem',
                                                                    transition: 'var(--transition-fast)'
                                                                }}
                                                                className="summary-item"
                                                                >
                                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--gray-800)' }}>{prod.nombre}</strong>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                                                        <span className="text-muted">Stock: <span className={prod.stock_actual <= prod.stock_minimo ? 'text-danger' : 'text-success'}>{prod.stock_actual}</span></span>
                                                                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>S/. {parseFloat(prod.precio_venta).toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-5 text-muted" style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                                            No hay productos registrados en esta categoría
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
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
