const admin = require('firebase-admin');

// Inicializar Firebase Admin usando la variable de entorno segura de Vercel
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = async (req, res) => {
  // Habilitar CORS para que tu catálogo web pueda llamarlo desde cualquier navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { adminId, nombreCliente } = req.body;
    if (!adminId || !nombreCliente) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    // 1. Buscar el token del administrador en Firestore de forma 100% oculta
    const userDoc = await admin.firestore().collection('usuarios').doc(adminId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcm_token;
    const nombreNegocio = userData.nombre_negocio || 'Tu Negocio';

    if (!fcmToken) {
      return res.status(400).json({ error: 'Token FCM no registrado' });
    }

    // 2. Enviar el mensaje push de forma segura
    const message = {
      token: fcmToken,
      notification: {
        title: '📦 ¡Nuevo Pedido Web!',
        body: `${nombreCliente} te ha enviado un pedido.`
      },
      data: {
        negocio: nombreNegocio,
        cliente: nombreCliente,
        tipo: 'nuevo_pedido',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'pedidos_web_urgente',
          sound: 'default'
        }
      }
    };

    await admin.messaging().send(message);

    return res.status(200).json({ success: true, message: 'Notificación enviada con éxito' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};