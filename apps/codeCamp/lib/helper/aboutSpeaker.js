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

// returns a list of matching speaker names (0 or more)
function getSpeakerName(speaker) {
    return Cache.findSpeakersMatching(speaker);
}

var aboutSpeakerIntentFuncs = {
    handleIsSpeakerHereIntent: function (request, response) {
        var speaker = request.slot('Speaker', 'unknown'),
            endSession = true;
        if (speaker === 'unknown' && response.session('Speaker')) {
            speaker = response.session('Speaker');   // Use speaker context
        }

        function whenAndWhere(list) {
            var i, value = '';
            if (list.length > 0) {
                value = 'Yes, ' + Text.speakingAtCountSessions(list.length, speaker);
                for (i = 0; i < list.length; i += 1) {
                    if (i > 0) {
                        value += ' And ';
                    }
                    value += Text.presentationWhenWhere(list[i]);
                }
            } else {
                value = Text.speakerNotFound(speaker);
            }

            return value;
        }

        function isHereOrRefineList(list) {
            response.session('refine.list', 0);

            if (list.length === 0) {                    // Return the about for the speaker
                //response.session('Speaker', '');       // Speaker is not here
                return Text.isNotHere(speaker);
            }

            if (list.length === 1) {                    // Return the about for the speaker
                response.session('Speaker', list[0]);    // Save for later speaker context
                return Cache.getSessionsForSpeaker(list[0])
                    .then(whenAndWhere);
            }

            // need to ask which name the user wants
            // another intent will handle it, give that intent some context
            endSession = false;
            response.session('refine.list', 1);
            return Text.whichSpeaker(list.length, speaker) + '?' + Text.join(list) + '?';
        }

        return getSpeakerName(speaker)
            .then(isHereOrRefineList)
            .then(function (val) { return Output.say(val, request, response, endSession); })
            .then(function (val) { return Output.log(val, request, response); });
            // .catch(function (err) { return Output.error(err, response); });
    },

    handleAboutSpeakerIntent: function (request, response) {
        var speaker = request.slot('Speaker', 'unknown'),
            endSession = true;
        if (speaker === 'unknown' && response.session('Speaker')) {
            speaker = response.session('Speaker');   // Use speaker context
        }

        // If the list is zero or one name, get the about or a message it does not exist
        // If the list is more than one name, ask which speaker is desired
        function getAboutForSpeakerOrRefineList(list) {
            response.session('refine.list', 0);

            if (list.length === 0) {                    // Return the about for the speaker
                response.session('Speaker', speaker);   // Save for later speaker context
                return Cache.getAboutForSpeaker(speaker);
            }

            if (list.length === 1) {                    // Return the about for the speaker
                response.session('Speaker', list[0]);   // Save for later speaker context
                return Cache.getAboutForSpeaker(list[0]);
            }

            // need to ask which name the user wants
            // another intent will handle it, give that intent some context
            endSession = false;
            response.session('refine.list', 1);
            return Text.whichSpeaker(list.length, speaker) + '?' + Text.join(list) + '?';
        }

        return getSpeakerName(speaker)
            .then(getAboutForSpeakerOrRefineList)
            .then(function (val) { return Output.say(val, request, response, endSession); })
            .then(function (val) { return Output.log(val, request, response); });
            // .catch(function (err) { return Output.error(err, response); });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = aboutSpeakerIntentFuncs;
