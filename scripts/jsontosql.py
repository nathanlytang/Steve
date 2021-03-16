import json
import mariadb
import sys


def usage(PROG_NAME):
    if len(sys.argv) != 6:
        print(
            f"Usage: {PROG_NAME} <host> <port> <database> <username> <password>")
        sys.exit(1)


def connect(argv):
    # Connect to MariaDB Platform
    host, port, database, user, password = map(str, (argv))

    try:
        connection = mariadb.connect(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=password,

        )
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB Platform: {e}")
        sys.exit(1)

    # Get Cursor
    cursor = connection.cursor()
    return connection, cursor


def main(connection, cursor):
    # Open JSON file and convert contents to dict
    path = input('Path to JSON: ')
    # path = "../src/env.json"
    with open(path, encoding="UTF-8") as json_file:
        data = json.load(json_file)

    # columns = input('Enter SQL columns separated by comma (no space): ')
    # rows = input('Enter JSON elements in the same order as the SQL columns separated by comma (no space): ')
    # columns = columns.strip().split(',')
    # rows = rows.strip().split(',')
    # if len(columns) != len(rows):
    #     print("Number of SQL columns and JSON elements must match")
    #     sys.exit(1)

    # count = len(columns)

    # Insert into SQL
    count = 0
    try:
        for i in data:
            # cursor.execute("INSERT INTO ? (" + ",".join(count * ["?"]) + ") VALUES(" + ",".join(count * ["?"]) + "); ", (columns, rows))
            cursor.execute(' INSERT INTO guild_data (guild_id, query, port, url, name, footer, prefix) VALUES (?, ?, ?, ?, ?, ?, ?) ', (i, data[i]['query'], data[i]['port'], data[i]['url'], data[i]['serverName'], data[i]['footer'], data[i]['prefix']))
            count += 1

        cursor.execute(' SELECT * FROM guild_data ')
        rows = cursor.fetchall()
        for i in rows:
            print(*i, sep=" | ")

        connection.commit()
        print("JSON successfully converted to SQL:")
        print(f"Changed {count} rows.")
    except:
        print("Error: Unable to convert JSON to SQL")

if __name__ == "__main__":
    PROG_NAME = sys.argv[0]
    usage(PROG_NAME)
    connection, cursor = connect(sys.argv[1:])
    main(connection, cursor)
    connection.close()
