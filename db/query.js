class Query {
    constructor(pool, sql, vars) {
        this.pool = pool;
        this.sql = sql;
        this.vars = vars;
    }

    query() {
        return new Promise((resolve, reject) => {
            let conn;
            let rows;
            new Promise((res, connErr) => {
                try {
                    conn = this.pool.getConnection();
                    res(conn);
                } catch (err) {
                    connErr(err);
                }
            })
                .then((conn) => {
                    try {
                        rows = conn.query(this.sql, this.vars);
                        resolve(rows);
                        if (conn) return conn.release();
                    } catch (err) {
                        reject(err);
                        if (conn) return conn.release();
                    }
                });
        });
    }

}

module.exports = Query;