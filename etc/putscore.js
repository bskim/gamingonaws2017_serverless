var AWS = require('aws-sdk');
var DOC = require('dynamodb-doc');
var dynamo = new DOC.DynamoDB();

exports.handler = function(event, context) 
    console.log(JSON.stringify(event.username));
  

    var cb = function(err, data) {
        if(err) {
            console.log(err);
            context.fail('unable to update users at this time');
        } else {
            console.log(data);
            context.done(null, data);
        }
    };
    
    var item = {
        username: event.username,
        score: event.score
      };
      
    dynamo.putItem({TableName:”DemoUserScore", Item:item}, cb);
    
};
