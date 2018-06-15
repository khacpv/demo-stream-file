const fs = require('fs');
var request = require('request');
var express = require('express');
var crypto = require('crypto');
var moment = require('moment');
var bodyParser = require('body-parser');
var base64url = require('base64-url');
var app = express();
var algorithm = 'aes-256-ctr';
var password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY';
var iv = '60iP0h6vJoEa';

function encrypt(text) {
  var cipher = crypto.createCipher(algorithm, password);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text) {
  var decipher = crypto.createDecipher(algorithm, password);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  res.json({
    msg: 'OK'
  });
});

app.get('/mp4/:token/:checksum', function(req, res) {
  var token = req.params.token;
  var checkSum = req.params.checksum;
  try {
    var hw = JSON.parse(base64url.decode(token));
    console.log(hw);
    if (
      checkSum ===
      crypto
        .createHash('md5')
        .update(base64url.decode(token))
        .digest('hex')
    ) {
      console.log(decrypt(hw));
      var obj = JSON.parse(decrypt(hw));
      console.log(obj);
      if (
        obj.password === 'matmatest' &&
        60000 + parseInt(obj.time) > moment().format('x')
      ) {
        request
          .get(
            'https://upload.wikimedia.org/wikipedia/commons/9/94/Folgers.ogv'
          )
          .pipe(res);
      } else {
        res.json({
          error: 1,
          msg: 'Token error'
        });
      }
    } else {
      res.json({
        error: 1,
        msg: 'Checksum error'
      });
    }
  } catch (e) {
    console.log(e);
    res.json({
      error: 1
    });
  }
  // res.send(req.params.token);
  // request.get('https://upload.wikimedia.org/wikipedia/commons/9/94/Folgers.ogv').pipe(res)
});

app.get('/create/token', function(req, res) {
  var time = moment().format('x');
  var obj = {
    time: time,
    password: 'matmatest'
  };
  var hw = encrypt(JSON.stringify(obj));
  console.log(hw);
  var checkSum = crypto
    .createHash('md5')
    .update(JSON.stringify(hw))
    .digest('hex');
  var token = base64url.encode(JSON.stringify(hw));
  res.json({
    url: 'http://127.0.0.1:8000/mp4/' + token + '/' + checkSum,
    token: token,
    checkSum: checkSum
  });
});

app.listen(80, '0.0.0.0');
