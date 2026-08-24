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
      mostrarToast('Paquete pastoral creado')
      router.push(`/pastoral/paquetes/${resultado.id}`)
    })
  }

  const eliminar = (id: string) => {
    if (!window.confirm('¿Eliminar este paquete pastoral?')) return
    startTransition(async () => {
      const resultado = await eliminarPaquetePastoral(id)
      mostrarToast(resultado.success ? 'Paquete eliminado' : resultado.error)
      if (resultado.success) router.refresh()
    })
  }

  const estadoLabel = { borrador: 'En preparación', listo: 'Listo', compartido: 'Publicado' }

  return (
    <div className="pastoral-project-workspace">
      <div className="pastoral-project-actions">
        <button
          type="button"
          onClick={() => setMostrarFormulario((actual) => !actual)}
          className="pastoral-project-create"
          aria-expanded={mostrarFormulario}
        >
          <PackagePlus aria-hidden="true" />
          <span>{mostrarFormulario ? 'Cerrar proyecto nuevo' : 'Nuevo proyecto'}</span>
        </button>
      </div>

      {mostrarFormulario && (
        <form action={crear} className="pastoral-project-builder">
          <div className="pastoral-project-builder-head">
            <p>Nuevo proyecto</p>
            <h2>Prepara el estudio</h2>
          </div>

          <details className="pastoral-accordion">
            <summary>
              <span className="pastoral-accordion-number">1</span>
              <span className="pastoral-accordion-copy">
                <strong>Información básica</strong>
                <small>Título y resumen</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className="pastoral-accordion-content">
              <label className="pastoral-field">
                <span>Título</span>
                <input name="titulo" required maxLength={140} placeholder="Ej. La fe que permanece" />
              </label>
              <label className="pastoral-field">
                <span>Resumen <em>opcional</em></span>
                <textarea name="descripcion_publica" maxLength={2000} rows={3} placeholder="Explica brevemente de qué trata." />
              </label>
            </div>
          </details>

          <details className="pastoral-accordion">
            <summary>
              <span className="pastoral-accordion-number">2</span>
              <span className="pastoral-accordion-copy">
                <strong>Contenido</strong>
                <small>Bosquejo y versículos</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className="pastoral-accordion-content pastoral-field-grid">
              <label className="pastoral-field">
                <span><FileText aria-hidden="true" /> Bosquejo</span>
                <select name="bosquejo_id">
                  <option value="">Ninguno por ahora</option>
                  {bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
                </select>
              </label>
              <label className="pastoral-field">
                <span><BookOpen aria-hidden="true" /> Versículos</span>
                <select name="coleccion_id">
                  <option value="">Ninguna por ahora</option>
                  {colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
                </select>
              </label>
            </div>
          </details>

          <details className="pastoral-accordion">
            <summary>
              <span className="pastoral-accordion-number">3</span>
              <span className="pastoral-accordion-copy">
                <strong>Aplicación y recursos</strong>
                <small>Pasos, archivos y enlaces</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className="pastoral-accordion-content">
              <label className="pastoral-field">
                <span>Preguntas o pasos <em>opcional</em></span>
                <textarea name="instrucciones" maxLength={3000} rows={4} placeholder="Preguntas, lectura semanal o pasos prácticos." />
              </label>

              {recursos.length > 0 ? (
                <fieldset className="pastoral-resource-picker">
                  <legend>Archivos y enlaces</legend>
                  <div className="pastoral-resource-grid">
                    {recursos.map((recurso) => (
                      <label key={recurso.id} className="pastoral-resource-option">
                        <input type="checkbox" name="recurso_ids" value={recurso.id} />
                        <span>
                          <strong>{recurso.titulo}</strong>
                          <small>{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : <p className="pastoral-inline-note">No hay recursos todavía. Puedes agregarlos después.</p>}
            </div>
          </details>

          <input type="hidden" name="estado" value="borrador" />
          <button type="submit" disabled={isPending} className="pastoral-project-submit">
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
              aria-label="Buscar paquetes por nombre o tema"
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

      <details className="pastoral-accordion pastoral-how-it-works">
        <summary>
          <span className="pastoral-accordion-copy">
            <strong>Cómo funciona</strong>
            <small>Preparar, completar y compartir</small>
          </span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="pastoral-accordion-content pastoral-how-steps">
          <p><strong>1. Prepara</strong><span>Elige bosquejo y versículos.</span></p>
          <p><strong>2. Completa</strong><span>Agrega recursos y aplicación.</span></p>
          <p><strong>3. Comparte</strong><span>Revisa, publica o imprime.</span></p>
        </div>
      </details>
    </div>
  )
}
