# Recuperación de fotos — 24-11-2026

Autorización actual: copiar seis fotos del origen atjtjpchslxbseayzflz a ccvida lnkrojvyiwnlcoponxud, conservar fotos nuevas y eliminar solo los originales después de verificar. Excluido el archivo pastoral de prueba La fe. No eliminar usuarios ni otras tablas. Se conservan respaldo temporal privado y contenido del origen hasta confirmar cada copia.

El conector de Vercel devolvió valores secretos vacíos; no se concluye clave de producción inválida. Solución: action ejecutada en servidor con credenciales existentes, autorizada por sesión real de administrador activo. No exponer secretos, endpoint público sin autorización, login suplantado ni cambiar RLS.

Entrada: administrador → Centro de Análisis → Fotos anteriores → Recuperar fotos y retirar originales verificados. Función protegida también si se invoca directamente. Fuente antigua y destino nuevo fijos; comprueba proyecto del secreto fuente. Credencial CCVIDA queda asociada al destino por configuración existente.

El inventario solo lee avatars, profundidad y tamaño acotados. Seis contenidos autorizados por SHA256; no incluye personas/UUID/rutas privadas en Git. Copia bajo nombre recuperada-HASH.webp, sin sobrescribir fotos nuevas; hash de descarga destino idéntico antes de modificar referencia o borrar. Las URLs se cambian solo si siguen apuntando al archivo original exacto (CAS), conservando encuadre. Referencias de ccvida comprobadas antes de retirar originales. Si falla una operación, mantiene copias previas y reintenta; ninguna eliminación ocurre sin copia verificada. Cargas concurrentes/reintentos resuelven ruta determinista sin upsert.

Pruebas: cinco regresiones pertinentes (autorización, URL/encuadre, rechazo de contenido no aprobado, inventario fallido y copia/verificación antes de borrado conservando foto nueva), TypeScript/lint específico. Build y estado final de Preview se registran en PR/entrega. Falta ejecución con sesión administradora real; no afirmar datos recuperados antes de cotejar Storage y URLs.

Impacto: unas1.58MB añadidas al Storage destino antes de retirar del origen, no al tamaño de PostgreSQL en esa cantidad. Archivo pastoral20KB excluido. Retirar fotos no cambia el margen de datos bíblicos de forma significativa. Respaldos no aumentan cuotas ni sustituyen caché.

Reversión: retirar herramienta de recuperación; restaurar archivos originales desde las copias verificadas si fuera necesario y restaurar referencias con CAS. No se revierten ni sobrescriben fotos nuevas. Maestro, usuarios, políticas y producción intactos. No requiere migración SQL.

Sedes/mensajería: propuesta separada en rama agent/sedes-propuesta-20261124. No publicada ni aplicada. Santa Ana central; Chalchuapa sede; futuras sedes creadas por administración general; selector público no concede membresías. Audiencias actuales conservadas, filtros de sede/roles/personas y grupos guardados previstos. Requiere esquema/RLS exactos y aprobación antes de aplicar, no mera aprobación de este botón.
