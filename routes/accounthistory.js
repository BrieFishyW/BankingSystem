var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET account history page. */
router.get('/', function(req, res, next) {
  console.log("accounthistory.js: GET");

  if (!req.session.loggedIn){
    res.redirect("/");
  }

  let objForAcctHistory = {};
  if (req.session.loggedIn) {
    if (!req.session.loggedIn){
      res.redirect("/");
    }
    const email = (req.session.viewingAccount && req.session.accountType == 2 ? req.session.viewingAccount : req.session.email);

    // Get the list of all transactions for them from the database
    let sql = "CALL finance_account_history('" + email + "');";
    dbCon.query(sql, function(err, rows) {
      if (err) {
          throw err;
      }
      console.log("accounthistory.js: Transfer history");
      console.log(rows);
      let transfers = rows[0];

      objForAcctHistory.transfers = transfers;
      // Get Account Info
      getAccountInfo(res);
    });



    function getAccountInfo(res){

      let sql = "CALL account_info('" + email + "', @first, @last, @savings_balance, @checking_balance); "
          +"SELECT @first, @last, @savings_balance, @checking_balance;";
      dbCon.query(sql, function(err,rows){
        if (err) {
          throw err;
        }
        console.log("accounthistory.js: showing account info. ");
        console.log(rows[1][0]);
        objForAcctHistory.name = rows[1][0]['@first'] + ' ' + rows[1][0]['@last'];
        objForAcctHistory.savings = rows[1][0]['@savings_balance'];
        objForAcctHistory.checking = rows[1][0]['@checking_balance'];
        
        // Process the transfer data to what the page will use
        let sqlTransfers = objForAcctHistory.transfers;
        let transfers = [];
        console.log("Processing the transfers: ");
        for (let i = 0; i < sqlTransfers.length; i ++){
          transfers[i] = {date:'', to:'', from:'', amount:''};

          // process the dates
          let date = sqlTransfers[i]['date'];
          console.log("Date: "+ date);
          console.log("Type of date: " +typeof date);
          console.log(sqlTransfers[i]);
          let formattedDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() + "\n";
          formattedDate += date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
          transfers[i]['date'] = formattedDate;
          
          // process to and from
          if (sqlTransfers[i]['from_name'] == objForAcctHistory.name) {
            transfers[i]['from'] = sqlTransfers[i]['from_type'];
          } else transfers[i]['from'] = sqlTransfers[i]['from_name'];
          
          if (sqlTransfers[i]['to_name'] == objForAcctHistory.name) {
            transfers[i]['to'] = sqlTransfers[i]['to_type'];
          } else transfers[i]['to'] = sqlTransfers[i]['to_name'];

          // process the amount
          transfers[i]['amount'] = "$" + sqlTransfers[i]['amount'];

          // process the memo
          transfers[i]['memo'] = (sqlTransfers[i]['memo'].length>0? sqlTransfers[i]['memo']: "N/A");
        }

        // replace the transfer info with the new info.
        objForAcctHistory.transfers = transfers;

        // Show the account history page
        console.log(objForAcctHistory);
        res.render('accounthistory', objForAcctHistory); 
      });
    }

  } else {
    res.redirect("/");
  }
});

module.exports = router;