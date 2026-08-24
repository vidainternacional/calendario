'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Library,
  Loader2,
  PackagePlus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { crearPaquetePastoral, eliminarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'

type Paquete = {
  id: string
  titulo: string
  descripcion_publica: string
  estado: 'borrador' | 'listo' | 'compartido'
  updated_at: string
}

type Opcion = { id: string; titulo: string }
type Recurso = Opcion & { categoria: string; tipo: 'archivo' | 'enlace' }
type SeccionNueva = 'general' | 'contenido' | 'versiculos' | 'recursos'

export default function PaquetesClient({
  paquetes,
  bosquejos,
  colecciones,
  recursos,
}: {
  paquetes: Paquete[]
  bosquejos: Opcion[]
  colecciones: Opcion[]
  recursos: Recurso[]
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [seccionNueva, setSeccionNueva] = useState<SeccionNueva>('general')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [bosquejoId, setBosquejoId] = useState('')
  const [coleccionId, setColeccionId] = useState('')
  const [recursoIds, setRecursoIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const termino = busqueda.trim().toLowerCase()
  const filtrados = useMemo(() => {
    if (!termino) return paquetes
    return paquetes.filter((paquete) => `${paquete.titulo} ${paquete.descripcion_publica ?? ''}`.toLowerCase().includes(termino))
  }, [termino, paquetes])

  const crear = (formData: FormData) => {
    startTransition(async () => {
      const resultado = await crearPaquetePastoral(formData)
      if (!resultado.success || !resultado.id) {
        mostrarToast(resultado.error)
        return
      }
      mostrarToast('Proyecto pastoral creado')
      router.push(`/pastoral/paquetes/${resultado.id}`)
    })
  }

  const eliminar = (id: string) => {
    if (!window.confirm('¿Eliminar este proyecto pastoral?')) return
    startTransition(async () => {
      const resultado = await eliminarPaquetePastoral(id)
      mostrarToast(resultado.success ? 'Proyecto eliminado' : resultado.error)
      if (resultado.success) router.refresh()
    })
  }

  const alternarRecurso = (id: string) => {
    setRecursoIds((actuales) => actuales.includes(id) ? actuales.filter((item) => item !== id) : [...actuales, id].slice(0, 30))
  }

  const estadoLabel = { borrador: 'En preparación', listo: 'Listo', compartido: 'Publicado' }
  const secciones: Array<{ id: SeccionNueva; label: string; icono: typeof PackagePlus }> = [
    { id: 'general', label: 'General', icono: PackagePlus },
    { id: 'contenido', label: 'Contenido', icono: FileText },
    { id: 'versiculos', label: 'Versículos', icono: BookOpen },
    { id: 'recursos', label: 'Recursos', icono: Library },
  ]

  return (
    <div className="pastoral-project-workspace">
      <div className="pastoral-project-actions">
        <button
          type="button"
          onClick={() => {
            setMostrarFormulario((actual) => !actual)
            setSeccionNueva('general')
          }}
          className="pastoral-project-create"
          aria-expanded={mostrarFormulario}
        >
          <PackagePlus aria-hidden="true" />
          <span>{mostrarFormulario ? 'Cerrar proyecto nuevo' : 'Nuevo proyecto'}</span>
        </button>
      </div>

      {mostrarFormulario && (
        <form action={crear} className="pastoral-project-builder pastoral-project-builder-tabs">
          <div className="pastoral-project-builder-head">
            <p>Nuevo proyecto</p>
            <h2>Prepara el estudio</h2>
          </div>

          <nav className="pastoral-builder-tools" aria-label="Áreas del proyecto nuevo">
            {secciones.map(({ id, label, icono: Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSeccionNueva(id)}
                className={seccionNueva === id ? 'is-active' : ''}
                aria-pressed={seccionNueva === id}
              >
                <Icono aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="pastoral-builder-panel" key={seccionNueva}>
            {seccionNueva === 'general' && (
              <div className="pastoral-builder-section">
                <div className="pastoral-builder-section-title">
                  <strong>Información general</strong>
                  <span>Nombre y resumen del proyecto.</span>
                </div>
                <label className="pastoral-field">
                  <span>Título</span>
                  <input value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={140} placeholder="Ej. La fe que permanece" />
                </label>
                <label className="pastoral-field">
                  <span>Resumen <em>opcional</em></span>
                  <textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} maxLength={2000} rows={3} placeholder="Explica brevemente de qué trata." />
                </label>
              </div>
            )}

            {seccionNueva === 'contenido' && (
              <div className="pastoral-builder-section">
                <div className="pastoral-builder-section-title">
                  <strong>Contenido</strong>
                  <span>Deja preparada la idea, aplicación o preguntas iniciales.</span>
                </div>
                <label className="pastoral-field">
                  <span>Bosquejo base</span>
                  <select value={bosquejoId} onChange={(event) => setBosquejoId(event.target.value)}>
                    <option value="">Ninguno por ahora</option>
                    {bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
                  </select>
                </label>
                <label className="pastoral-field">
                  <span>Aplicación o notas de trabajo <em>opcional</em></span>
                  <textarea value={instrucciones} onChange={(event) => setInstrucciones(event.target.value)} maxLength={3000} rows={5} placeholder="Ideas, preguntas, pasos o contenido que completarás dentro del proyecto." />
                </label>
              </div>
            )}

            {seccionNueva === 'versiculos' && (
              <div className="pastoral-builder-section">
                <div className="pastoral-builder-section-title">
                  <strong>Versículos</strong>
                  <span>Conecta una colección existente; podrás seguir agregando versículos dentro del proyecto.</span>
                </div>
                <label className="pastoral-field">
                  <span><BookOpen aria-hidden="true" /> Colección</span>
                  <select value={coleccionId} onChange={(event) => setColeccionId(event.target.value)}>
                    <option value="">Ninguna por ahora</option>
                    {colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
                  </select>
                </label>
              </div>
            )}

            {seccionNueva === 'recursos' && (
              <div className="pastoral-builder-section">
                <div className="pastoral-builder-section-title">
                  <strong>Recursos</strong>
                  <span>Selecciona archivos o enlaces que ya pertenecen a tu biblioteca.</span>
                </div>
                {recursos.length > 0 ? (
                  <div className="pastoral-resource-grid">
                    {recursos.map((recurso) => {
                      const seleccionado = recursoIds.includes(recurso.id)
                      return (
                        <button
                          key={recurso.id}
                          type="button"
                          onClick={() => alternarRecurso(recurso.id)}
                          className={`pastoral-resource-option ${seleccionado ? 'is-selected' : ''}`}
                          aria-pressed={seleccionado}
                        >
                          <span>
                            <strong>{recurso.titulo}</strong>
                            <small>{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</small>
                          </span>
                          <CheckCircle2 aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>
                ) : <p className="pastoral-inline-note">No hay recursos todavía. Puedes agregarlos después.</p>}
              </div>
            )}
          </div>

          <input type="hidden" name="titulo" value={titulo} />
          <input type="hidden" name="descripcion_publica" value={descripcion} />
          <input type="hidden" name="instrucciones" value={instrucciones} />
          <input type="hidden" name="bosquejo_id" value={bosquejoId} />
          <input type="hidden" name="coleccion_id" value={coleccionId} />
          {recursoIds.map((id) => <input key={id} type="hidden" name="recurso_ids" value={id} />)}
          <input type="hidden" name="estado" value="borrador" />

          <button type="submit" disabled={isPending || !titulo.trim()} className="pastoral-project-submit">
            {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            {isPending ? 'Creando…' : 'Crear y continuar'}
          </button>
        </form>
      )}

      <details className="pastoral-accordion pastoral-projects-accordion">
        <summary>
          <span className="pastoral-accordion-copy">
            <strong>Mis proyectos</strong>
            <small>{paquetes.length} proyecto{paquetes.length === 1 ? '' : 's'}</small>
          </span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="pastoral-accordion-content">
          <label className="pastoral-search-field">
            <Search aria-hidden="true" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar proyecto"
              aria-label="Buscar proyectos por nombre o tema"
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
                <X aria-hidden="true" />
              </button>
            )}
          </label>

          {filtrados.length === 0 ? (
            <div className="pastoral-empty-state">
              <Search aria-hidden="true" />
              <strong>{termino ? 'No hay coincidencias' : 'No hay proyectos todavía'}</strong>
              <span>{termino ? `No encontramos “${busqueda.trim()}”.` : 'Crea el primero para comenzar.'}</span>
            </div>
          ) : (
            <div className="pastoral-project-links">
              {filtrados.map((paquete) => (
                <div key={paquete.id} className="pastoral-project-link-row">
                  <Link href={`/pastoral/paquetes/${paquete.id}`}>
                    <span>
                      <strong>{paquete.titulo}</strong>
                      <small>{estadoLabel[paquete.estado]}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => eliminar(paquete.id)}
                    disabled={isPending}
                    aria-label={`Eliminar ${paquete.titulo}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
