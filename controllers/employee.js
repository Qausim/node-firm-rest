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

const getEmployee = (request, response, next) => {
    const id = request.params.id;
    dbConnection.dbConnect('SELECT * FROM employee WHERE id=$1;', [id])
        .then(res => {
            if (res.rowCount) {
                return response.status(200).json({
                    employee: res.rows[0]
                });
            }
            const error = new Error('Not found');
            error.status = 404;
            throw error;
        })
        .catch(error => response.status(error.status || 500).json({
            message: error.message || 'Internal server error'
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
            if (res.rowCount) {
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

const updateEmployee = (request, response, next) => {
    const id = request.params.id;
    const allowedKeys = Object.keys(new Employee());
    const entryKeys = Object.keys(request.body);    
    const entryStates = entryKeys.map(key => allowedKeys.includes(key));
    
    if (entryStates.includes(false)) {
        return response.status(400).json({
            message: 'Unexpected request field(s)'
        });
    }

    const email = request.body.email;
    const dob = request.body.dob;
    
    if (entryKeys.includes('email') && !validateEmail(email)) {
        return response.status(400).json({
            message: 'Invalid email format'
        });
    }
    
    if (entryKeys.includes('dob') && !validateDate(dob)) {
        return response.status(400).json({
            message: 'Invalid dob (date of birth) format. Use the format yyyy-mm-dd'
        });
    }
    
    const entries = Object.entries(request.body).filter(el => !el.includes('id'));
    let queryString = '';
    const querySet = [];
    entries.forEach((el, ind, arr) => {
        if (ind < arr.length - 1) {
            queryString += `${el[0]}=$${ind + 1}, `;
        } else {
            queryString += `${el[0]}=$${ind + 1}`;
        }
        querySet.push(el[1]);
    });

    if (querySet.length) {
        querySet.push(id);
        queryString = `UPDATE employee SET ${queryString} WHERE id=$${querySet.length};`;
        dbConnection.dbConnect(queryString, querySet)
            .then(res => {
                if (res.rowCount) {
                    return dbConnection.dbConnect('SELECT * FROM employee WHERE id=$1;', [id]);
                }
                const error = new Error('Unable to update employee record');
                throw error;
            })
            .then(res => response.status(200).json({
                employee: res.rows[0]
            }))
            .catch(error => response.status(500).json({
                message: error.message
            }));
    } else {
        response.status(400).json({
            message: 'Invalid request body'
        });
    }
};

const deleteEmployee = (request, response, next) => {
    const id = request.params.id;
    let employee;
    dbConnection.dbConnect('SELECT * FROM employee WHERE id=$1', [id])
        .then(res => {
            if (res.rowCount) {
                employee = res.rows[0];
                return dbConnection.dbConnect('DELETE FROM employee WHERE id=$1;', [id]);
            }
            const error = new Error('Not found');
            error.status = 404;
            throw error;
        })
        .then(res => {
            if (res.rowCount) {
                response.status(200).json({
                    employee
                })
            }
        })
        .catch(error => response.status(error.status || 500).json({
            message: error.message || 'Internal server error'
        }));
};

module.exports = {
    getEmployees,
    getEmployee,
    postEmployee,
    updateEmployee,
    deleteEmployee
};