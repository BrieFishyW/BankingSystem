var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require ('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/loginUser');
var registerRouter = require('./routes/register');
var searchRouter = require('./routes/search');
var resultsRouter = require('./routes/results');
var accountRouter = require('./routes/account');
var changePasswordRouter = require('./routes/changePassword');
var accountHistoryRouter = require('./routes/accounthistory');
var transferRouter = require('./routes/transfer');
var adminRegradeRouter = require('./routes/adminregrade');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap-icons")));

// This will set up the database if it doesn't exist.
var dbcon = require('./lib/database');

// Session management to store cookies in a MySQL server (this has a bug, so we assist it by creating the database for it)
var dbSessionPool = require('./lib/sessionPool.js');
var sessionStore = new MySQLStore({}, dbSessionPool);

// Necessary middleware to store session cookies in MySQL
app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret1234',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
cookie : {
  sameSite: 'strict'
}
}));

// Middleware to make session variables available in .ejs template files
app.use(function(req, res, next) {
res.locals.session = req.session;
next();
});

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/loginuser', loginRouter);
app.use('/register', registerRouter);
app.use('/search', searchRouter);
app.use('/results', resultsRouter);
app.use('/account', accountRouter);
app.use('/changePassword', changePasswordRouter);
app.use('/accounthistory', accountHistoryRouter);
app.use('/transfer', transferRouter);
app.use('/regrade', adminRegradeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
