const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://boxi-4a68c-default-rtdb.firebaseio.com" 
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { adminId, tipo, datos, idRef } = req.body;
    if (!adminId || !tipo || !datos) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    const db = admin.database();

    if (tipo === 'metadata') {
      // Guarda únicamente el listado ligero de productos (sin base64) y datos de negocio
      await db.ref(`catalogos/${adminId}/metadata`).set(datos);
    } else if (tipo === 'imagen' && idRef) {
      // Guarda o actualiza la foto original de un producto específico
      await db.ref(`catalogos/${adminId}/imagenes/${idRef}`).set(datos);
    } else if (tipo === 'imagen_variante' && idRef) {
      // Guarda la foto de una variante específica
      await db.ref(`catalogos/${adminId}/imagenes_variantes/${idRef}`).set(datos);
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};