var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET transfer page. */
router.get('/', function(req, res, next) {
  console.log("transfer.js: GET");
  if (req.session.loggedIn) {
    buildTransfer(req, res, next, null);
  } else {
    res.redirect("/"); 
  }
});

router.post('/', function(req, res, next){
  console.log("transfer.js: POST");
  let from = req.body.from;
  let to = req.body.to;

  let amount = req.body.amount;
  Math.round(amount * 100) / 100

  let fromId;
  let toId;

  const email = (req.session.viewingAccount && req.session.accountType == 2 ? req.session.viewingAccount : req.session.email);


  let sql = "CALL get_account_ids( '" + email + "', @checking_id, @savings_id); SELECT @checking_id, @savings_id;"
    dbCon.query(sql, function(err,rows){
      if (err) {
        console.log(err.message);
        throw err;
      }
      switch (to){
        case "Savings":
          toId = rows[1][0]['@savings_id'];
          break;
        case "Checking":
          toId = rows[1][0]['@checking_id'];
          break;
        case "Withdrawal":
          toId = 'null';
          break;
        
        console.log("transfer.js: Getting account ID of the to account (if self-transfer): " + toId);
      }
      switch (from){
        case "Savings":
          fromId = rows[1][0]['@savings_id'];
          break;
        case "Checking":
          fromId = rows[1][0]['@checking_id'];
          break;
        case "Deposit":
          fromId = 'null';
          break;
      }
      console.log("transfer.js: Getting account ID of the From account: " + fromId);

      if (toId == 'null' && fromId == 'null') {
        buildTransfer(req, res, next, "Cannot deposit and withdraw at the same time.");
        return;
      }

      if (fromId == 'null' && (to == "Another User (checking)" || to == "Another User (savings)")) {
        buildTransfer(req, res, next, "Cannot deposit to another account.");
        return;
      }

      // Now that we have established the Account ID's, transfer the money over
      if (to != "Another User (checking)" && to != "Another User (savings)" ) 
      {
        let memo= req.body.memo;
        transferMoney(fromId, toId, amount, memo);
      } else anotherUser();
      
    });

    function anotherUser(){
    // Set the fromId
    let otherUserEmail = req.body.otherEmail;
    if (otherUserEmail == email) {
      buildTransfer(req, res, next, "Email must be for a different user's account.");
      return;
    } else {
      // Make sure the account you are trying to transfer to exists and isn't admin
      let sql = "CALL get_account_type('" + otherUserEmail +"', @acct_type, @user_name); SELECT @acct_type, @user_name;"
      dbCon.query(sql, function(err,rows){
        if (err) {
          console.log(err.message);
          throw err;
        }
        let acctType = rows[1][0]['@acct_type'];
        console.log("transfer.js: Getting account type of the recipient: " + acctType);
        if (acctType == 'customer' || acctType == 'employee'){
          // Make the transfer
          let sql2 = "CALL get_account_ids( '" + otherUserEmail + "', @checking_id, @savings_id); SELECT @checking_id, @savings_id;"
          dbCon.query(sql2, function(err,rows){
            if (err) {
              console.log(err.message);
              throw err;
            }
            if (to == "Another User (checking)") toId = rows[1][0]['@checking_id'];
            else toId = rows[1][0]['@savings_id'];
            console.log("transfer.js: Getting account ID of the recipient: " + toId);
            transferMoney(fromId, toId, amount, '');
          });

        } else 
        {
          buildTransfer(req, res, next, "Email must be for a valid account.");
          return;
        }
      });
    }
  }
  

  function transferMoney(fromId, toId, amount, memo) {
    let sql = "CALL make_transfer(" + fromId + ", " + toId + ", " + amount + ", '" + memo + "');";
    dbCon.query(sql, function(err,rows){
      if (err) {
        console.log(err.message);
        throw err;
      }
      console.log("transfer.js: Transfer made from account " + fromId + " to account " + toId + " of amount " + amount + ". ");
      res.redirect('/accountHistory'); 
    });
  }
});

function buildTransfer(req, res, next, message){
  // Display their account page
  const email = (req.session.viewingAccount && req.session.accountType == 2 ? req.session.viewingAccount : req.session.email);

  let sql = "CALL account_info('" + email + "', @first, @last, @savings_balance, @checking_balance); "
        +"SELECT @first, @last, @savings_balance, @checking_balance;";
  dbCon.query(sql, function(err,rows){
    if (err) {
      
      console.log(err.message);
      throw err;
    }
    let accountsInfo = {};
    accountsInfo.name = rows[1][0]['@first'] + ' ' + rows[1][0]['@last'];
    accountsInfo.savings = rows[1][0]['@savings_balance'];
    accountsInfo.checking = rows[1][0]['@checking_balance'];
    accountsInfo.message = message;
    accountsInfo.empManage = (req.session.viewingAccount && req.session.accountType == 2 ? true: false);
    res.render('transfer', accountsInfo);
  });
}

module.exports = router;