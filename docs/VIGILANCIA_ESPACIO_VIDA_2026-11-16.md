# Vigilancia del espacio de ccvida

Se creó y habilitó una tarea de ChatGPT «Espacio Supabase VIDA», con revisión diaria en zona America/El_Salvador. La tarea consulta solo métricas del proyecto principal lnkrojvyiwnlcoponxud mediante el conector autorizado. No modifica datos, planes ni permisos.

Medición inicial verificada: 250148531 bytes de PostgreSQL (~250 MB decimales), cero objetos y cero bytes registrados de Storage. El límite documentado del plan gratuito es 500 MB de base de datos; no confundir con disco ni con archivos Storage.

Avisos conservadores de base de datos: 350 MB (preventivo), 425 MB (urgente), 475 MB (crítico). Se revisa además Storage, con un umbral preventivo separado de 700 MB; el límite vigente de archivos debe confirmarse en el panel. Se debe informar una imposibilidad de consultar, en vez de presentar un consumo supuesto como correcto. Si no hay un riesgo nuevo, la tarea no envía aviso.

La vigilancia se entrega por ChatGPT, no es una alarma incorporada al panel VIDA. Una comprobación diaria no garantiza prevenir un aumento abrupto entre mediciones y no certifica cuotas de tráfico, Auth ni WAL. No se automatizaron borrados, ampliaciones, cambios de plan ni envío a terceros.

Referencia: https://supabase.com/docs/guides/platform/database-size
