const http = require('http');
const app = require('./app');
require('./config/migration').createEmployeeTable();

const port = 3000;

const server = http.createServer(app);

server.listen(port,() => console.log(`Server listening at port ${port}`));

