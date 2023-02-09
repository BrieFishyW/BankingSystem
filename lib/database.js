let mysql = require('mysql2');

var dbConnectionInfo = require('./connectionInfo');

var con = mysql.createConnection({
  host: dbConnectionInfo.host,
  user: dbConnectionInfo.user,
  password: dbConnectionInfo.password,
  port: dbConnectionInfo.port,
  multipleStatements: true              // Needed for stored proecures with OUT results
});

con.connect(function(err) {
  if (err) {
    throw err;
  }
  else {
    console.log("database.js: Connected to server!");
    
    runSQL("DROP DATABASE bankingapplication;", "Dropped the whole db.");
    
    con.query("CREATE DATABASE IF NOT EXISTS bankingapplication", function (err, result) {
      if (err) {
        console.log(err.message);
        throw err;
      }
      console.log("database.js: bankingapplication database created if it didn't exist");
      selectDatabase();
    });
  }
});

function selectDatabase() {
  let sql = "USE bankingapplication";
  con.query(sql, function(err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: Selected bankingapplication database");
      createTables();
      createStoredProcedures();
      AddDummyDataToDatabase();
    }
  });
}

function createTables() {
  runSQL("CREATE TABLE IF NOT EXISTS user_type (\n" +
      "user_type_id tinyint NOT NULL, \n" + // ID's for these will be hard coded so that the js can use them
      "user_type VARCHAR(255) NOT NULL, \n" + 
      "PRIMARY KEY (user_type_id) \n" +
    ");",
    "Table users created if it didn't already exist.");

  runSQL("CREATE TABLE IF NOT EXISTS users (\n" +
      "user_id int NOT NULL AUTO_INCREMENT, \n" +
      "email VARCHAR(255) NOT NULL, \n" +
      "firstname VARCHAR(255) NOT NULL, \n" +
      "lastname VARCHAR(255) NOT NULL, \n" +
      "password VARCHAR(255) NOT NULL, \n" +
      "salt VARCHAR(255) NOT NULL, \n" +
      "account_type tinyint NOT NULL, \n" +
      "PRIMARY KEY (user_id), \n" +
      "FOREIGN KEY (account_type) REFERENCES user_type(user_type_id), \n" +
      "UNIQUE (email) \n" +
    ");",
    "Table users created if it didn't already exist.");

  runSQL("CREATE TABLE IF NOT EXISTS finance_account_type (\n" +
      "account_type_id tinyint NOT NULL AUTO_INCREMENT, \n" +
      "account_type VARCHAR(255) NOT NULL, \n" + 
      "PRIMARY KEY (account_type_id) \n" +
    ");",
    "Table finance_account_type created if it didn't already exist.");

  runSQL("CREATE TABLE IF NOT EXISTS finance_account (\n" +
      "account_id int NOT NULL AUTO_INCREMENT, \n" +
      "account_type tinyint NOT NULL, \n" + 
      "owner_id int NOT NULL, \n" + 
      "balance decimal(14,2) NOT NULL, \n" +
      "PRIMARY KEY (account_id), \n" +
      "FOREIGN KEY (account_type) REFERENCES finance_account_type(account_type_id), \n" +
      "FOREIGN KEY (owner_id) REFERENCES users(user_id) \n" +
    ");",
    "Table finance_account created if it didn't already exist.");
      
  runSQL("CREATE TABLE IF NOT EXISTS transfer (\n" +
      "transfer_id INT NOT NULL AUTO_INCREMENT, \n" +
      "from_account_id INT NOT NULL, \n" + 
      "to_account_id INT NOT NULL, \n" + 
      "date DATETIME NOT NULL, \n" + 
      "amount DECIMAL(14,2) NOT NULL, \n" +
      "PRIMARY KEY (transfer_id), \n" +
      "FOREIGN KEY (from_account_id) REFERENCES finance_account (account_id), \n" +
      "FOREIGN KEY (to_account_id) REFERENCES finance_account (account_id) \n" +
    ");",
    "Table finance_account created if it didn't already exist.");
}
  
