const env = process.env.NODE_ENV || 'development';

if (env == 'development') {
    process.env.TABLE_NAME = 'employee';
} else if (env === 'test') {
    process.env.TABLE_NAME = 'employee_test';
}