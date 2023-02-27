var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET account page. */
router.get('/', function(req, res, next) {
  console.log("account.js: GET");

  if (!req.session.loggedIn){
    res.redirect("/");
  }

  buildAccountPage(req, res, next);
});


/* POST account page. */
router.post('/', function(req, res, next) {
  console.log("account.js: POST");

  if (!req.session.loggedIn){
    res.redirect("/");
  }

  req.session.viewingAccount = req.body.email;
  
  buildAccountPage(req, res, next);
});

function buildAccountPage(req, res, next){

  console.log("Account.js: Info:");
  console.log("viewingAccount: " + req.session.viewingAccount);
  console.log("accountType: " + req.session.accountType);

  let accountsInfo = {}; // Holds info that is sent to the page
  accountsInfo.anotherAccount = false; // We assume they are looking at their own account

  // If they are admin or emp, make sure if they're going to see that account. 
  let email = req.session.email;
  if ((req.session.accountType == 2 || req.session.accountType == 3) && req.session.viewingAccount) {
    email = req.session.viewingAccount;
    accountsInfo.anotherAccount = true;
  }

  let sql = "CALL account_info('" + email + "', @first, @last, @savings_balance, @checking_balance); "
        +"SELECT @first, @last, @savings_balance, @checking_balance;";
  dbCon.query(sql, function(err,rows){
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("account.js: showing account info. ");
    console.log(rows[1][0]);

    accountsInfo.name = rows[1][0]['@first'] + ' ' + rows[1][0]['@last'];
    accountsInfo.savings = rows[1][0]['@savings_balance'];
    accountsInfo.checking = rows[1][0]['@checking_balance'];
    accountsInfo.accountType = req.session.accountType;
    
    res.render('account', accountsInfo);
    });
}

module.exports = router;