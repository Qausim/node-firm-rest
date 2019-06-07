const { Pool, Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString
});

const dbConnection =  {
    dbConnect(query, data) {
        return pool.connect()
            .then(client => client.query(query, data)
                    .finally(() => client.release())
            )
    }
};

module.exports = {
    dbConnection
};