function createStoredProcedures() {
  // SELECT statements
  runSQL("CREATE PROCEDURE IF NOT EXISTS `get_salt` ( \n" +
      "IN email varchar(255), \n" +
      "OUT salt varchar(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "SELECT users.salt INTO salt FROM users \n" +
      "WHERE users.email = email; \n" +
    "END;",
    "Procedure get_salt created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `login_user` ( \n" +
      "IN email VARCHAR(255), \n" +
      "IN hashed_password VARCHAR(255), \n" +
      "OUT account_type tinyint \n" +
    ") \n" +
    "BEGIN \n" +
      "SELECT 0 INTO account_type; \n" +
      "SELECT users.account_type INTO account_type FROM users WHERE users.email = email \n" +
      "AND users.`password` = hashed_password; \n" + // user type 0 is invalid, bad login
    "END;",
    "Procedure login_user created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `account_search` ( \n" +
      "IN firstname varchar(255), \n" +
      "IN lastname varchar(255), \n" +
      "IN email VARCHAR(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "IF firstname IS NOT NULL THEN  \n" +
        "SELECT email, firstname, lastname, account_type \n" +
          "FROM users WHERE users.firstname = firstname; \n" +
      "END IF; \n" +
      "IF lastname IS NOT NULL THEN \n" +
        "SELECT email, firstname, lastname, account_type \n" +
          "FROM users WHERE users.lastname = lastname; \n" +
      "END IF; \n" +
      "IF email IS NOT NULL THEN \n" +
        "SELECT email, firstname, lastname, account_type \n" +
          "FROM users WHERE users.email = email; \n" +
        "END IF; \n" +
    "END;",
    "Procedure account_search created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `account_info` ( \n" +
      "IN user_id int, \n" +
      "OUT firstname varchar(255), \n" +
      "OUT lastname varchar(255), \n" +
      "OUT savings_balance decimal(14,2), \n" +
      "OUT checking_balance decimal(14,2), \n" +
      "OUT savings_id int, \n" +
      "OUT checking_id int \n" +
    ") \n" +
    "BEGIN \n" +
      "SELECT users.firstname, users.lastname INTO firstname, lastname FROM users WHERE users.user_id = user_id; \n" +
      
      "SELECT finance_account.balance, finance_account.account_id \n" +
        "INTO savings_balance, savings_id FROM finance_account \n" +
        "INNER JOIN users ON users.user_id = finance_account.owner_id \n" +
        "INNER JOIN finance_account_type ON finance_account.account_type = finance_account_type.account_type_id \n" +
        "WHERE users.user_id = user_id AND finance_account_type.account_type = 'savings'; \n" +

      "SELECT finance_account.balance, finance_account.account_id \n" +
        "INTO checking_balance, checking_id FROM finance_account \n" +
        "INNER JOIN users ON users.user_id = finance_account.owner_id \n" +
        "INNER JOIN finance_account_type ON finance_account.account_type = finance_account_type.account_type_id \n" +
        "WHERE users.user_id = user_id AND finance_account_type.account_type = 'checking'; \n" +
    "END;",
    "Procedure account_info created if it didn't already exist.");;

  runSQL("CREATE PROCEDURE IF NOT EXISTS `finance_account_history` ( \n" +
      "IN account_num int \n" +
    ") \n" +
    "BEGIN \n" +
      "SELECT from_account_id, to_account_id, date, amount FROM transfer \n" +
      "WHERE from_account_id = account_num OR to_account_id = account_num; \n" +
    "END;",
    "Procedure finance_account_history created if it didn't already exist.");

  // INSERT statements
  runSQL("CREATE PROCEDURE IF NOT EXISTS `create_user_type` ( \n" +
      "IN user_type_name VARCHAR(255), \n" +
      "IN user_type_id TINYINT \n" +
    ") \n" +
    "BEGIN \n" +
      "INSERT INTO user_type (user_type_id, user_type) VALUES (user_type_id, user_type_name); \n" +
      "SELECT user_type.user_type_id FROM user_type WHERE user_type.user_type_id = user_type_id; \n" +
    "END;",
    "Procedure create_finance_account_type created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `create_finance_account_type` ( \n" +
      "IN account_type_name varchar(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "INSERT INTO finance_account_type (account_type) VALUES (account_type_name); \n" +
      "SELECT account_type_id FROM finance_account_type WHERE account_type = account_type_name; \n" +
    "END;",
    "Procedure create_finance_account_type created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `register_user` ( \n" +
      "IN email VARCHAR(255), \n" +
      "IN firstname VARCHAR(255), \n" +
      "IN lastname VARCHAR(255), \n" +
      "IN password VARCHAR(255), \n" +
      "IN salt VARCHAR(255), \n" +
      "OUT id INT \n" +
    ") \n" +
    "BEGIN \n" +
      "INSERT INTO users (email, firstname, lastname, password, salt, account_type) \n" +
      "VALUES (email, firstname, lastname, password, salt, 1); \n" +
      
      "SET id = (SELECT user_id FROM users where users.email = email);\n" +

      "INSERT INTO finance_account (account_type, owner_id, balance) \n" +
      "VALUES (1, id, 0.0); \n" +

      "INSERT INTO finance_account (account_type, owner_id, balance) \n" +
      "VALUES (2, id, 0.0); \n" +
    "END;",
    "Procedure register_user created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `make_transfer` ( \n" +
      "IN from_account_id INT, \n" +
      "IN to_account_id INT, \n" +
      "IN amount DECIMAL(12,2) \n" +
    ") \n" +
    "BEGIN \n" +
      "INSERT INTO transfer (from_account_id, to_account_id, amount, date) \n" +
      "VALUES (from_account_id, to_account_id, amount, NOW()); \n" +
    "END;",
    "Procedure make_transfer created if it didn't already exist.");
    
  // UPDATE statements
  runSQL("CREATE PROCEDURE IF NOT EXISTS `change_password` ( \n" +
      "IN email VARCHAR(255), \n" +
      "IN new_pass VARCHAR(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "UPDATE users SET password = new_pass \n" +
      "WHERE users.email = email; \n" +
    "END;",
    "Procedure change_password created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `regrade_account` ( \n" +
      "IN email VARCHAR(255), \n" +
      "IN new_account_type TINYINT \n" +
    ") \n" +
    "BEGIN \n" +
      "UPDATE users SET account_type = new_account_type \n" +
      "WHERE users.email = email; \n" +
    "END;",
    "Procedure regrade_account created if it didn't already exist.");
/*
  runSQL("CREATE PROCEDURE IF NOT EXISTS `...` ( \n" +
      "IN ..., \n" +
      "OUT ... \n" +
    ") \n" +
    "BEGIN \n" +
      "... \n" +
      "... \n" +
    "END;",
    "Procedure ... created if it didn't already exist.");
    */
}
  
