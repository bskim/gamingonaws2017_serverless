var AWS = require('aws-sdk');
var cognitoidentity = new AWS.CognitoIdentity();

exports.handler = (event, context) => {
  // Sample code to act as auth server with Kakao Login

  var authInfo  = require('querystring').parse(event.querystring);

  var userid = authInfo['id'];
  var access_token = authInfo['access_token'];
  var expires = authInfo['expires_in'];

  var http = require('https');

  var options = {
    host: "kapi.kakao.com",
    path: "/v1/user/access_token_info",
    headers: {"Authorization": "Bearer "+ access_token}
  };

  console.log("start Kakao auth confirm");

  http.get(options, function(res) {
    console.log("Got response:" + res.statusCode);
    if (res.statusCode == 200) {
      // Only enter here when Kakao gave us a confirmation

      var kakaoresponse = "";
      res.on("data", function(chunk) {
        kakaoresponse += chunk;
      })
      res.on("end", function() {
        var obj = JSON.parse(kakaoresponse);

        var useridfromkakao = obj.id;
        var expireinMillis = obj.expireinMillis;
        var appId = obj.appId;

        var params = {
          IdentityPoolId: 'ap-northeast-2:ec9c3b33-ee3e-45a0-a0c5-5abcd1e774fb', /* required */
          Logins: { /* required */
            'gamingonaws.auth': useridfromkakao.toString()
          }, 
          TokenDuration: 1000
        };
        console.log("userid" + useridfromkakao);
        console.log(expireinMillis);
        console.log(appId);
        cognitoidentity.getOpenIdTokenForDeveloperIdentity(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else {
            console.log(data);           // successful response
            context.done(null, data);
          }
        });
        // End of Cognito call
      });
    } else {
      // Because KAKAO returned 400 or 401 error - means auth check failed 
    }
  });
};