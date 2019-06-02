const {dbConnection} = require('../config/database');
require('../config/migration').createEmployeeTable();
const Employee = require('../models/employee');

const validateEmail = email => {
    return /[-a-zA-Z0-9._]+@{1}[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?\.[a-zA-Z]+/.test(email);
};

const validateDate = date => {
    return /\d{4}\-(?:[0][1-9]|[1][0-2])\-(?:[0-2][1-9]|[3][01])/.test(date);
};

const getEmployees = (request, response, next) => {
    dbConnection.dbConnect('SELECT * FROM employee;')
        .then(res => response.status(200).json({
            employees: res.rows
        }))
        .catch(error => response.status(500).json({
            message: 'Unable to fetch employees'
        }));
};

const postEmployee = (request, response, next) => {
    
    const email = request.body.email;
    if (!validateEmail(email)) {
        return response.status(400).json({
            message: 'Invalid email format'
        });
    }
    const dob = request.body.dob;
    if (!validateDate(dob)) {
        return response.status(400).json({
            message: 'Invalid dob (date of birth) format. Use the format yyyy-mm-dd'
        });
    }
    dbConnection.dbConnect(`INSERT INTO employee (first_name, last_name, role, email, dob) VALUES
        ($1, $2, $3, $4, $5);`, [request.body.first_name, request.body.last_name,
        request.body.role, email, dob])
        .then(res => {
            if (res.command != 'INSERT') {
                return dbConnection.dbConnect('SELECT * FROM employee WHERE email=$1', [email]);   
            }
        })
        .then(res => {
            const selected = res.rows[0];
            const employee = new Employee();
            employee.id = selected.id;
            employee.first_name = selected.first_name;
            employee.last_name = selected.last_name;
            employee.role = selected.role;
            employee.email = selected.email;
            employee.dob = selected.dob;
                
            return response.status(201).json({
                employee
            });
        })
        .catch(error => response.status(500).json({
            message: error.message
        }));
};



module.exports = {
    getEmployees,
    postEmployee,
};