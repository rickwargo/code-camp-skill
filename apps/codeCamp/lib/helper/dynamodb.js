/*jslint node: true */
/*jslint todo: true */
'use strict';

var AWS = require('aws-sdk'),
    promise = require('bluebird'),
    Uuid = require('node-uuid'),
    Config = require('../../config/lambda-config'),
    WhichCamp = require('./whichCamp'),
    Text = require('./text');

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
promise.promisifyAll(Object.getPrototypeOf(dynamodbDoc), {suffix: '_Async'});

var dynamodbHelper = {
    log: function (something, userId) {
        if (!something) {
            // console.log('trying to log nothing.');
            return;
        }

        // Build a bin js script to create the table on DynamoDB
        dynamodbDoc.put_Async({
            TableName: Config.namespace + 'ActivityLog',
            Item: {
                Key: Uuid.v4(),
                What: WhichCamp + ': ' + something,
                When: new Date().getTime(),
                WhenString: new Date().toLocaleString(),
                Who: userId
            }
        // }).catch(function (err) {
        //     console.log('DynamoDB Error on logging: ' + err.message);
        });
    },

    save: function (something) {
        if (!something) {
            console.log(Text.nothingToSave);
            return;
        }
        // This update will only be successful if the Instances counter exists (and increments it)
        dynamodbDoc.update_Async({
            TableName: Config.namespace + 'Somethings',
            Key: {
                Name: something.toLowerCase()
            },
            Value: something + '.value'
        // }).catch(function (err) {
        //     console.error(Text.saveError, JSON.stringify(err, null, 2));
        });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = dynamodbHelper;
