var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();
require('../app_api/models/db');
require('../app_api/config/passport');

// MVC 구조의 라우트들
var indexRouter = require('./routes/index');
var apiRouter = require('../app_api/routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build/browser')));
app.use(express.static(path.join(__dirname, '../app_public/build')));
app.use(express.static(path.join(__dirname, '../app_public/dist/loc8r-public')));

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions))

// CORS 설정
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 라우트 설정
app.use(passport.initialize());
app.use('/api', apiRouter);
// app.use('/', indexRouter);

// app.get('*', (req, res, next) => {
//   res.sendFile(path.join(__dirname, 'app_public', 'build/browser', 'index.html'));
// });

// Angular 앱 라우팅 - 모든 경로를 index.html로 전달 (SPA)
app.get(/(\/about|\/location\/[a-f0-9]{24}|\/login|\/register|\/)?$/, (req, res, next) => {
  const indexPath = path.join(__dirname, '../app_public/dist/loc8r-public/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // dist 폴더가 없으면 build 폴더 시도
      const buildPath = path.join(__dirname, '../app_public/build/browser/index.html');
      res.sendFile(buildPath, (err2) => {
        if (err2) {
          next(err2);
        }
      });
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: "message" + err.name + ": " + err.message });
    return;
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app; 
