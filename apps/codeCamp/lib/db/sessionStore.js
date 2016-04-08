////////////////////////////////////////////////////////////////////////////////
// Copyright (c) 2015-2016 Rick Wargo. All Rights Reserved.
//
// Licensed under the MIT License (the "License"). You may not use this file
// except in compliance with the License. A copy of the License is located at
// http://opensource.org/licenses/MIT or in the "LICENSE" file accompanying
// this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
////////////////////////////////////////////////////////////////////////////////
/*jslint node: true */
/*jslint todo: true */
'use strict';

var AWS = require('aws-sdk'),
    promise = require('bluebird'),
    Config = require('../../config/lambda-config'),
    Text = require('../helper/text');

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
promise.promisifyAll(Object.getPrototypeOf(dynamodbDoc), {suffix: '_Async'});

function update(obj) {
    var i, prop, val;

    for (i = 1; i < arguments.length; i += 1) {
        for (prop in arguments[i]) {
            if (arguments[i].hasOwnProperty(prop)) {
                if (prop.substring(0, 1) !== '$') { // don't update properties beginning with a $
                    val = arguments[i][prop];
                    if (typeof val === "object") {  // this also applies to arrays or null!
                        update(obj[prop], val);
                    } else {
                        obj[prop] = val;
                    }
                }
            }
        }
    }
    return obj;
}

var sessionStore = {
    restore: function (userId, response) {
        dynamodbDoc.get_Async({
            TableName: Config.namespace + 'SessionStore',
            Key: {
                UserId: userId,
                AppId: Config.applicationId
            }
        }).then(function (data) {
            if (data.Item) {
                update(response.sessionAttributes, data.Item.Attributes);
            }
        // }).catch(function (err) {
        //     console.error(Text.retrieveError, err);
        });
    },

    save: function (userId, attributes) {
        dynamodbDoc.put_Async({
            TableName: Config.namespace + 'SessionStore',
            Item: {
                UserId: userId,
                AppId: Config.applicationId,
                Attributes: attributes
            }
        // }).catch(function (err) {
        //     console.error(Text.saveError, err);
        //     return err;
        });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = sessionStore;
