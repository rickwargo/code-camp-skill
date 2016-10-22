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

// var cheerio = require('cheerio'),
//     request = require('sync-request'),
//     Config = require('../config/lambda-config');
//
// var authenticate = function () {
//     var url = 'https://www.amazon.com/ap/signin?openid.return_to=https://developer.amazon.com/ap_login.html&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.assoc_handle=mas_dev_portal&openid.mode=checkid_setup&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&pageId=mas_dev_portal2&openid.ns=http://specs.openid.net/auth/2.0';
// };
// var getUtterances = function () {
//     var url = 'https://developer.amazon.com/edw/home.html#/skill/' + Config.applicationId + '/intentSchema/list';
//     var res = request('GET', url);
//     var html = res.getBody();
//     var $ = cheerio.load(html);
//     var utterances = $('form').text();
//
//     console.log(utterances);
// };
//
// getUtterances();