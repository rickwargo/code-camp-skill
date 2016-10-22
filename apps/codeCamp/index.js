/*jslint node: true */
/*jslint todo: true */
/*jslint unparam: true*/
'use strict';

// Update the AWS Region once in the beginning
var AWS = require('aws-sdk'),
    Config = require('./config/lambda-config');
AWS.config.update({region: Config.region});

var Alexa = require('./vendor/alexa-app'),
    AboutSpeakerHelpers = require('./lib/helper/aboutSpeaker'),
    SpeakingAboutHelpers = require('./lib/helper/speakingAbout'),
    BadgeHelpers = require('./lib/helper/byBadge'),
    RoomTimeHelpers = require('./lib/helper/roomTime'),
    TimeHelpers = require('./lib/helper/time'),
    SessionHelpers = require('./lib/helper/session'),
    SessionInfoHelpers = require('./lib/helper/sessionInfo'),
    ReportHelpers = require('./lib/helper/report'),
    Text = require('./lib/helper/text');

// Define an alexa-app
var alexaApp = new Alexa.app(Config.applicationName);

alexaApp.launch(function (request, response) {
    response
        .say(Text.setupPrompt)
        .shouldEndSession(false, Text.simpleHelp);
});

// Ensure it is our intended application sending the requests
alexaApp.pre = function (request, response, type) {
    if (request.sessionDetails.application.applicationId !== Config.applicationId) {
        // Fail ungracefully
        //console.log('Invalid applicationId: ' + request.sessionDetails.application.applicationId);
        //throw 'BAD_APP_ID';
        response.fail('Invalid applicationId: ' + request.sessionDetails.application.applicationId);
    }
    // SessionStore.restore(request.sessionDetails.userId, response.response);
};

// alexaApp.post = function (request, response) {
//     SessionStore.save(request.sessionDetails.userId, response.response.sessionAttributes);
// };

function allGood(response) {
    response.send();
}

function oops(response) {
    response
        .clear()
        .say(Text.failedResponse)
        .shouldEndSession(true)
        .fail();
}

function handleIntentHelper(request, response, handler) {
    if (handler) {
        handler(request, response)
            .then(function () {
                allGood(response);
            })
            .catch(function () {
                oops(response);
            });
    }
    return false;   // Using a promise/asynchronous model for completion. Return false to handle ourselves.
}

// To keep the intents() code size small, most of the work is moved to a Helper function

alexaApp.intent('AboutSpeakerIntent',
    {
        slots: {
            Speaker: 'LIST_OF_SPEAKERS'
        },
        slot_types: [
            {
                name: 'Speaker',
                values: Text.speakerList
            }
        ],
        utterances: [
            'Tell me about {Speaker}',
            'Who is {Speaker}',
            'about {Speaker}'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, AboutSpeakerHelpers.handleAboutSpeakerIntent);
    });

alexaApp.intent('ChooseSpeakerIntent',
    {
        slots: {
            Speaker: 'LIST_OF_SPEAKERS'
        },
        slot_types: [
            {
                name: 'Speaker',
                values: Text.speakerList
            }
        ],
        utterances: [
            'I (want|meant|said) {Speaker}',
            '{Speaker}'
        ]
    },
    function (request, response) {
        // Depending on where this requested was sourced, take different paths
        var func = null;

        switch (request.session('$Intent')) {
        case 'SpeakingAboutIntent':
            func = SpeakingAboutHelpers.handleSpeakingAboutIntent;
            break;
        case 'AboutSpeakerIntent':
            func = AboutSpeakerHelpers.handleAboutSpeakerIntent;
            break;
        case 'IsSpeakerHereIntent':
            func = AboutSpeakerHelpers.handleIsSpeakerHereIntent;
            break;
        default:
            func = AboutSpeakerHelpers.handleAboutSpeakerIntent;
            break;
        }
        return handleIntentHelper(request, response, func);
    });

alexaApp.intent('IsSpeakerHereIntent',
    {
        slots: {
            Speaker: 'LIST_OF_SPEAKERS'
        },
        slot_types: [
            {
                name: 'Speaker',
                values: Text.speakerList
            }
        ],
        utterances: [
            '(Was|Is) ({Speaker}|he|she) (here|speaking|presenting) (|today)',
            '(|If) ({Speaker}|he|she) (|is|was) (here|speaking|presenting) (|today)',
            'Are they (here|speaking|presenting) (|today)'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, AboutSpeakerHelpers.handleIsSpeakerHereIntent);
    });

alexaApp.intent('SpeakingAboutIntent',
    {
        slots: {
            Speaker: 'LIST_OF_SPEAKERS',
            Time: 'LIST_OF_TIMES'
        },
        slot_types: [
            {
                name: 'Speaker',
                values: Text.speakerList
            },
            {
                name: 'Time',
                values: Text.timeList
            }
        ],
        utterances: [
            'What (was|is) (he|she|{Speaker}) (speaking|presenting) (|on|about) (|earlier|today|now|next|later|at {Time})',
            'What (he|she|{Speaker}) (was|is) (speaking|presenting) (|on|about) (|earlier|today|now|next|later|at {Time})',
            'What are they (speaking|presenting) (on|about) (|earlier|today|now|next|later|at {Time})',
            'Where (was|is) (he|she|{Speaker}) (speaking|presenting) (|on|about) (|earlier|today|now|next|later|at {Time})',
            'Where (he|she|{Speaker}) (was|is) (speaking|presenting) (|on|about) (|earlier|today|now|next|later|at {Time})',
            'What time (was|is) (he|she|{Speaker}) (speaking|presenting) (|earlier|today|now|next|later)'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, SpeakingAboutHelpers.handleSpeakingAboutIntent);
    });

