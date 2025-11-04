import { Pool, PoolConnection } from "mariadb";

export async function query(pool: Pool, sql: string, vars: (string | number)[]) {
    const connection: PoolConnection = await pool.getConnection();
    const rows = await connection.query(sql, vars);
    connection.release();
    connection.end();
    return rows;
}

export default query;
