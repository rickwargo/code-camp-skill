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

var Cache = require('../db/dataCache'),
    promise = require('bluebird'),
    Text = require('./text'),
    Output = require('./output');

if (!process.env.SERVER || process.env.SERVER !== 'Local') {    // Provide long stack traces when running locally (in active development mode)
    promise.longStackTraces();
}

var badgeIntentFuncs = {
    handleListSpeakersByBadgeIntent: function (request, response) {
        var badge = request.slot('Badge', 'unknown');

        function speakerListByBadge(badge) {
            return Cache.findSpeakersByBadge(badge)
                .then(function (list) {
                    return Text.speakersWithBadge(badge) + Text.join(list, 'speaker', 'and') + '.';
                });
        }

        return speakerListByBadge(badge)
            .then(function (val) { return Output.say(val, request, response); })
            .then(function (val) { return Output.log(val, request, response); });
            // .catch(function (err) { return Output.error(err, response); });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 0;
module.exports = badgeIntentFuncs;
