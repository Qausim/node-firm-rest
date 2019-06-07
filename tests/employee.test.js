const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
require('../server');
const {dbConnection} = require('../config/database');
require('../config/migration').createTestEmployeeTable();
const app = require('../app');

chai.use(chaiHttp);
chai.should();

const testEmployee = {
    email: 'employee1@test.com',
    first_name: 'Ade',
    last_name: 'Ayo',
    role: 'cashier',
    dob: '1995-02-25'
};

beforeEach(done => {
    dbConnection.dbConnect('DELETE FROM employee_test;')
        .then(res => {
            return dbConnection.dbConnect('ALTER SEQUENCE employee_test_id_seq RESTART WITH 1;')
        })
        .then(() => {
            return dbConnection.dbConnect(`INSERT INTO employee_test (
                email, first_name, last_name, role, dob) VALUES (
                $1, $2, $3, $4, $5);`, [testEmployee.email,
                testEmployee.first_name, testEmployee.last_name, testEmployee.role,
                testEmployee.dob]);
        })
        .then(res => {
            if (res.rowCount) {
                done();
                return;
            }
            throw new Error('Unable to insert test employee into test database');
        })
        .catch(error => done(error));
});


describe('/employees', () => {
    describe('POST', () => {
        it('should create a new employee', async () => {
            const test = {
                first_name: 'Ola',
                last_name: 'Ige',
                email: 'ola.ige@test.com',
                dob: '1997-04-10',
                role: 'janitor'
            };
    
            const res = await chai.request(app)
                .post('/employees')
                .send(test);
            expect(res.status).to.equal(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('employee');
            expect(res.body.employee).to.have.property('id');
            expect(res.body.employee).to.have.property('first_name');
            expect(res.body.employee).to.have.property('last_name');
            expect(res.body.employee).to.have.property('email');
            expect(res.body.employee).to.have.property('dob');
            expect(res.body.employee).to.have.property('role');
            expect(res.body.employee.first_name).to.equal(test.first_name);
            expect(res.body.employee.last_name).to.equal(test.last_name);
            expect(res.body.employee.email).to.equal(test.email);
            expect(res.body.employee.role).to.equal(test.role);
        });

        it('should fail to create a new employee due to invalid email', async() => {
            const test = {
                first_name: 'Ola',
                last_name: 'Ige',
                email: 'ola.ige@test',
                dob: '1997-04-10',
                role: 'janitor'
            };
            const res = await chai.request(app).post('/employees').send(test);
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Invalid email format');
        });

        it('should fail to create a new employee due to date of birth', async() => {
            const test = {
                first_name: 'Ola',
                last_name: 'Ige',
                email: 'ola.ige@test.com',
                dob: '1997-04-32',
                role: 'janitor'
            };
            const res = await chai.request(app).post('/employees').send(test);
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Invalid dob (date of birth) format. Use the format yyyy-mm-dd');
        });

        it('should fail to create a new employee due to null first name', async() => {
            const test = {
                last_name: 'Ige',
                email: 'ola.ige@test.com',
                dob: '1997-04-31',
                role: 'janitor'
            };
            const res = await chai.request(app).post('/employees').send(test);
            expect(res.status).to.equal(500);
        });

        it('should fail to create a new employee due to null last name', async() => {
            const test = {
                first_name: 'Ola',
                email: 'ola.ige@test.com',
                dob: '1997-04-31',
                role: 'janitor'
            };
            const res = await chai.request(app).post('/employees').send(test);
            expect(res.status).to.equal(500);
        });

        it('should fail to create a new employee due to null role', async() => {
            const test = {
                first_name: 'Ola',
                last_name: 'Ige',
                email: 'ola.ige@test.com',
                dob: '1997-04-31',
            };
            const res = await chai.request(app).post('/employees').send(test);
            expect(res.status).to.equal(500);
        });
    });

    describe('GET', () => {
        it('should get all records of employees', async() => {
            const res = await chai.request(app).get('/employees').send();
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('employees');
            expect(res.body.employees).to.be.an('array');
            expect(res.body.employees.length).to.equal(1);
            expect(res.body.employees[0].first_name).to.equal(testEmployee.first_name);
            expect(res.body.employees[0].last_name).to.equal(testEmployee.last_name);
            expect(res.body.employees[0].email).to.equal(testEmployee.email);
            expect(res.body.employees[0].role).to.equal(testEmployee.role);
        });

        it('should get a particular employee by his/her id', async() => {
            const res = await chai.request(app).get('/employees/1').send();
            expect(res.status).to.equal(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('employee');
            expect(res.body.employee).to.be.a('object');
            expect(res.body.employee).to.have.property('id');
            expect(res.body.employee).to.have.property('first_name');
            expect(res.body.employee).to.have.property('last_name');
            expect(res.body.employee).to.have.property('email');
            expect(res.body.employee).to.have.property('dob');
            expect(res.body.employee).to.have.property('role');
            expect(res.body.employee.id).to.equal('1');
            expect(res.body.employee.first_name).to.equal(testEmployee.first_name);
            expect(res.body.employee.last_name).to.equal(testEmployee.last_name);
            expect(res.body.employee.email).to.equal(testEmployee.email);
            expect(res.body.employee.role).to.equal(testEmployee.role);
        });

        it('should fail to retrieve any employee with non-existing id', async() => {
            const res = await chai.request(app).get('/employees/2').send();
            expect(res.status).to.equal(404);
        });
    });

    describe('PATCH', () => {
        const data = {
            first_name: 'Biyi',
            last_name: 'Olu'
        };

        it('should update an employee data for a given id', async() => {
            const res = await chai.request(app).patch('/employees/1').send(data);
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('employee');
            expect(res.body.employee).to.have.property('id');
            expect(res.body.employee).to.have.property('first_name');
            expect(res.body.employee).to.have.property('last_name');
            expect(res.body.employee).to.have.property('email');
            expect(res.body.employee).to.have.property('dob');
            expect(res.body.employee).to.have.property('role');
            expect(res.body.employee.id).to.equal('1');
            expect(res.body.employee.first_name).to.equal(data.first_name);
            expect(res.body.employee.last_name).to.equal(data.last_name);
            expect(res.body.employee.email).to.equal(testEmployee.email);
            expect(res.body.employee.role).to.equal(testEmployee.role);
        });

        it('should fail to update an employee due to non existing id', async () => {
            const res = await chai.request(app).patch('/employees/2').send(data);
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Not found');
        });

        it('should fail to update an employee due to invalid email', async () => {
            const res = await chai.request(app).patch('/employees/1').send({
                email: 'employee1@test'
            });
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Invalid email format');
        });

        it('should fail to update an employee due to invalid date of birth', async() => {
            const res = await chai.request(app).patch('/employees/1').send({
                dob: '1992-12-32'
            });
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Invalid dob (date of birth) format. Use the format yyyy-mm-dd');
        });

        it('should fail to update an employee due to invalid request field', async () => {
            const res = await chai.request(app).patch('/employees/1').send({
                ...data, interest: 'cycling'
            });
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Unexpected request field(s)');
        });

        it('should fail to update an employee due to empty request', async () => {
            const res = await chai.request(app).patch('/employees/1').send({});
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Invalid request body');
        });
    });

    describe('DELETE', () => {
        it('should delete an employee with a given id', async () => {
            const res = await chai.request(app).delete('/employees/1').send();
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('employee');
            expect(res.body.employee).to.be.an('object');
            expect(res.body.employee).to.have.property('id');
            expect(res.body.employee).to.have.property('first_name');
            expect(res.body.employee).to.have.property('last_name');
            expect(res.body.employee).to.have.property('email');
            expect(res.body.employee).to.have.property('dob');
            expect(res.body.employee).to.have.property('role');
            expect(res.body.employee.id).to.equal('1');
            expect(res.body.employee.first_name).to.equal(testEmployee.first_name);
            expect(res.body.employee.last_name).to.equal(testEmployee.last_name);
            expect(res.body.employee.email).to.equal(testEmployee.email);
            expect(res.body.employee.role).to.equal(testEmployee.role);
        });

        it('should fail to delete an employee for a non-existing id', async () => {
            const res = await chai.request(app).delete('/employees/2').send();
            expect(res.status).to.equal(404);
            expect(res.body.message).to.equal('Not found');
        });
    });
});