# Database Setup
Steve requires a MySQL or MariaDB database in order to store Discord guild information.  The following is a short guide on how to set MySQL up for Steve.

### Log in
Log into MySQL in the terminal with the root user and password.
```bash
mysql -u root -p
```

### Create a user
Next, we will create a new MySQL user with a username and password. We will call it `stevebotuser` here, but it can be changed to whatever name you wish.

**Note**: If you do change the name, `DB_USERNAME` will need to be changed in the `.env` file to reflect this change.

```sql
# Use the mysql database to create a new user
USE mysql;

# Change 'somePassword' to a unique password 
CREATE USER 'stevebotuser'@'127.0.0.1' IDENTIFIED BY 'somePassword';
```

### Create a database
Next, we will create a new database.  We will call it `stevebot` here, but it can be changed to whatever name you wish (Again, `.env` must be edited to reflect this change).
```sql
CREATE DATABASE stevebot;
```

### Assign permisisons
Next, we assign permissions to the user we just created so they have access to the `stevebot` database.
```sql
GRANT ALL PRIVILEGES ON stebot.* TO 'stevebotuser'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

## Next Steps
You have finished the database setup! Click [here](getting_started.md) to continue the rest of the setup.

