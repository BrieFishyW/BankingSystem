var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET page. */
router.get('/', function(req, res, next) {
  console.log("loginuser.js: GET");
  res.render('loginuser', {});
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log("loginuser.js: POST");
    console.log("The logged in variable is '" + req.session.loggedIn + "'");
    console.log("The email in variable is '" + req.body.email + "'");
    console.log("The hashedPassword in variable is '" + req.body.hashedPassword + "'");
    if (req.body.hashedPassword) {
      // User is submitting user/password credentials
      const email = req.session.email;
      const hashedPassword = req.body.hashedPassword;

      const sql = "CALL login_user ('" + email + "', '" + hashedPassword + "', @account_type); SELECT @account_type";
      dbCon.query(sql, function(err, results) {
          if (err) {
              throw err;
          }
          console.log("loginuser.js: Obtained result from accounts table below");
          console.log(results);
          
          console.log(results[1]);
          console.log(results[1][0]);
          console.log(results[1][0]['@account_type']);
          if (results[1][0]['@account_type'] === undefined || results[1][0]['@account_type'] == 0) {
              console.log("loginuser.js: No login credentials found");
              res.render('loginuser', {message: "Password not valid for user '" + email + "'.  Please log in again."});
          }
          else {
              console.log("loginuser.js: Credentials matched");
              req.session.loggedIn = true;
              req.session.accountType = results[1][0]['@account_type'];
              req.session.viewingAccount = false;
              res.redirect("/");
          }
      });
  } 
  else if (req.body.email != "") {
    const email = req.body.email;
    console.log("loginuser.js: email is: " + email);
    const sql = "CALL get_salt('" + email + "', @salt); SELECT @salt;";
    dbCon.query(sql, function(err, results) {
        if (err) {
            throw err;
        }
        console.log(results[1][0]);
        console.log(results[1][0]['@salt']);
        if (results[1][0]['@salt'] === undefined || results[1][0]['@salt'] === null || results[1][0]['@salt'] == '') {
            console.log("loginuser: No results found");
            res.render('loginuser', {message: "User '" + email + "' not found"});
        } else {
            const salt = results[1][0]['@salt'];
            req.session.email = email;
            req.session.salt = salt;
            console.log("email: " + email + " salt: " + salt);
            res.render('loginpassword', {
                email: email,
                salt: salt});
        }
    });

  }

});

/*
const email = req.body.email;
      console.log("loginuser.js: email is: " + email);
      const sql = "CALL get_salt('" + email + "', @salt); SELECT @salt;";
      ///
      console.log("loginuser.js: sql: " + sql);
      dbCon.query(sql, function(err, results) {
          if (err) {
              throw err;
          }
          if (results[1][0]['@salt'] === undefined) {
              console.log("loginuser: No results found");
              res.render('loginuser', {message: "User '" + email + "' not found"});
          } else {
              const salt = results[1][0]['@salt'];
              ///
              console.log("loginuser.js: salt: " + salt);
              req.session.email = email;
              req.session.salt = salt;
              res.render('loginpassword', {
                  email: email,
                  salt: salt});
          }
      });
*/


module.exports = router;