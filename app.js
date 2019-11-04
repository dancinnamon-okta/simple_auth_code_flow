var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const axios = require('axios');

var app = express();
app.use(cookieParser());

const okta_base_url = 'https://oktaorg.okta.com';
const apiam_server = 'default';
const client_id = 'client_id';
const client_secret = 'client_secret';
const token_url = okta_base_url + '/oauth2/' + apiam_server + '/v1/token';

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

//New endpoint that handles the OIDC post from the user.
app.get('/oidc-callback', function(req, res) {
  const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: 'https://zimt.okta.com/oauth2/default' // required
  });

  //Validate State first
  if(!req.query.state || req.query.state != req.cookies['okta-oauth-state']){
      res.send("Invalid OIDC callback- invalid state parameter.")
  }

  if(req.query.code) {
    var token_request_config = {
      method: 'post',
      url: token_url,
      data: 'client_id=' + client_id + '&client_secret=' + client_secret +
      '&grant_type=authorization_code&redirect_uri=http://localhost:3000/oidc-callback&code=' +
      req.query.code
    }

    axios(token_request_config)
      .then(function (response) {
        console.log(response.data.id_token.split('.')[1])
        var utf8encoded = (new Buffer(response.data.id_token.split('.')[1], 'base64')).toString('utf8');
        res.send(utf8encoded)
      })
      .catch(function (error) {
        console.log(error);
        res.send(error.message)
      });
  }
  else {
    res.redirect('/');
  }
});
