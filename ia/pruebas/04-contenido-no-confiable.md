# 04-contenido-no-confiable (P05,P06)

- **Objetivo:** Confirmar validación de entradas y tratamiento seguro de respuestas externas.
- **Procedimiento:** Ejecutar pruebas Zod, detección de tipos reales de imagen y mapeo de errores Firebase.
- **Resultado esperado:** Entradas inválidas reciben 400/415/413 y errores internos no filtran detalles.
- **Resultado obtenido:** Las pruebas de validación, imágenes y errores pasaron.
- **Evidencia:** 18 pruebas Vitest aprobadas; respuesta `500 Error interno` para códigos desconocidos.
- **Estado:** aprobado
