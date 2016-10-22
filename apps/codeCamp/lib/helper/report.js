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

var promise = require('bluebird'),
    Cache = require('../db/dataCache'),
    Text = require('./text'),
    Output = require('./output');

if (!process.env.SERVER || process.env.SERVER !== 'Local') {    // Provide long stack traces when running locally (in active development mode)
    promise.longStackTraces();
}

function findMostPopularSpeaker() {
    return Cache.findMostPopularSpeaker();
}

var reportingIntentFuncs = {
    // Step 3: Handle the Intent
    handleMostPopularSpeakerIntent: function (request, response) {
        var endSession = true;

        return findMostPopularSpeaker()
            .then(function (val) {
                var msg = Text.mostPopularSpeaker(val[0], val[1]);
                return Output.say(msg, request, response, endSession);
            })
            .then(function (val) { return Output.log('[Session] ' + val, request, response); });
        // .catch(function (err) { return Output.error(err, response); });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = reportingIntentFuncs;
