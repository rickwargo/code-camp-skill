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
    moment = require('moment'),
    timeStandardizer = require('../helper/timeStandardizer'),
    Config = require('../../config/lambda-config'),
    WhichCamp = require('../helper/whichCamp'),
    Text = require('../helper/text'),
    timesEqual = require('../helper/timesEqual'),
    Output = require('../helper/output');

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
promise.promisifyAll(Object.getPrototypeOf(dynamodbDoc), {suffix: '_Async'});

var speakersByBadge = {};


var dataCache = {
    // If only heard a partial name, set up invoking another function to clarify the name
    findSpeakersMatching: function (name) {
        if (!name) {
            console.log(Text.nothingToFind);
            return null;
        }

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'SpeakerNames',
            ProjectionExpression: 'fullnames',
            FilterExpression: '#name = :name and which = :which',
            ExpressionAttributeValues: {
                ":name": name.toLowerCase(),
                ":which": WhichCamp
            },
            ExpressionAttributeNames: {
                "#name": "name"
            }
        }).then(function (data) {
            var value = [];
            if (data.Count > 0) {
                value = data.Items[0].fullnames;
            }

            return value;
        // }).catch(function (err) {
        //     console.error('findSpeakersMatching dynamoDB Error:', err.message);
        });
    },

    findRoomMatching: function (room) {
        if (!room) {
            console.log(Text.nothingToFind);
            return null;
        }

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'room',
            FilterExpression: 'room_match = :room and which = :which',
            ExpressionAttributeValues: {
                ":room": room.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            var value = '';
            if (data.Count > 0) {   // return the first matching room
                value = data.Items[0].room;
            }

            return value;
        // }).catch(function (err) {
        //     console.error('findRoomMatching dynamoDB Error:', err.message);
        });
    },

    findTimeMatching: function (time) {
        var tm = moment(timeStandardizer(time), 'hh:mma');

        if (!time) {
            console.log(Text.nothingToFind);
            return null;
        }

        if (tm.isBefore(moment('10:00am', 'hh:mma'))) {
            time = '08:30am';
        } else if (tm.isBefore(moment('11:30am', 'hh:mma'))) {
            time = '10:00am';
        } else if (tm.isBefore(moment('01:30pm', 'hh:mma'))) {
            time = '11:30am';
        } else if (tm.isBefore(moment('03:00pm', 'hh:mma'))) {
            time = '01:30pm';
        } else {
            time = '03:00pm';
        }

        return promise.resolve(time);
    },

    getSessionsMatching: function (phrase) {
        if (!phrase) {
            console.log(Text.nothingToFind);
            return null;
        }

        // Perform session name mappings
        phrase = phrase.toLowerCase().replace('dot net', '.net');

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'session_time, speaker, session_name, room',
            FilterExpression: 'contains(session_name_match, :session_name) and which = :which',
            ExpressionAttributeValues: {
                ":session_name": phrase.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            var i, value = '';

            if (data.Count > 1) {
                value += Text.countSessionsMatchingPhrase(data.Count, phrase);
            }
            if (data.Count > 0) {
                for (i = 0; i < data.Count; i += 1) {
                    value += 'At ' + data.Items[i].session_time + ', ' + data.Items[i].speaker + ' is presenting ' + data.Items[i].session_name + '. ';
                    Output.log('<session> ' + data.Items[i].session_name.toLowerCase());
                }
            } else {
                value = Text.sessionsNotFound(phrase);
            }

            return value.trim();
        // }).catch(function (err) {
        //     console.error('getSessionsMatching dynamoDB Error:', err.message);
        });
    },

    getSessionInfosMatching: function (phrase) {
        if (!phrase) {
            console.log(Text.nothingToFind);
            return null;
        }

        // NOTE: DynamoDBDocument library is not build on promises. The promisifyAll call at the top of the file
        //  promisifies each call and appends the function name with `_Async'.
        return dynamodbDoc.scan_Async({
            // NOTE: Config.namespace is helpful when coding multiple application and the logic is similar. This splits the
            //  tables by "namespace"
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'session_info',
            FilterExpression: 'contains(session_name_match, :session_name) and which = :which', // NOTE: case-sensitive comparison on *_match column
            ExpressionAttributeValues: {
                ":session_name": phrase.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            var value = '';

            // NOTE: Left as an exercise to handle more than one matching session
            //   Hint: requires session state, a new Intent, and .shouldEndSession(false);
            if (data.Count > 0) {
                value += data.Items[0].session_info;
            } else {
                value = Text.sessionsNotFound(phrase);
            }
            return value.trim();
        }).catch(function (err) {
            console.error('getSessionsMatching dynamoDB Error:', err.message);
        });
    },

    getRoomPresentations: function (room, time) {
        if (!room) {
            console.log(Text.nothingToFind);
            return null;
        }
        time = timeStandardizer(time);

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'session_time, speaker, session_name',
            FilterExpression: 'room_match = :room and which = :which',
            ExpressionAttributeValues: {
                ":room": room.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            var i, value = '', found = false;
            if (data.Count > 0) {
                for (i = 0; i < data.Count; i += 1) {
                    if (!time || timesEqual(time, data.Items[i].session_time)) {
                        found = true;
                        value += 'At ' + data.Items[i].session_time + ', ' + data.Items[i].speaker + ' is presenting ' + data.Items[i].session_name + '. ';
                    }
                }
                if (!found && time) {
                    value += 'There are no presentations at ' + time + '.';
                }
            } else {
                value = Text.roomNotFound(room);
            }

            return value.trim();
        // }).catch(function (err) {
        //     console.error('getRoomPresentations dynamoDB Error:', err.message);
        });
    },

    getTimePresentations: function (time) {
        if (!time) {
            console.log(Text.nothingToFind);
            return null;
        }
        time = timeStandardizer(time);

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'room, speaker, session_name',
            FilterExpression: 'session_time = :session_time and which = :which',
            ExpressionAttributeValues: {
                ":session_time": time,
                ":which": WhichCamp
            }
        }).then(function (data) {
            var i, value = '';
            if (data.Count > 0) {
                for (i = 0; i < data.Count; i += 1) {
                    value += 'In ' + data.Items[i].room + ', ' + data.Items[i].speaker + ' is presenting ' + data.Items[i].session_name + '. ';
                }
            } else {
                value = Text.timeNotFound(time);
            }

            return value.trim();
        // }).catch(function (err) {
        //     console.error('getTimePresentations dynamoDB Error:', err.message);
        });
    },

    getSpeakerPresentations: function (speaker, time) {
        if (!speaker) {
            console.log(Text.nothingToFind);
            return null;
        }
        time = timeStandardizer(time);

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'session_time, room, speaker, session_name',
            FilterExpression: 'speaker_match = :speaker and which = :which',
            ExpressionAttributeValues: {
                ":speaker": speaker.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            var i, value = '', found = false;
            if (data.Count > 1 && !time) {
                value = Text.speakingAtCountSessions(data.Count, speaker);
            }
            if (data.Count > 0) {
                for (i = 0; i < data.Count; i += 1) {
                    if (!time || timesEqual(time, data.Items[i].session_time)) {
                        found = true;
                        value += 'At ' + data.Items[i].session_time + ' in room ' + data.Items[i].room + ', ' + data.Items[i].speaker + ' is presenting ' + data.Items[i].session_name + '. ';
                        Output.log('<session> ' + data.Items[i].session_name.toLowerCase());
                    }
                }
                if (!found && time) {
                    value += speaker + ' is not speaking at ' + time + '.';
                }
                Output.log('<speaker> ' + speaker.toLowerCase());
            } else {
                value = Text.speakerNotFound(speaker);
            }

            return value.trim();
        // }).catch(function (err) {
        //     console.error('getSpeakerPresentations dynamoDB Error:', err.message);
        });
    },

    getAboutForSpeaker: function (speaker) {
        if (!speaker) {
            console.log(Text.nothingToFind);
            return null;
        }

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'speaker_about',
            FilterExpression: 'speaker_match = :speaker and which = :which',
            ExpressionAttributeValues: {
                ":speaker": speaker.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            var value = '';
            if (data.Count > 1) {
                value = Text.speakingAtCountSessions(data.Count, speaker);
            }
            if (data.Count > 0) {
                value += (data.Items !== undefined && data.Items[0].speaker_about) ? data.Items[0].speaker_about : Text.profileNotUpdated(speaker);
                Output.log('<speaker> ' + speaker.toLowerCase());
            } else {
                value = Text.speakerNotFound(speaker);
            }

            return value;
        // }).catch(function (err) {
        //     console.error('getAboutForSpeaker dynamoDB Error:', err.message);
        });
    },

    getSessionsForSpeaker: function (speaker) {
        if (!speaker) {
            console.log(Text.nothingToFind);
            return null;
        }

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            ProjectionExpression: 'session_name, room, session_time',
            FilterExpression: 'speaker_match = :speaker and which = :which',
            ExpressionAttributeValues: {
                ":speaker": speaker.toLowerCase(),
                ":which": WhichCamp
            }
        }).then(function (data) {
            Output.log('<speaker> ' + speaker.toLowerCase());
            return data.Items;
        // }).catch(function (err) {
        //     console.error('getSessionsForSpeaker dynamoDB Error:', err.message);
        });
    },

    findSpeakersByBadge: function (badge) {
        if (!badge) {
            console.log(Text.nothingToFind);
            return null;
        }
        if (badge === "Microsoft") {
            badge = "MS";
        }

        if (speakersByBadge[badge]) {       // return from cache
            return speakersByBadge[badge];
        }

        return dynamodbDoc.scan_Async({
            TableName: Config.namespace + 'CodeCamp',
            FilterExpression: 'badge_match = :badge and which = :which',
            ExpressionAttributeValues : { ':badge': badge.toLowerCase(), ':which': WhichCamp},
            ProjectionExpression: 'speaker, room, session_time, session_name'
        }).then(function (data) {
            var value;
            if (data.Count === 0) {
                value = 'no one';
            } else {
                value = data.Items;
            }

            speakersByBadge[badge] = value; // save into cache
            return value;
        // }).catch(function (err) {
        //     console.error('findSpeakersByBadge dynamoDB Error:', err.message);
        });
    // },
    //
    // Step 4: Get the answer from DynamoDB (assume data is there)
    // findMostPopularSpeaker: function () {
    //     return dynamodbDoc.scan_Async({
    //         TableName: Config.namespace + 'ActivityLog',
    //         ProjectionExpression: 'What',
    //         FilterExpression: 'begins_with(What, :speaker) and Which = :which',
    //         ExpressionAttributeValues: {
    //             ":speaker": "<speaker>",
    //             ":which": WhichCamp
    //         }
    //     }).then(function (data) {
    //         var i, names = {}, speaker, name, max_occurrences = 0;
    //         for (i = 0; i < data.Count; i += 1) {
    //             speaker = data.Items[i].What.substring(10);
    //             if (names[speaker] === undefined) {
    //                 names[speaker] = 1;
    //             } else {
    //                 names[speaker] += 1;
    //             }
    //         }
    //         for (name in names) {
    //             if (names.hasOwnProperty(name)) {
    //                 if (names[name] > max_occurrences) {
    //                     max_occurrences = names[name];
    //                     speaker = name;
    //                 }
    //             }
    //         }
    //         return [speaker, max_occurrences];
    //     });
    }
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = dataCache;
