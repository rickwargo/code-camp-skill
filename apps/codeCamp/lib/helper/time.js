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
    moment = require('moment'),
    timeStandardizer = require('./timeStandardizer'),
    Cache = require('../db/dataCache'),
    Text = require('./text'),
    Output = require('./output');

if (!process.env.SERVER || process.env.SERVER !== 'Local') {    // Provide long stack traces when running locally (in active development mode)
    promise.longStackTraces();
}

function getRoom(room) {
    return Cache.findRoomMatching(room);
}

function getTime(time) {
    time = timeStandardizer(time);
    return Cache.findTimeMatching(time);
}

var timeIntentFuncs = {
    handleTimeIntent: function (request, response) {
        var time = timeStandardizer(request.slot('Time')),
            endSession = true,
            tm,
            now;

        if (!time) {
            now = new Date();
            if (now.getTimezoneOffset() === 0) {
                // TODO: Should really get timezone offset for America/New_York and use that instead of -4
                now = new Date(now.getTime() - 4 * 3600 * 1000);
            }
            tm = moment(now);

            if (tm.isBefore(moment('08:30am', 'hh:mma'))) {
                time = '08:30am';
            } else if (tm.isBefore(moment('10:00am', 'hh:mma'))) {
                time = '10:00am';
            } else if (tm.isBefore(moment('11:30am', 'hh:mma'))) {
                time = '11:30am';
            } else if (tm.isBefore(moment('01:30pm', 'hh:mma'))) {
                time = '01:30pm';
            } else if (tm.isBefore(moment('01:30pm', 'hh:mma'))) {
                time = '03:00pm';
            } else {
                time = '08:30am next year. There are no more sessions. See you next year!';
            }

            return promise.resolve(Text.nextSessionTime(time))
                .then(function (val) { return Output.say(val, request, response, endSession); })
                .then(function (val) { return Output.log(val, request, response); });
                // .catch(function (err) { return Output.error(err, response); });
        }
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = timeIntentFuncs;
