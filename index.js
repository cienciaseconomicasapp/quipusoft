const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.end('Quipusoft - iniciando...');
}).listen(PORT, () => console.log(`Puerto ${PORT}`));
