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
    const { adminId, catalogo } = req.body;
    if (!adminId || !catalogo) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    // Guardamos el JSON de alta definición en Realtime Database (Soporta hasta 10MB)
    const db = admin.database();
    await db.ref(`catalogos/${adminId}`).set(catalogo);

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};