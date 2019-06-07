const {dbConnection} = require('./database');

const createEmployeeTableQuery = `
    CREATE TABLE IF NOT EXISTS employee (
        id BIGSERIAL PRIMARY KEY NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        dob DATE NOT NULL
    );`;

const createEmployeeTable = () => {
    dbConnection.dbConnect(createEmployeeTableQuery)
        .then(res => {
            if (res.command == 'CREATE') {
                console.log('Table employee is live');
            }
        })
        .catch(error => console.log(error));
};

module.exports = {
    createEmployeeTable
};