var express = require('express');
var router = express.Router();

//var dbCon = require('../lib/database');

/* GET page. */
router.get('/', function(req, res, next) {
  console.log("register.js: GET");
  res.render('register', {});
});

/* POST page. */
router.post('/', function(req, res, next) {
    /*
    console.log("register.js: POST");
    let name = req.body.name;
    let email = req.body.email;
    let gender = req.body.gender;
    let education = req.body.education;
    let hash = req.body.hash;
    let salt = req.body.salt;

    let sql = "INSERT INTO users (fullname, email, gender, education, pass) VALUES ('" +
                                name + "', '" +
                                        email + "', '" +
                                              gender + "', '" +
                                                      education + "', '" +
                                                                hash + "');";
    console.log("create.js: sql statement is: " + sql);
    dbCon.execute(sql, function(err, results, fields) {
      if (err) {
        throw err;
      }
      console.log("Inserted user");
    })
    */
    res.redirect('/login');
});

module.exports = router;