function AddDummyDataToDatabase() {
  // INSERT statements
  runSQL("CALL create_user_type('customer', 1)",
    "User account type 'customer' created");
  runSQL("CALL create_user_type('employee', 2)",
    "User account type 'employee' created");
  runSQL("CALL create_user_type('admin', 3)",
    "User account type 'admin' created");

  runSQL("CALL create_finance_account_type('checking')",
    "Finance account type 'checking' created");
  runSQL("CALL create_finance_account_type('savings')",
    "Finance account type 'savings' created");
  
  runSQL("CALL register_user('email1@gmail.com', 'bob', 'builder', 'XXXXyyXXXX', 'sbfiewbnfwjk', @id)",
    "Registered user 'bob builder'");
  runSQL("CALL register_user('thebeans@yahoo.com', 'susan', 'coolest', 'wdjvnewi', 'ffffssssss', @id)",
    "Registered user 'susan coolest'");

  runSQL("CALL make_transfer(1, 3, 50.33)",
    "Sent a transfer of 50.33 from bob to susan.");

  // SELECT statements
  runSQL("CALL get_salt('email1@gmail.com', @salt); SELECT @salt;",
    "Got the salt for bob.");

  runSQL("CALL login_user('email1@gmail.com', 'XXXXyyXXXX', @accttype); SELECT @accttype;",
    "Successfully logged bob in.");

  runSQL("CALL account_search('susan', 'coolest', 'thebeans@yahoo.com');",
    "Searched for susan's account");

  runSQL("CALL account_info(2, @first, @last, @savings_balance, @checking_balance, @savings_id, @checking_id); SELECT @first, @last, @savings_balance, @checking_balance, @savings_id, @checking_id;",
    "Got account info for susan");

  runSQL("CALL finance_account_history(3);",
    "Getting finance history for susan's checking.");
  
  //UPDATE statements
  runSQL("CALL change_password('email1@gmail.com', 'asdfghjkl')",
    "Changed bob's hashed password to asdfghjkl");
  //runSQL("DROP DATABASE bankingapplication;", "Dropped the whole db.");
/*
  runSQL("",
    "");
*/ 
}

function runSQL (sql, printmessage){
  con.query(sql, function(err,rows){
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("database.js: " + printmessage);
    console.log(rows[1]);
  });
}

module.exports = con;