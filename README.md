# 16 · Control de medicamentos — API

Next.js (App Router) + Firebase Auth/Firestore (Admin SDK) + Vercel Blob. Repositorio hermano: `16-control-de-medicamentos-app`.

## Endpoints

| Ruta                                                                 | Descripción                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `GET /api/health`                                                    | Comprobación                                                    |
| `POST /api/auth/registro` · `login` · `refresh` · `GET /api/auth/yo` | Auth mediada por la API (la app no tiene claves de Firebase)    |
| `GET /api/medicamento?since=` · `PUT/DELETE /api/medicamento/:id`    | Sincronización (máx. 500, PUT idempotente, borrado lógico)      |
| `GET /api/toma?since=` · `PUT/DELETE /api/toma/:id`                  | Ídem para tomas                                                 |
| `GET /api/adherencia?desde=&hasta=`                                  | Porcentaje calculado en el servidor                             |
| `POST/GET/DELETE /api/imagenes`                                      | Foto del empaque en Blob **privado**, entregada solo a su dueño |
| `DELETE /api/mi-cuenta`                                              | Borra documentos, imágenes y el usuario de Auth                 |

Errores: `{ "error", "detalles"? }` con 400/401/403/404/409/413/415/429; los internos `500 Error interno`.

## Puesta en marcha

```bash
npm install
npm run check          # tipos, lint, formato, pruebas Vitest, secretos
# Servicios (sección 13 del documento): Firebase (Auth Email/Password + Firestore en producción con firestore.rules),
# cuenta de servicio, clave web, store privado de Blob y proyecto en Vercel con las variables de .env.example.
```

Las variables reales viven **solo en Vercel**. `.env.example` tiene valores ficticios.

## Estado

- Código construido y validado localmente.
- Dependencias instaladas y compilación de producción comprobada.
- Pendiente: autenticación/despliegue en Vercel, carga de variables de entorno y publicación de las reglas de Firestore.
- Las pruebas P01–P09 están documentadas en `ia/pruebas/`.

## Puntos a verificar

1. `src/lib/blob.ts`: la API de `@vercel/blob` para store privado (`put`/`get` con `access: 'private'`) debe contrastarse con la guía «delivering private blobs» y la versión instalada.
2. `src/lib/rateLimit.ts` es en memoria (por instancia): configure además el Firewall de Vercel para el login.
3. Las cuotas de Blob (plan Hobby) cambian: verifíquelas antes de subir imágenes en pruebas.
4. El cliente debe enviar los `id` como **UUID**; la app actual usa `INTEGER` y se migrará en la Fase 4.
5. `GET ?since=` usa `>=`: el cliente puede recibir de nuevo el último documento (PUT/upsert idempotente).
