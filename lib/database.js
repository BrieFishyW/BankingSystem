let mysql = require('mysql2');

var dbConnectionInfo = require('./connectionInfo');

var dbCon = mysql.createConnection({
  host: dbConnectionInfo.host,
  user: dbConnectionInfo.user,
  password: dbConnectionInfo.password,
  port: dbConnectionInfo.port,
  multipleStatements: true              // Needed for stored proecures with OUT results
});

dbCon.connect(function(err) {
  if (err) {
    throw err;
  }
  else {
    console.log("database.js: Connected to server!");
    
    //runSQL("DROP DATABASE IF EXISTS bankingapplication;", "Dropped the whole db.");
    
    dbCon.query("CREATE DATABASE IF NOT EXISTS bankingapplication", function (err, result) {
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
  dbCon.query(sql, function(err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: Selected bankingapplication database");
      createTables();
      createStoredProcedures();
      //AddDummyDataToDatabase();
    }
  });
}

function createTables() {
  runSQL("CREATE TABLE IF NOT EXISTS user_type (\n" +
      "user_type_id tinyint NOT NULL, \n" + // ID's for these will be hard coded so that the js can use them
      "user_type VARCHAR(255) NOT NULL, \n" + 
      "PRIMARY KEY (user_type_id) \n" +
    ");",
    "Table user_type created if it didn't already exist.");

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
      "from_account_id INT, \n" + 
      "to_account_id INT, \n" + 
      "date DATETIME(3) NOT NULL, \n" + 
      "amount DECIMAL(14,2) NOT NULL, \n" +
      "memo VARCHAR(255) NOT NULL, \n" +
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
      "SELECT concat(users.firstname, ' ', users.lastname) AS `name`, users.email AS email, \n" +
        "user_type.user_type AS account_type FROM users \n" +
        "JOIN user_type ON users.account_type = user_type.user_type_id \n" +
        "WHERE users.firstname = firstname \n" +
        "OR users.lastname = lastname \n" +
        "OR users.email = email; \n" +
    "END;",
    "Procedure account_search created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `account_info` ( \n" +
      "IN email varchar(255), \n" +
      "OUT firstname varchar(255), \n" +
      "OUT lastname varchar(255), \n" +
      "OUT savings_balance decimal(14,2), \n" +
      "OUT checking_balance decimal(14,2) \n" +
    ") \n" +
    "BEGIN \n" +
      "SELECT users.firstname, users.lastname INTO firstname, lastname FROM users WHERE users.email = email; \n" +
      
      "SELECT finance_account.balance \n" +
        "INTO savings_balance FROM finance_account \n" +
        "INNER JOIN users ON users.user_id = finance_account.owner_id \n" +
        "INNER JOIN finance_account_type ON finance_account.account_type = finance_account_type.account_type_id \n" +
        "WHERE users.email = email AND finance_account_type.account_type = 'savings'; \n" +

      "SELECT finance_account.balance \n" +
        "INTO checking_balance FROM finance_account \n" +
        "INNER JOIN users ON users.user_id = finance_account.owner_id \n" +
        "INNER JOIN finance_account_type ON finance_account.account_type = finance_account_type.account_type_id \n" +
        "WHERE users.email = email AND finance_account_type.account_type = 'checking'; \n" +
    "END;",
    "Procedure account_info created if it didn't already exist.");;

  runSQL("CREATE PROCEDURE IF NOT EXISTS `finance_account_history` ( \n" +
      "IN user_email varchar(255) \n" +
    ") \n" +
    "BEGIN \n" +
    "SELECT from_type.account_type AS from_type, to_type.account_type AS to_type, \n" +
      "CONCAT(users_from.firstname, ' ', users_from.lastname) AS from_name,  \n" +
      "CONCAT(users_to.firstname, ' ' , users_to.lastname) AS to_name,  \n" +
      "users_from.email AS from_email, users_to.email AS to_email, \n" +
      "transfer.date, transfer.memo, amount FROM transfer \n" +

      "JOIN finance_account AS finance_to ON transfer.to_account_id = finance_to.account_id \n" +
      "JOIN users AS users_to ON finance_to.owner_id = users_to.user_id \n" +
      "JOIN finance_account_type AS to_type ON finance_to.account_type = to_type.account_type_id \n" +
      "JOIN finance_account AS finance_from ON transfer.from_account_id = finance_from.account_id \n" +
      "JOIN users AS users_from ON finance_from.owner_id = users_from.user_id \n" +
      "JOIN finance_account_type AS from_type ON finance_from.account_type = from_type.account_type_id \n" +
      "WHERE users_from.email = user_email OR users_to.email = user_email \n" +
    "UNION\n" +
    "SELECT from_type.account_type AS from_type, 'Withdrawal' AS to_type, \n" +
      "CONCAT(users_from.firstname, ' ', users_from.lastname) AS from_name,  \n" +
      "'Withdrawal' AS to_name,  \n" +
      "users_from.email AS from_email, 'Withdrawal' AS to_email, \n" +
      "transfer.date, transfer.memo, amount FROM transfer \n" +
      
      "JOIN finance_account AS finance_from ON transfer.from_account_id = finance_from.account_id \n" +
      "JOIN users AS users_from ON finance_from.owner_id = users_from.user_id \n" +
      "JOIN finance_account_type AS from_type ON finance_from.account_type = from_type.account_type_id \n" +
      "WHERE users_from.email = user_email AND transfer.to_account_id IS NULL\n" +
    "UNION\n" +
    "SELECT 'Deposit' AS from_type, to_type.account_type AS to_type, \n" +
      "'Deposit' AS from_name,  \n" +
      "CONCAT(users_to.firstname, ' ' , users_to.lastname) AS to_name,  \n" +
      "'Deposit' AS from_email, users_to.email AS to_email, \n" +
      "transfer.date, transfer.memo, amount FROM transfer \n" +
      
      "JOIN finance_account AS finance_to ON transfer.to_account_id = finance_to.account_id \n" +
      "JOIN users AS users_to ON finance_to.owner_id = users_to.user_id \n" +
      "JOIN finance_account_type AS to_type ON finance_to.account_type = to_type.account_type_id \n" +
      "WHERE users_to.email = user_email AND transfer.from_account_id IS NULL\n" +
      "ORDER BY `date` DESC; \n" +
    "END;",
    "Procedure finance_account_history created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `get_account_type` ( \n" +
      "IN user_email varchar(255), \n" +
      "OUT account_type varchar(255), \n" +
      "OUT user_name varchar(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "SELECT user_type.user_type, CONCAT(users.firstname, ' ', users.lastname) \n" +
        "INTO account_type, user_name \n" +
      "FROM users JOIN user_type ON user_type.user_type_id = users.account_type \n" +
      "WHERE users.email = user_email; \n" +
    "END;",
    "Procedure get_account_type created if it didn't already exist.")

  // INSERT statements
  runSQL("CREATE PROCEDURE IF NOT EXISTS `create_user_type` ( \n" +
      "IN user_type_name VARCHAR(255), \n" +
      "IN user_type_id TINYINT \n" +
    ") \n" +
    "BEGIN \n" +
      "INSERT INTO user_type (user_type_id, user_type) VALUES (user_type_id, user_type_name); \n" +
      "SELECT user_type.user_type_id FROM user_type WHERE user_type.user_type_id = user_type_id; \n" +
    "END;",
    "Procedure create_user_type created if it didn't already exist.");

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
      "OUT result INT \n" +
    ") \n" +
    "BEGIN \n" +
      "DECLARE nCount INT DEFAULT 0; \n" +
      "DECLARE new_id INT; \n" +
      "SET result = 0; \n" +
      "SELECT Count(*) INTO nCount FROM users WHERE users.email = email; \n" +
      "IF nCount = 0 THEN \n" +
        "INSERT INTO users (email, firstname, lastname, password, salt, account_type) \n" +
        "VALUES (email, firstname, lastname, password, salt, 1); \n" +
        
        "SELECT user_id INTO new_id FROM users where users.email = email;\n" +

        "INSERT INTO finance_account (account_type, owner_id, balance) \n" +
        "VALUES (1, new_id, 0.0); \n" +

        "INSERT INTO finance_account (account_type, owner_id, balance) \n" +
        "VALUES (2, new_id, 0.0); \n" +
      "ELSE\n" +
        "SET result = 1;\n" +
      "END IF;\n" +
    "END;",
    "Procedure register_user created if it didn't already exist.");

  runSQL("CREATE PROCEDURE IF NOT EXISTS `make_transfer` ( \n" +
      "IN from_account_id INT, \n" +
      "IN to_account_id INT, \n" +
      "IN amount DECIMAL(12,2), \n" +
      "IN memo VARCHAR(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "INSERT INTO transfer (from_account_id, to_account_id, amount, memo, date) \n" +
        "VALUES (from_account_id, to_account_id, amount, memo, CURRENT_TIMESTAMP(3)); \n" +
      "UPDATE finance_account SET balance = balance - amount WHERE account_id = from_account_id; \n" +
      "UPDATE finance_account SET balance = balance + amount WHERE account_id = to_account_id; \n" +
    "END;",
    "Procedure make_transfer created if it didn't already exist.");

    runSQL("CREATE PROCEDURE IF NOT EXISTS `get_account_ids` ( \n" +
      "IN email VARCHAR(255), \n" +
      "OUT checking_id INT, \n" +
      "OUT savings_id INT \n" +
    ") \n" +
    "BEGIN \n" +
      "DECLARE userid INT DEFAULT -1; \n" +
      "SELECT user_id INTO userid FROM users WHERE users.email = email; \n" +
      "IF userid > -1 THEN \n" +
        "SELECT account_id INTO checking_id FROM finance_account \n" + 
        "WHERE owner_id = userid AND account_type = 1;\n" +
        "SELECT account_id INTO savings_id FROM finance_account \n" + 
        "WHERE owner_id = userid AND account_type = 2;\n" +
      "ELSE \n" +
        "SET checking_id = -1; \n" +
        "SET savings_id = -1; \n" +
      "END IF; \n" +
    "END;",
    "Procedure get_account_ids created if it didn't already exist.");
    
  // UPDATE statements
  runSQL("CREATE PROCEDURE IF NOT EXISTS `change_password` ( \n" +
      "IN email VARCHAR(255), \n" +
      "IN new_pass VARCHAR(255), \n" +
      "IN new_salt VARCHAR(255) \n" +
    ") \n" +
    "BEGIN \n" +
      "UPDATE users SET password = new_pass, salt = new_salt \n" +
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

  runSQL("CALL create_finance_account_type('checking');",
    "Finance account type 'checking' created");
  runSQL("CALL create_finance_account_type('savings');",
    "Finance account type 'savings' created");
    
  runSQL("CALL register_user('1@1.1', 'bob', 'builder', '86387f92fe297025bd3c6fb48d6a18d6ee32037e97ae1d249c8039ea4f8ea195', '62119ce9ec61809f', @id);",
    "Registered user 'bob builder'"); // password is asdf
  runSQL("CALL register_user('2@2.2', 'ed', 'dy', 'a832768077d9f0c5631948cdc31ecfaf574b4b015a6368ba4b3d7bcc722ce027', '0fa24f9e6f7fabee', @id);",
    "Registered user 'ed dy'"); // password is 123
  runSQL("CALL register_user('3@3.3', 'susan', 'coolest', '08b0e170ff4937b1ee18bad141b333ab00281f5560aa4ee1a2d5b60ea46b1926', 'a3eb5523ff0f857e', @id);",
    "Registered user 'susan coolest'"); // password is jkl;
  runSQL("CALL register_user('admin@a.a', 'admin', 'aa', '60db1f65a6617317ba485b74ac5c0ee67a80d0aef7ca531af6c7f31ac57ea7ad', '7e43af8c89806bcf', @id);",
    "Registered user 'admin aa'"); // password is admin
    
  runSQL("CALL register_user('q@q.q', 'Leah', 'D', '9f9519a49d82cd8fe268a4e5c6756f6c1351bd482dbb90112160af15fbf43d7e', 'c9c513d238b7c372', @id);",
    "Registered user 'Leah D'"); /// password is 852852

  runSQL("CALL regrade_account('1@1.1', 2);",
    "Changed bob builder to employee.");
  runSQL("CALL regrade_account('admin@a.a', 3);",
    "Changed admin aa to admin.");
    runSQL("CALL regrade_account('q@q.q', 3);",
      "Changed Leah D to admin.");

  runSQL("UPDATE `bankingapplication`.`finance_account` SET `balance` = '111.23' WHERE (`account_id` = '6');",
    "Gave Susan Coolest 111.23 in savings.");

  runSQL("UPDATE `bankingapplication`.`finance_account` SET `balance` = '55.64' WHERE (`account_id` = '5');",
    "Gave Susan Coolest 55.64 in checking.");
/*
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
    */
/*
  runSQL("",
    "");
*/ 
}

function runSQL (sql, printmessage){
  dbCon.query(sql, function(err,rows){
    if (err) {
      
      console.log(err.message);
      throw err;
    }
    console.log("database.js: " + printmessage);
    console.log(rows[1]);
  });
}

module.exports = dbCon;