alexaApp.intent('RoomTimeIntent',
    {
        slots: {
            Room: 'LIST_OF_ROOMS',
            Time: 'LIST_OF_TIMES'
        },
        slot_types: [
            {
                name: 'Room',
                values: Text.roomList
            },
            {
                name: 'Time',
                values: Text.timeList
            }
        ],
        utterances: [
            '(What is|What\'s) at {Room}',
            '(What|Which) (session|presentation) (was|is) in (|room) {Room} at {Time}',
            '(What|Which) (session|presentation)(|s) (were|are) in (|room) {Room}',
            '(What|Which) (session|presentation)(|s) (were|are) at {Time}',
            '(What is|What\'s) the (|next) (session|presentation)(|s) in {Room}',
            '(What is|What\'s) the (|next) (session|presentation)(|s) at {Time}',
            '(What is|What\'s) in {Room}',
            '(What is|What\'s) in {Room} at {Time}',
            '(What is|What\'s) at {Time}'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, RoomTimeHelpers.handleRoomTimeIntent);
    });

alexaApp.intent('TimeIntent',
    {
        slots: {
            Time: 'LIST_OF_TIMES'
        },
        slot_types: [
            {
                name: 'Time',
                values: Text.timeList
            }
        ],
        utterances: [
            'What (is the time of|time is) the next (session|presentation)',
            'What time the next (session|presentation) is'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, TimeHelpers.handleTimeIntent);
    });

alexaApp.intent('SessionIntent',
    {
        slots: {
            Session: 'LIST_OF_SESSIONS'
        },
        slot_types: [
            {
                name: 'Session',
                values: Text.sessionPhrases
            }
        ],
        utterances: [
            'Are there any (presentation|session)(|s) (on|about) {Session}',
            'What (presentation|session)(|s) (is|are) (on|about) {Session}',
            'Find (presentation|session)(|s) (on|about) {Session}',
            '(Give|Tell|Show|Say) (|me) (|about) (presentation|session)(|s) (on|about|matching|like|similar to) {Session}'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, SessionHelpers.handleSessionIntent);
    });

// Step 2: Code it.
//  Note this is a copy of SessionIntent as it is very similar.
alexaApp.intent('SessionInfoIntent',
    {
        slots: {
            SessionName: 'LIST_OF_MORE_COMPLETE_SESSIONS'
        },
        slot_types: [
            {
                name: 'SessionName',
                values: Text.moreCompleteSessionPhrases()
            }
        ],
        utterances: [
            'Tell me about {SessionName}',
            'What is {SessionName} about',
            'Tell me about the {SessionName} session'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, SessionInfoHelpers.handleSessionInfoIntent);
    });

alexaApp.intent('ListSpeakersByBadgeIntent',
    {
        slots: {
            Badge: 'LIST_OF_BADGES'
        },
        slot_types: [
            {
                name: 'Badge',
                values: Text.badgeList
            }
        ],
        utterances: [
            '(Which|What) (Speaker|Presenter)(|s) (is|are|from) {Badge}',
            'List (|all) {Badge} (|Speakers|Presenters)',
            'Who are (|the) {Badge} (|Speakers|Presenters)',
            'Who (|here) (is|are) from {Badge}'
        ]
    },
    function (request, response) {
        return handleIntentHelper(request, response, BadgeHelpers.handleListSpeakersByBadgeIntent);
    });

// Step 2: Define the Intent
// alexaApp.intent('MostPopularSpeakerIntent',
//     {
//         utterances: [
//             '(Name of|Who is) the (most popular|favorite) (speaker|presenter|person)',
//             'Who do people ask about (|most|most often)',
//             'Who is the bomb'
//         ]
//     },
//     function (request, response) {
//         return handleIntentHelper(request, response, ReportHelpers.handleMostPopularSpeakerIntent);
//     });

// Following are the default intents (delete the unused intents if desired)
alexaApp.intent('AMAZON.CancelIntent',
    function (request, response) {
        response
            .say(Text.goodbye)          // Or cancel a transaction or task (but remain in the skill)
            .shouldEndSession(true);
    });

alexaApp.intent('AMAZON.HelpIntent',
    function (request, response) {
        response
            .say(Text.help)
            .shouldEndSession(false, Text.simpleHelp);
    });

alexaApp.intent('AMAZON.YesIntent',
    function (request, response) {
        response
            .say('Let the user provide a positive response to a yes/no question for confirmation.')
            .shouldEndSession(false, Text.simpleHelp);
    });

alexaApp.intent('AMAZON.NoIntent',
    function (request, response) {
        response
            .say('Let the user provide a negative response to a yes/no question for confirmation.')
            .shouldEndSession(false, Text.simpleHelp);
    });

alexaApp.intent('AMAZON.RepeatIntent',
    function (request, response) {
        response
            .say('Let the user request to repeat the last action.')
            .shouldEndSession(false, Text.simpleHelp);
    });

alexaApp.intent('AMAZON.StartOverIntent',
    function (request, response) {
        response
            .say('Let the user request to restart an action, such as restarting a game or a transaction.')
            .shouldEndSession(false, Text.simpleHelp);
    });

alexaApp.intent('AMAZON.StopIntent',
    function (request, response) {
        response
            .say(Text.goodbye)              // Or let the user stop an action (but remain in the skill)
            .shouldEndSession(true);
    });

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = alexaApp;
