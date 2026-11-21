# 02-aislamiento-rutas (P02,P09)

- **Objetivo:** Verificar que el `uid` provenga del token y que cada usuario acceda solo a sus rutas.
- **Procedimiento:** Ejecutar las pruebas de autenticación, aislamiento y propiedad de imágenes en `__tests__/rutas.test.ts`.
- **Resultado esperado:** Aislamiento por `usuarios/<uid>` y rechazo de recursos ajenos.
- **Resultado obtenido:** Pasaron las pruebas de token válido/inválido y rutas por usuario.
- **Evidencia:** 10 pruebas de rutas aprobadas.
- **Estado:** aprobado
