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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { adminId, tipo, idRef } = req.query;
    if (!adminId) return res.status(400).json({ error: 'Falta el adminId' });

    const db = admin.database();

    if (!tipo || tipo === 'metadata') {
      // Obtiene el listado rápido de metadatos (Carga en milisegundos)
      const snap = await db.ref(`catalogos/${adminId}/metadata`).once('value');
      if (!snap.exists()) return res.status(404).json({ error: 'Catálogo no encontrado' });
      
      // Cache de 5 minutos en el CDN para los metadatos de la tienda
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
      return res.status(200).json(snap.val());
    } 

    if (tipo === 'imagen' && idRef) {
      // Obtiene la foto HD de un producto bajo demanda
      const snap = await db.ref(`catalogos/${adminId}/imagenes/${idRef}`).once('value');
      return res.status(200).json({ foto: snap.val() || '' });
    }

    if (tipo === 'imagen_variante' && idRef) {
      // Obtiene la foto de una variante bajo demanda
      const snap = await db.ref(`catalogos/${adminId}/imagenes_variantes/${idRef}`).once('value');
      return res.status(200).json({ foto: snap.val() || '' });
    }

    return res.status(400).json({ error: 'Consulta no soportada' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};