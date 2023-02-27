var express = require('express');
var router = express.Router();

var dbCon = require('../lib/database');

/* GET regrade page. */
router.get('/', function(req, res, next) {
    console.log("adminregrade.js: GET");
    if (req.session.loggedIn && req.session.viewingAccount
        && req.session.accountType == 3) {

      buildRegradePage(req, res, next, "");

    } else {
      res.redirect("/");
    }
});

/* POST regrade page. */
router.post('/', function(req, res, next) {
  console.log("adminregrade.js: POST");

  let accountType = req.body.accountType;
  let viewingAccount = req.session.viewingAccount;
  let message = "";

  let accountTypeNum = 0;
  switch (accountType) {
    case "Customer":
      accountTypeNum = 1;
      break;
    case "Employee":
      accountTypeNum = 2;
      break;  
    case "Admin":
      accountTypeNum = 3;
      break;
    default:
      message = "Choose an account type to change the user to.";
      break;
  }

  // Make sure that if we're changing them to admin, their finance accounts are empty
  if(accountTypeNum == 3){
    let sql = "CALL account_info ('" + viewingAccount + "', @fn, @ln, @savings_balance, @checking_balance); " + 
        "SELECT @savings_balance, @checking_balance;";
      dbCon.query(sql, function(err,rows){
        if (err) {
          console.log(err.message);
          throw err;
        }
        let savings = (+rows[1][0]['@savings_balance']);
        let checking = (+rows[1][0]['@checking_balance']);

        if(savings > 0 || checking > 0) {
          message = "This user has finances in their accounts. They will need to transfer it out before they can be made admin.";
          buildRegradePage(req, res, next, message);
          return;
        } else updateAccount();

      });
    } else updateAccount();
    
  function updateAccount(){
    // Update the account type
    let sql = "CALL regrade_account ('" + viewingAccount + "', " + accountTypeNum + ");";
        dbCon.query(sql, function(err,rows){
          if (err) {
            console.log(err.message);
            throw err;
          }

          buildRegradePage(req, res, next, "Account has been officially regraded.");

        });
      }
    
});

function buildRegradePage(req, res, next, message) {
  // Set up the regrade page
  let viewingAccount = req.session.viewingAccount;

  let sql = "CALL get_account_type ('" + viewingAccount + "', @account_type, @user_name); SELECT @account_type, @user_name;";
  dbCon.query(sql, function(err,rows){
    if (err) {
      console.log(err.message);
      throw err;
    }

    let objForAdminRegrade = {};
    objForAdminRegrade.email=req.session.viewingAccount;
    objForAdminRegrade.accountType = rows[1][0]['@account_type'].charAt(0).toUpperCase() + rows[1][0]['@account_type'].slice(1);
    objForAdminRegrade.name = rows[1][0]['@user_name'];
    objForAdminRegrade.message = message;

    console.log("Message: " + message);


    res.render('adminregrade.ejs', objForAdminRegrade);

  });
}

module.exports = router;