# FASE D — Registro de fuentes bíblicas

Fecha de cierre: 2026-07-31

Estado: **COMPLETADO Y VALIDADO EN PRODUCCIÓN**

## Objetivo

Crear una base verificable de metadatos, atribución y licencias antes de incorporar comentarios, contexto histórico o fragmentos al proceso de IA.

Este bloque no importa contenido completo y no modifica la Biblia general.

## Modelo de datos

Tabla: `public.biblical_sources`

Campos principales:

- `slug`: identificador estable y legible;
- `name`: nombre oficial de la fuente;
- `source_type`: catálogo, traducción, comentario, referencia cruzada, perfil o fuente histórica;
- `language`: idioma principal;
- `website`: sitio de origen;
- `license_url` y `license_notes`: licencia y condiciones relevantes;
- `license_status`: verificada, variable por recurso, pendiente o restringida;
- `provider` y `provider_ref`: proveedor y referencia dentro de su catálogo;
- `provider_version` y `content_hash`: versión o huella cuando existe;
- `attribution`: texto reutilizable de atribución;
- `review_status`: aprobada, pendiente o rechazada;
- `enabled`: controla si puede formar parte de la capa de evidencia;
- `metadata`: rutas de API, conteos y datos técnicos no sensibles;
- `approved_at` y `approved_by`: trazabilidad de aprobación.

## Seguridad

- RLS está habilitado.
- `anon` no tiene privilegios sobre la tabla.
- `authenticated` tiene únicamente `SELECT`.
- La política permite leer solo registros con `enabled = true` y `review_status = 'approved'`.
- La cuenta debe estar activa.
- No existen políticas de inserción, actualización o eliminación para clientes.
- Las altas y cambios iniciales se realizan mediante migraciones versionadas o una futura acción administrativa protegida.

### Matriz ejecutada en producción

La validación se ejecutó con una cuenta activa dentro de una transacción revertida:

1. La cuenta activa ve exactamente dos fuentes aprobadas. — CORRECTO
2. Las fuentes pendientes visibles son cero. — CORRECTO
3. Una cuenta `authenticated` no puede insertar fuentes. — CORRECTO
4. Una cuenta `authenticated` no puede modificar fuentes. — CORRECTO

Resultado: **4 de 4 comprobaciones correctas**. No quedaron registros de prueba ni cambios temporales.

El asesor de seguridad de Supabase no generó advertencias nuevas relacionadas con `biblical_sources`. Los avisos existentes corresponden a funciones, Storage y autenticación anteriores, fuera de este bloque.

## Fuentes iniciales

### Aprobadas y visibles

#### Free Use Bible API — Catálogo

- Tipo: catálogo de proveedor.
- Proveedor: HelloAO.
- Uso actual: metadatos de traducciones, comentarios y datasets.
- Licencia: cada recurso conserva su propia licencia.
- Contenido importado: no.

#### Bible Cross References

- Tipo: referencias cruzadas.
- Origen: OpenBible.info.
- Proveedor técnico: HelloAO.
- Licencia: CC BY 4.0.
- Nota: HelloAO adaptó el formato de los datos para su API.
- Cobertura registrada: 66 libros, 1,189 capítulos, 29,364 versículos y 344,799 referencias.
- Contenido importado: no.

### Registradas pero deshabilitadas

#### Adam Clarke Bible Commentary

- Licencia informada: Public Domain Mark 1.0.
- Estado: pendiente de revisión doctrinal.
- No aparece en la interfaz y no puede formar parte de la evidencia.

#### Tyndale Open Study Notes

- Licencia informada: CC BY-SA 4.0.
- Estado: pendiente de revisión doctrinal y de las obligaciones ShareAlike.
- No aparece en la interfaz y no puede formar parte de la evidencia.

## Servicio de lectura

Archivo: `lib/estudios/biblical-sources.ts`

Funciones:

- `listarFuentesBiblicasAprobadas()`;
- `obtenerFuenteBiblica(slug)`.

El servicio:

- se ejecuta exclusivamente en servidor;
- exige una sesión autenticada;
- consulta solo fuentes habilitadas y aprobadas;
- aplica además las restricciones de RLS;
- normaliza el resultado a un tipo estable;
- calcula una versión SHA-256 abreviada del conjunto aprobado;
- no consulta ninguna tabla de notas, bosquejos, biblioteca pastoral o paquetes.

## Atribución visible

Componente: `components/estudios/FuentesBiblicasAprobadas.tsx`

Ubicación: `/estudios/profundo`

Muestra:

- nombre y tipo de la fuente;
- proveedor;
- atribución;
- estado de licencia;
- idioma;
- versión del conjunto aprobado.

Registrar una fuente no significa que su contenido ya se envíe a la IA. La interfaz lo indica expresamente.

## Regla de privacidad

El futuro paquete de evidencia solo podrá incluir:

- referencia bíblica solicitada;
- texto bíblico seleccionado;
- traducciones elegidas;
- fragmentos de fuentes aprobadas;
- metadatos y atribuciones correspondientes.

Quedan excluidos por defecto:

- notas de Biblia en `localStorage`;
- notas privadas de Estudio Profundo;
- bosquejos;
- colecciones pastorales;
- biblioteca privada;
- paquetes y materiales no publicados;
- datos del perfil que no sean necesarios para autenticar y aplicar límites.

Una futura incorporación de contenido privado requerirá una acción explícita, explicación previa y confirmación de la persona.

## Fuentes oficiales consultadas

- Documentación y endpoints: `https://bible.helloao.org/docs/guide/getting-started.html`
- Referencia de API: `https://bible.helloao.org/docs/reference/`
- Catálogo de comentarios: `https://bible.helloao.org/api/available_commentaries.json`
- Catálogo de datasets: `https://bible.helloao.org/api/available_datasets.json`

## Validación final

- migración aplicada sin pérdida de datos; — CUMPLIDO
- cuatro registros iniciales presentes; — CUMPLIDO
- solo dos registros aprobados y habilitados; — CUMPLIDO
- `anon` sin acceso; — CUMPLIDO
- `authenticated` con lectura y sin escritura; — CUMPLIDO
- servicio compilado y validado por TypeScript; — CUMPLIDO
- catálogo visible en Estudio Profundo; — CUMPLIDO
- ausencia de nuevas advertencias de seguridad asociadas a `biblical_sources`; — CUMPLIDO

### Preview completo

- commit: `fe8eb9218ef378d122a21f3cd5526f224551f804`;
- deployment: `dpl_BHyb9dnF9UGFvcsq3N9BLRgUmdGq`;
- estado: `READY`;
- Next.js 16.2.10 compiló correctamente;
- TypeScript terminó sin errores;
- páginas generadas: 32 de 32;
- `/estudios/profundo` incluida en el resultado.

### Producción

- integración: PR #9;
- commit de `main`: `d33daca536549b912a4f9a9fb246e1060fb0ee77`;
- deployment: `dpl_DN5g5tLwJdhNLbkMngMsjUJJcn5V`;
- estado: `READY`;
- alias de producción asignados sin error;
- confirmación visual del panel de fuentes aprobadas: recibida el 2026-07-31.

## Conclusión

El Bloque 2 queda cerrado. El registro, las políticas, el servicio de lectura, la atribución visible y la regla de privacidad están documentados y validados en producción.
