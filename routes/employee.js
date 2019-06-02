const express = require('express');
const employeeController = require('../controllers/employee');

const router = express.Router();

router.get('/', employeeController.getEmployees);
// router.get('/:id');
router.post('/', employeeController.postEmployee);
router.patch('/:id', employeeController.updateEmployee);
// router.delete('/:id');

module.exports = router;