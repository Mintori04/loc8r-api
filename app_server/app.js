var createError = require('http-errors');
var express = require('express');
var path = require('path');
var fs = require('fs');
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

// API가 아닌 모든 요청을 Angular 앱으로 전달 (SPA fallback)
app.get('*', (req, res, next) => {
  // API 요청은 제외
  if (req.path.startsWith('/api')) {
    return next();
  }

  // 가능한 경로들
  const possiblePaths = [
    path.join(__dirname, '../app_public/dist/loc8r-public/index.html'),
    path.join(__dirname, '../app_public/build/browser/index.html'),
    path.join(__dirname, '../app_public/dist/loc8r-public/browser/index.html'),
    path.join(__dirname, 'app_public/build/browser/index.html'),
    path.join(__dirname, 'app_public/dist/loc8r-public/index.html')
  ];

  // 파일이 존재하는 첫 번째 경로 찾기
  let foundPath = null;
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      foundPath = filePath;
      break;
    }
  }

  if (foundPath) {
    res.sendFile(foundPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        next(err);
      }
    });
  } else {
    console.error('index.html not found in any of these paths:');
    possiblePaths.forEach(p => console.error('  -', p));
    next(createError(404));
  }
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
