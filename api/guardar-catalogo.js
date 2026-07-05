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
    const { adminId, chunkIndex, totalChunks, chunkData } = req.body;
    
    // Validación de seguridad para asegurar que lleguen los fragmentos
    if (adminId === undefined || chunkIndex === undefined || totalChunks === undefined || chunkData === undefined) {
      return res.status(400).json({ error: 'Faltan parámetros de fragmentación' });
    }

    const db = admin.database();
    
    // Si es el primer fragmento, limpiamos la base de datos para recibir el nuevo catálogo limpio
    if (chunkIndex === 0) {
      await db.ref(`catalogos/${adminId}/chunks`).remove();
    }

    // Guardamos el fragmento en la base de datos en tiempo real
    await db.ref(`catalogos/${adminId}/chunks/${chunkIndex}`).set(chunkData);

    return res.status(200).json({ success: true, partSaved: chunkIndex });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};