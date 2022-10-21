import mariadb from "mariadb";
import dotenv from "dotenv";
dotenv.config();

export const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT ?? 3306)
});

export function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection()
            .then((connection) => {
                resolve(connection);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
