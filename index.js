const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const qrcode = require('qrcode-terminal')  // Burası eklendi

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.clear()
      console.log('📱 WhatsApp Web QR Kodunu Tara:\n')
      qrcode.generate(qr, { small: true })  // QR kodunu ASCII olarak terminalde göster
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ Bağlantı koptu. Tekrar bağlanıyor mu?', shouldReconnect)
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('✅ Bot bağlandı ve çalışıyor.')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
    const sender = msg.key.remoteJid

    if (text.toLowerCase().includes('merhaba')) {
      await sock.sendMessage(sender, { text: 'Merhaba, size nasıl yardımcı olabilirim?' })
    }
  })
}

startBot()
