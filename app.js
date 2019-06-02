const express = require('express');
const bodyParser = require('body-parser');


const app = express();

app.use(bodyParser.json());

app.use('/employees', employeeRoutes);


module.exports = app;