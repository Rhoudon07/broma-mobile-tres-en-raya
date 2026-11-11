const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Función para obtener la IP local de la máquina en la red WiFi / LAN
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Ignorar direcciones internas (127.0.0.1) y buscar IPv4
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Seguridad: evitar path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error interno del servidor');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  const phoneURL = `http://${localIP}:${PORT}`;
  const qrApiURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(phoneURL)}`;

  console.log('================================================================');
  console.log('       📱 SERVIDOR DE BROMA PARA CELULARES ANDROID 🎭           ');
  console.log('================================================================');
  console.log('');
  console.log('  [✔] Servidor activo escuchando en el puerto ' + PORT);
  console.log('');
  console.log('  👉 ENLACE PARA ABRIR EN EL CELULAR ANDROID:');
  console.log('     \x1b[36m\x1b[1m' + phoneURL + '\x1b[0m');
  console.log('');
  console.log('  📷 O ESCANEA ESTE CODIGO QR DIRECTAMENTE CON LA CAMARA DEL MOVIL:');
  console.log('     ' + qrApiURL);
  console.log('');
  console.log('  💡 Instrucciones:');
  console.log('     1. Conecta tu celular a la misma red WiFi que esta PC.');
  console.log('     2. Abre la camara del celular o Google Chrome y entra a:');
  console.log('        ' + phoneURL);
  console.log('     3. Pasale el celular a tu amigo con el juego "Tres en Raya"');
  console.log('        ¡y mira su reaccion cuando comience la broma de hackeo!');
  console.log('');
  console.log('================================================================');
  console.log('Presiona Ctrl + C para detener el servidor.');
});

