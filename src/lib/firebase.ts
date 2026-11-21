import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from './env';

function app(): App {
  const existente = getApps()[0];
  if (existente) return existente;
  const e = env();
  return initializeApp({
    credential: cert({
      projectId: e.FIREBASE_PROJECT_ID,
      clientEmail: e.FIREBASE_CLIENT_EMAIL,
      // En Vercel la clave se pega con \n literales.
      privateKey: e.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export const getAdminAuth = () => getAuth(app());
export const getDb = () => getFirestore(app());
