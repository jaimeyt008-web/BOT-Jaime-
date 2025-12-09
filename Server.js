const express = require('express');
const axios = require('axios');
const app = express();

// Permitir que Render lea datos en formato JSON
app.use(express.json({ limit: '1mb' }));

// Usamos la variable de entorno de Render (más seguro)
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const WHAPI_URL = 'https://gate.whapi.cloud';

// Ruta del webhook (donde Whapi envía los mensajes)
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    // Si no hay mensajes, salimos
    if (!data.messages || data.messages.length === 0) {
      return res.status(200).send('No hay mensajes');
    }

    const msg = data.messages[0];
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const comando = msg.body.text.toLowerCase();

    // Solo trabajamos en grupos y con los comandos que queremos
    if (msg.chat.type === 'group' && (comando === '.grupo abrir' || comando === '.grupo cerrar')) {
      // Verificar si el usuario es admin del grupo
      const grupoInfo = await axios.get(`${WHAPI_URL}/groups/${chatId}`, {
        headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` }
      });

      const esAdmin = grupoInfo.data.admins.some(admin => admin.id === userId);
      if (!esAdmin) {
        await axios.post(`${WHAPI_URL}/messages/text`, {
          chat_id: chatId,
          body: '❌ Solo los admins pueden usar este comando!'
        }, { headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` } });
        return res.status(200).send('OK');
      }

      // Comando .grupo abrir
      if (comando === '.grupo abrir') {
        await axios.patch(`${WHAPI_URL}/groups/${chatId}/settings`, {
          permissions: { send_messages: true }
        }, { headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` } });
        await axios.post(`${WHAPI_URL}/messages/text`, {
          chat_id: chatId,
          body: '✅ Grupo abierto! Ahora todos pueden enviar mensajes 🎉'
        }, { headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` } });
      }

      // Comando .grupo cerrar
      if (comando === '.grupo cerrar') {
        await axios.patch(`${WHAPI_URL}/groups/${chatId}/settings`, {
          permissions: { send_messages: false }
        }, { headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` } });
        await axios.post(`${WHAPI_URL}/messages/text`, {
          chat_id: chatId,
          body: '🔒 Grupo cerrado! Solo admins pueden enviar mensajes 🛡️'
        }, { headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` } });
      }
    }

    res.status(200).send('OK';
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(200).send('Error procesando el mensaje';
  }
});

// Iniciar el servidor en el puerto que Render asigna
const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`Servidor listo en el puerto ${puerto}`);
});
