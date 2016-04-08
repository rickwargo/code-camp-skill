/*jslint node: true */
'use strict';

var promise = require('bluebird');
var AWS = require('aws-sdk'),
    Config = require('../config/lambda-config');
AWS.config.update({region: Config.region});
var DynamoDB = require('./helper/dynamodb');
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var WhichCamp = require('./helper/whichCamp');

console.log('Welcome to the playground');
promise.promisifyAll(Object.getPrototypeOf(dynamodbDoc), {suffix: '_Async'});

/////////////////////////////////////////////////////////////////////////////
