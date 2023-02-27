var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET page. */
router.get('/', function(req, res, next) {
  console.log("search.js: GET");

  if ( !req.session.loggedIn || req.session.accountType !=2 && req.session.accountType !=3 ){
    res.redirect("/");
  }

  req.session.viewingAccount = false;
  res.render('search', {
    accountType: req.session.accountType
  });
});

/* POST page */
router.post('/', function(req, res) {
  console.log("search.js: POST");

  if ( !req.session.loggedIn || req.session.accountType !=2 && req.session.accountType !=3 ){
    res.redirect("/");
  }

  req.session.viewingAccount = false;

  let firstName = req.body.fName;
  let lastName = req.body.lName;
  let email = req.body.email;

  let objForResults = {};
  objForResults.firstName = firstName;
  objForResults.lastName = lastName;
  objForResults.email = email;

  if (firstName == "") firstName = "null"; 
    else firstName = "'" + firstName + "'";
  if (lastName == "") lastName = "null"; 
    else lastName = "'" + lastName + "'";
  if (email == "") email = "null"; 
    else email = "'" + email + "'";

  console.log("Searching for: " + firstName + " " + lastName + ": " + email);

  let sql = "CALL account_search(" + firstName + ", " + lastName + ", " + email + ");"
  dbCon.query(sql, function(err, rows) {
    if (err) {
      throw err;
    }
    
    console.log(rows[0]);
    objForResults.searchResults = rows[0];

    // employees can only look up customers
    if(req.session.accountType == 2) {
      let newArray = []
      let newIndex = 0;
      for (let i = 0; i < rows[0].length; i ++){
        if (rows[0][i].account_type == "customer") {
          newArray [newIndex] = rows[0][i];
          newIndex ++;
        }
      }
      objForResults.searchResults = newArray;
    }

    res.render('results', objForResults);
  });

});

module.exports = router;