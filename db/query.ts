import { Pool, PoolConnection } from 'mariadb';

export async function query(pool: Pool, sql: string, vars: (string | number)[]) {
    const connection: PoolConnection = await pool.getConnection();
    const rows = await connection.query(sql, vars);
    connection.release();
    connection.end();
    return rows;
    // return new Promise((resolve, reject) => {
    //     let conn;
    //     let rows;
    //     new Promise((res, connErr) => {
    //         try {
    //             conn = this.pool.getConnection();
    //             res(conn);
    //         } catch (err) {
    //             connErr(err);
    //         }
    //     })
    //         .then((conn: PoolConnection) => {
    //             try {
    //                 rows = conn.query(this.sql, this.vars);
    //                 resolve(rows);
    //                 if (conn) return conn.release();
    //             } catch (err) {
    //                 reject(err);
    //                 if (conn) return conn.release();
    //             }
    //         });
    // });
}

export default query;