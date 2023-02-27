var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  if (req.session.loggedIn) {
    req.session.viewingAccount = false;
    res.redirect("/account");
  } else {
    res.redirect("/loginuser");
  }

  //res.render('index', { title: 'Express' });
});

router.get('/logout', function(req, res) {
  req.session.destroy(function(err){
    if (err) {
      throw err;
    }
    res.redirect('/');
  });
});

module.exports = router;