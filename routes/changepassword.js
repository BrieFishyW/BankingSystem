var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET change password page. */
router.get('/', function(req, res, next) {
  if (req.session.loggedIn && req.session.accountType == 3) {
    console.log("changepassword.js: GET");
    // If we are viewing someone elses account, put their name on the page, otherwise put your own name
    const email = (req.session.viewingAccount && req.session.accountType == 3 ? req.session.viewingAccount : req.session.email);
    
    let sql = "CALL account_info ('"+ email +"', @firstname, @lastname, @sb, @cb); SELECT @firstname, @lastname;";
      dbCon.query(sql, function(err, rows) {
      let name = rows[1][0]['@firstname'] +" "+rows[1][0]['@lastname'];
      res.render('changepassword', {name: name});
    });
  }  else {
    res.redirect('/');
  }
});

/* POST page. */
router.post('/', function(req, res, next) {
  if (req.session.loggedIn && req.session.accountType == 3) {
    console.log("changepassword.js: POST");
    const email = (req.session.viewingAccount && req.session.accountType == 3 ? req.session.viewingAccount : req.session.email);
    const hash = req.body.hash;
    const salt = req.body.salt;

    console.log("changepassword.js: email: " + email + " salt: " + salt + " hash: " + hash);
    let sql = "CALL change_password ('"+ email +"', '" + hash + "', '" + salt + "');";
    dbCon.query(sql, function(err, rows) {
      if (err) {
        console.log(err);
        throw err;
      }
      console.log(rows);

      // Get the name 
      let sql = "CALL account_info ('"+ email +"', @firstname, @lastname, @sb, @cb); SELECT @firstname, @lastname;";
        dbCon.query(sql, function(err, rows) {
        let name = rows[1][0]['@firstname'] +" "+rows[1][0]['@lastname'];
        res.render('changepassword', {name: name, message: 'Password successfully updated.'});
      });
    })
    
  }  else {
    res.redirect('/');
  }
});

module.exports = router;