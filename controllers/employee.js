const {dbConnection} = require('../config/database');
require('../config/migration').createEmployeeTable();
const Employee = require('../models/employee');


const getEmployees = (request, response, next) => {
    dbConnection.dbConnect('SELECT * FROM employee;')
        .then(res => response.status(200).json({
            employees: res.rows
        }))
        .catch(error => response.status(500).json({
            message: 'Unable to fetch employees'
        }));
};



module.exports = {
    getEmployees,
};