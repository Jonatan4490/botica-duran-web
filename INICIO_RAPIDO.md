# ✅ Guía Rápida de Inicio

## Instalación Rápida (3 pasos)

### 1️⃣ Configurar MySQL
```sql
-- Abre MySQL Workbench y ejecuta:
-- File > Open SQL Script > backend/database/schema.sql
-- Presiona el botón Execute (⚡)
```

### 2️⃣ Instalar Backend
```bash
cd backend
npm install
npm run dev
```
✅ Deberías ver: "✅ Conexión a MySQL establecida correctamente"

### 3️⃣ Instalar Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```
✅ Se abrirá automáticamente en http://localhost:3000

## 🔐 Login
```
Usuario: admin
Contraseña: admin123
```

## ⚠️ Si hay problemas con MySQL

Verifica el archivo `backend/.env` y ajusta:
```env
DB_PASSWORD=TU_CONTRASEÑA_DE_MYSQL
```

---

**¡Listo!** Ya puedes empezar a usar tu sistema de farmacia 🎉
