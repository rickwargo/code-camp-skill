/*jslint node: true */
/*jslint todo: true */
'use strict';

var AWS = require('aws-sdk'),
    Config = require('../config/lambda-config');
AWS.config.update({region: Config.region});


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName :  Config.namespace + 'ActivityLog',
    KeySchema: [
        { AttributeName: 'Key', KeyType: 'HASH'},  //Partition key
        { AttributeName: 'When', KeyType: 'RANGE' }  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: 'Key', AttributeType: 'S' },
        { AttributeName: 'When', AttributeType: 'N' }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

dynamodb.createTable(params, function (err, data) {
    if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
    }
});