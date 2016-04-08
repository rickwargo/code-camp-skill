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
    log: function (msg, request, response) {
        if (!process.env.SERVER || process.env.SERVER !== 'Local') {    // Don't log in active development mode
            DynamoDB.log(msg, request.sessionDetails.userId);
        }
    },

    // Careful not to clobber the response object!
    say: function (it, request, response, endSession) {
        if (endSession === undefined) { // default endSession to true
            endSession = true;
        }
        it = it || Text.nothingToFind;

        response
            .say(it)
            .card(Config.applicationName, it)
            .shouldEndSession(endSession);
    },

    error: function (err, response) {
        return response
            .say(Text.failedResponse)
            .card('Problem', Text.failedResponse + "\n\nError: " + err.message)
            .shouldEndSession(true);
    }

};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = outputFuncs;
