var express = require('express');
const { password } = require('../lib/connectionInfo');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET page. */
router.get('/', function(req, res, next) {
  console.log("register.js: GET");
  req.session.destroy(function(err){
    if (err) {
      throw err;
    }
    res.render('register', {});
  });
});

/* POST page. */
router.post('/', function(req, res, next) {
    
    console.log("register.js: POST");
    const firstname = req.body.fName;
    const lastname = req.body.lName;
    const email = req.body.email;
    const hash = req.body.hash;
    const salt = req.body.salt;

    console.log("register.js: email: " + email + " salt: " + salt + " hash: " + hash);
    let sql = "CALL register_user (?, ?, ?, ?, ?, @result); SELECT @result;";
    dbCon.query(sql, [email, firstname, lastname, hash, salt], function(err, rows) {
      if (err) {
        throw err;
      }
      if (rows[1][0]['@result'] == 0){
        
        // Set session variables
        req.session.email = email;
        req.session.loggedIn = true;

        // Since session updates aren't synchronous and automatic because they are inserted into the MySQL database
        // we have to wait for the database to come back with a result.  req.session.save() will trigger a function when 
        // the save completes
        req.session.save(function(err) {
          if (err) {
            throw err;
          }
          console.log("register.js: Successful registration, a session field is: " + req.session.email);
          
          // Redirect the user to the home page.  Let that redirect the user to the next correct spot.
          res.redirect('/');
        });
      } else {
        // This user account already exists
        console.log("register.js: Email already exists.  Reload register page with that message.");
        res.render('register', {message: "An account with email '" + email + "' already exists"});
      }
    })
    
    //res.redirect('/login');
});

module.exports = router;