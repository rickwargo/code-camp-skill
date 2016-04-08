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
    timeStandardizer = require('./timeStandardizer'),
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

var roomTimeIntentFuncs = {
    handleRoomTimeIntent: function (request, response) {
        var room = request.slot('Room'),
            time = timeStandardizer(request.slot('Time')),
            endSession = true;

        // account for abbreviated words
        if (room) {
            room = room.replace(/\b([A-Z])\. ?/gi, '$1');
        }

        function getRoomPresentations(found) {
            if (!found) {
                return Text.roomNotFound(room);
            }
            response.session('Room', found);         // Save for later room context
            return Cache.getRoomPresentations(found, time);
        }

        function getTimePresentations(found) {
            if (!found) {
                return Text.timeNotFound(room);
            }
            response.session('Time', found);         // Save for lattimeer room context
            return Cache.getTimePresentations(found);
        }

        if (room) {
            return getRoom(room)
                .then(getRoomPresentations)
                .then(function (val) { return Output.say(val, request, response, endSession); })
                .then(function (val) { return Output.log(val, request, response); });
                // .catch(function (err) { return Output.error(err, response); });
        }
        if (time) {
            return getTime(time)
                .then(getTimePresentations)
                .then(function (val) { return Output.say(val, request, response, endSession); })
                .then(function (val) { return Output.log(val, request, response); });
                // .catch(function (err) { return Output.error(err, response); });
        }
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = roomTimeIntentFuncs;
