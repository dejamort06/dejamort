const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const P = require('pino');

// Railway’de auth dosyasını volume olarak mount ettiyseniz path’i buraya yazın:
const authFilePath = '/app/auth_info.json'; 

const { state, saveState } = useSingleFileAuthState(authFilePath);

async function startBot() {
  const conn = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    logger: P({ level: 'silent' }),
  });

  conn.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if(qr) {
      qrcode.generate(qr, { small: false });
      console.log('QR kodu yukarıda, Railway loglarında büyük görünür.');
    }

    if(connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if(statusCode === DisconnectReason.loggedOut) {
        console.log('Oturum kapandı. Tekrar QR okutmalısın.');
        process.exit(0);
      } else {
        console.log('Bağlantı koptu, 10 saniye sonra tekrar bağlanıyor...');
        setTimeout(startBot, 10000);
      }
    }

    if(connection === 'open') {
      console.log('✅ Bot bağlandı ve çalışıyor.');
    }
  });

  conn.ev.on('creds.update', saveState);

  return conn;
}

startBot();
