import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Ejecuta el módulo real con dependencias controladas, sin conexiones remotas.
export function cargarModulo(path, dependencias = {}, env = {}) {
  const source = fs.readFileSync(path, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  })
  const module = { exports: {} }
  vm.runInNewContext(outputText, {
    module, exports: module.exports, URL, Date, Set, Map, FormData,
    console: { log() {}, error() {}, warn() {} }, process: { env },
    require(name) {
      if (!(name in dependencias)) throw new Error(`Dependencia no simulada: ${name}`)
      return dependencias[name]
    },
  }, { filename: path })
  return module.exports
}
