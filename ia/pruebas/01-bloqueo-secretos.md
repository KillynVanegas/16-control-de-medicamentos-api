# 01-bloqueo-secretos (P01)

- **Objetivo:** Impedir que claves o tokens reales entren al repositorio.
- **Procedimiento:** Ejecutar `npm run secrets` y revisar el patrón del validador.
- **Resultado esperado:** Sin hallazgos de claves privadas, claves de Google/Firebase o tokens Blob.
- **Resultado obtenido:** Pasó sin hallazgos.
- **Evidencia:** `npm run secrets` mostró `Sin secretos detectados`.
- **Estado:** aprobado
