import { del, get, list, put } from '@vercel/blob';

// Store PRIVADO. La app nunca recibe el token (BLOB_READ_WRITE_TOKEN solo existe en Vercel).
// Compatible con @vercel/blob 2.x: put/get requieren access: 'private'.

export async function subir(pathname: string, cuerpo: ArrayBuffer, contentType: string) {
  const r = await put(pathname, cuerpo, { access: 'private', addRandomSuffix: true, contentType });
  return { url: r.url, pathname: r.pathname };
}

export async function borrar(urlOPathname: string) {
  await del(urlOPathname);
}

export async function leerPrivado(pathname: string) {
  const r = await get(pathname, { access: 'private' });
  if (!r || r.statusCode !== 200) return null;
  return { stream: r.stream, contentType: r.blob.contentType };
}

export async function borrarPrefijo(prefijo: string) {
  let cursor: string | undefined;
  do {
    const pagina = await list({ prefix: prefijo, cursor });
    if (pagina.blobs.length) await del(pagina.blobs.map((b) => b.url));
    cursor = pagina.hasMore ? pagina.cursor : undefined;
  } while (cursor);
}
