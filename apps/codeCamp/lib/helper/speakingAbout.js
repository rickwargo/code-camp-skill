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
    timeStandardizer = require('../helper/timeStandardizer'),
    Text = require('./text'),
    Output = require('./output');

if (!process.env.SERVER || process.env.SERVER !== 'Local') {    // Provide long stack traces when running locally (in active development mode)
    promise.longStackTraces();
}

// returns a list of matching speaker names (0 or more)
function getSpeakerName(speaker) {
    return Cache.findSpeakersMatching(speaker);
}

var speakingAboutIntentFuncs = {
    handleSpeakingAboutIntent: function (request, response) {
        var speaker = request.slot('Speaker', 'unknown'),
            time = timeStandardizer(request.slot('Time')),
            endSession = true;
        if (speaker === 'unknown' && response.session('Speaker')) {
            speaker = response.session('Speaker');   // Use speaker context
        }

        // If the list is zero or one name, get the about or a message it does not exist
        // If the list is more than one name, ask which speaker is desired
        function getSpeakerPresentationsOrRefineList(list) {
            response.session('refine.list', 0);

            if (list.length === 0) {                    // Return the about for the speaker
                response.session('Speaker', speaker);   // Save for later speaker context
                return Cache.getSpeakerPresentations(speaker, time);
            }

            if (list.length === 1) {                    // Return the about for the speaker
                response.session('Speaker', list[0]);   // Save for later speaker context
                return Cache.getSpeakerPresentations(list[0], time);
            }

            // need to ask which name the user wants
            // another intent will handle it, give that intent some context
            endSession = false;
            response.session('refine.list', 1);
            return Text.whichSpeaker(list.length, speaker) + '?' + Text.join(list) + '?';
        }

        return getSpeakerName(speaker)
            .then(getSpeakerPresentationsOrRefineList)
            .then(function (val) { return Output.say(val, request, response, endSession); })
            .then(function (val) { return Output.log('[SpeakingAbout] ' + val, request); });
            // .catch(function (err) { return Output.error(err, response); });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = speakingAboutIntentFuncs;
