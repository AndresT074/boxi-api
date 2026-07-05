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
    const { adminId } = req.query;
    if (!adminId) return res.status(400).json({ error: 'Falta el adminId' });

    const db = admin.database();
    const snap = await db.ref(`catalogos/${adminId}/chunks`).once('value');

    if (!snap.exists()) {
      return res.status(404).json({ error: 'Catálogo no encontrado o incompleto' });
    }

    const chunks = snap.val();
    
    // Reconstruimos el JSON de alta definición uniendo los fragmentos ordenados numéricamente
    const fullJson = Object.keys(chunks)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => chunks[key])
      .join('');

    const catalogo = JSON.parse(fullJson);

    // Cacheamos el catálogo pesado en el CDN de Vercel por 5 minutos
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');

    return res.status(200).json(catalogo);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};