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
/*jslint unparam: true*/
'use strict';


var DynamoDB = require('./dynamodb'),
    Config = require('../../config/lambda-config'),
    Text = require('./text');

var outputFuncs = {
    log: function (msg, request) {
        var userId = 'unknown';
        if (request) {
            userId = request.sessionDetails.userId;
        }
        if (msg) {
            DynamoDB.log(msg, userId);
        }

        return msg;
    },

    // Careful not to clobber the response object!
    say: function (it, request, response, endSession) {
        if (endSession === undefined) { // default endSession to true
            endSession = true;
        }
        it = it || Text.nothingToFind;
        var say_it = it.replace(/\.[Nn][Ee][Tt]/g, ' dot net');  // Help Alexa say dot net better
        response
            .say(say_it)
            .card(Config.applicationName, it)
            .shouldEndSession(endSession);
        return it;
    },

    error: function (err, response) {
        response
            .say(Text.failedResponse)
            .card('Problem', Text.failedResponse + "\n\nError: " + err.message)
            .shouldEndSession(true);
        return Text.failedResponse;
    }

};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = outputFuncs;
