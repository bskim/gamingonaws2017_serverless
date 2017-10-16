var AWS = require('aws-sdk');
var DOC = require('dynamodb-doc');
var dynamo = new DOC.DynamoDB();

exports.handler = function(event, context) {
   var cb = function(err, data) {
      if(err) {
         console.log('error on GetDemoSAInfo: ',err);
         context.done('Unable to retrieve information', null);
      } else {
         if(data.Items) {
             data.Items.forEach(function(elem) {
               console.log( elem.username + ": ",elem.score);
            });
            data.Items.sort(function(a,b) { return parseInt(b.score) - parseInt(a.score) } );
             context.done(null, data.Items);
         } else {
             context.done(null, {});
         }
      }
   };

   dynamo.scan({TableName:"DemoUserScore"}, cb);

};
