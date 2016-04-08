/*jslint node: true */
/*jslint todo: true */
/*global describe */
/*global it */

'use strict';

var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    should = require('chai').should(),
    request = require('./helper/request'),
    Text = require('../lib/helper/text');

chai.use(chaiAsPromised);

// ChooseSpeakerIntent and AboutSpeakerIntent have the same signature and results
function testSpeakerIntents(intent) {
    describe('speaker related intents [' + intent + ']', function () {
        describe('asking for a speaker\'s info with their whole name', function () {
            it('should respond with about the speaker', function () {
                var result = request.intentRequest({
                    name: intent,
                    slots: {
                        Speaker: {
                            name: 'Speaker',
                            value: 'rick wargo'
                        }
                    }
                });
                return result.should.eventually.match(/<speak>rick wargo/i);
            });
        });

        describe('asking for a speaker\'s info who does not exist', function () {
            it('should respond the speaker was not found', function () {
                var result = request.intentRequest({
                    name: intent,
                    slots: {
                        Speaker: {
                            name: 'Speaker',
                            value: 'nobody'
                        }
                    }
                });
                return result.should.eventually.match(/<speak>I heard you say nobody/i);
            });
        });

        describe('asking for a speaker\'s info with a single matching name part', function () {
            it('should respond with about the speaker', function () {
                var result = request.intentRequest({
                    name: intent,
                    slots: {
                        Speaker: {
                            name: 'Speaker',
                            value: 'wargo'
                        }
                    }
                });
                return result.should.eventually.match(/<speak>rick wargo/i);
            });
        });

        describe('asking for a speaker\'s info with multiple matches', function () {
            it('should respond with clarification about the matches', function () {
                var result = request.intentRequest({
                    name: intent,
                    slots: {
                        Speaker: {
                            name: 'Speaker',
                            value: 'dave'
                        }
                    }
                });
                return result.should.eventually.match(/<speak>I found [0-9]+ speakers matching dave/i);
            });
        });
    });
}

testSpeakerIntents('AboutSpeakerIntent');
testSpeakerIntents('ChooseSpeakerIntent');

describe('maintain speaker context', function () {
    describe('ask about a specific speaker', function () {
        it('should respond with information about the speaker and store the name', function () {
            var result = request.intentRequest({
                name: 'AboutSpeakerIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'jason'
                    }
                }
            });
            return result.should.eventually.match(/<speak>jason/i);
        });
    });

    // TODO: This test fails because I need to persist session attributes between sessions
    // describe('ask if that speaker is here', function () {
    //     it('should respond with affirmative information about the previously mentioned speaker', function () {
    //         var result = request.intentRequest({
    //             name: 'IsSpeakerHereIntent',
    //             slots: {
    //             }
    //         });
    //         return result.should.eventually.match(/<speak>jason/i);
    //     });
    // });
});

describe('badge-related intents', function () {
    describe('asking to list speakers by badge', function () {
        it('should respond with a list of matching speakers', function () {
            var result = request.intentRequest({
                name: 'ListSpeakersByBadgeIntent',
                slots: {
                    Badge: {
                        name: 'Badge',
                        value: 'MVP'
                    }
                }
            });
            return result.should.eventually.match(/Chris Love/i);   // TODO: Need to check to see if no duplicates
        });
    });
});

describe('getting presentation speaker information', function () {
    describe('ask if a presenter is speaking today', function () {
        it('should respond with a no if not presenting', function () {
            var result = request.intentRequest({
                name: 'IsSpeakerHereIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'nobody'
                    }
                }
            });
            return result.should.eventually.match(/nobody is not presenting today/i);
        });

        it('should respond with a yes and the session info', function () {
            var result = request.intentRequest({
                name: 'IsSpeakerHereIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'dan hartshorn'
                    }
                }
            });
            return result.should.eventually.match(/Yes(\W|\w|\s)+dan hartshorn/i);
        });

        it('should respond with a clarification of presenters if the name matches more than one', function () {
            var result = request.intentRequest({
                name: 'IsSpeakerHereIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'brian'
                    }
                }
            });
            return result.should.eventually.match(/, or brian/i);
        });
    });

    describe('select one speaker from multiple matches', function () {
        it('should respond with information about that speaker', function () {
            // test is you asked if a speaker is here (IsSpeakerHereIntent), but the name matched multiple
            // speakers so you present a list, and now the logical next intent is ChooseSpeakerIntent.
            // This would be invoked with the full, matching name of the speaker. In this case, the
            // answer should be yes, and it should present info on the speaker topic(s).
            var supplement = function (payload) {
                payload.session.attributes.$Referrer = 'IsSpeakerHereIntent';
            },
                result = request.intentRequest({
                    name: 'ChooseSpeakerIntent',
                    slots: {
                        Speaker: {
                            name: 'Speaker',
                            value: 'dan hartshorn'
                        }
                    }
                }, supplement);
            return result.should.eventually.match(/Yes(\W|\w|\s)+dan hartshorn/i);
        });
    });
});

describe('sessions', function () {
    describe('at no time specified', function () {
        it('should respond with information about the session(s)', function () {
            var result = request.intentRequest({
                name: 'SpeakingAboutIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'atley'
                    }
                }
            });
            return result.should.eventually.match(/strafford(\W|\w|\s)+A Successful App – A Primer/i);
        });
    });

    describe('at a given time', function () {
        it('should respond with information about the session at that time', function () {
            var result = request.intentRequest({
                name: 'SpeakingAboutIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'wargo'
                    },
                    Time: {
                        name: 'Time',
                        value: '1:30pm'
                    }
                }
            });
            return result.should.eventually.match(/merion(\W|\w|\s)+how to look cool to your kid/i);
        });
    });

    describe('at a given non-speaking time', function () {
        it('should respond with a notification that the speaker is not speaking at that time', function () {
            var result = request.intentRequest({
                name: 'SpeakingAboutIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'wargo'
                    },
                    Time: {
                        name: 'Time',
                        value: '10:30am'
                    }
                }
            });
            return result.should.eventually.match(/wargo(\W|\w|\s)+is not speaking/i);
        });
    });

    describe('presentations in rooms at a given time', function () {
        describe('when listing presentations in a room', function () {
            it('should respond with a list of presentations in that room', function () {
                var result = request.intentRequest({
                    name: 'RoomTimeIntent',
                    slots: {
                        Room: {
                            name: 'Room',
                            value: 'merion'
                        }
                    }
                });
                return result.should.eventually.match(/Minecraft(\W|\w|\s)+Functional Compiler/i);
            });

            it('should respond with the presentations at the given time in that room', function () {
                var result = request.intentRequest({
                    name: 'RoomTimeIntent',
                    slots: {
                        Room: {
                            name: 'Room',
                            value: '30th street'
                        },
                        Time: {
                            name: 'Time',
                            value: '10:00'
                        }
                    }
                });
                return result.should.eventually.match(/Ember\.js 2\.0 and ASP\.NET Integration\.<\/speak/i);
            });

            it('should respond with a message about the room cannot be found', function () {
                var result = request.intentRequest({
                    name: 'RoomTimeIntent',
                    slots: {
                        Room: {
                            name: 'Room',
                            value: 'astral'
                        }
                    }
                });
                return result.should.eventually.match(/astral but I could not find that room/i);
            });

            it('should respond with a message about a presentation cannot be found at that time', function () {
                var result = request.intentRequest({
                    name: 'RoomTimeIntent',
                    slots: {
                        Room: {
                            name: 'Room',
                            value: '30th street'
                        },
                        Time: {
                            name: 'Time',
                            value: '1:00pm'
                        }
                    }
                });
                return result.should.eventually.match(/There are no presentations at/i);
            });

            it('should respond with the presentations at the given time', function () {
                var result = request.intentRequest({
                    name: 'RoomTimeIntent',
                    slots: {
                        Time: {
                            name: 'Time',
                            value: '10:00'
                        }
                    }
                });
                return result.should.eventually.match(/Ember\.js 2\.0 and ASP\.NET Integration\./i);
            });
        });
    });

    describe('where is a speaker', function () {
        it('should respond with the rooms and time the speaker is in today', function () {
            var result = request.intentRequest({
                name: 'SpeakingAboutIntent',
                slots: {
                    Speaker: {
                        name: 'Speaker',
                        value: 'gomez'
                    }
                }
            });
            return result.should.eventually.match(/mpr2/i);
        });
    });

    describe('time-related queries', function () {
        describe('what time is the next session', function () {
            it('should respond with the time of the next session', function () {
                var result = request.intentRequest({
                    name: 'TimeIntent',
                    slots: {
                        Time: {
                            name: 'Time'
                        }
                    }
                });
                return result.should.eventually.match(/(8:30|10:00|11:30|1:30|3:00|next year)/i);
            });
        });
    });

    describe('session-related queries', function () {
        describe('any sessions about Minecraft', function () {
            it('should respond with information about session', function () {
                var result = request.intentRequest({
                    name: 'SessionIntent',
                    slots: {
                        Session: {
                            name: 'Session',
                            value: 'Minecraft'
                        }
                    }
                });
                return result.should.eventually.match(/Minecraft/i);
            });
        });
    });
});

// // Step 1: Write the test and run `gulp test-local`
// // Step 2: Implement the code
//
// // New Test for SessionInfo Intent
// describe('session information', function () {
//     it('should respond with information about a session', function () {
//         var result = request.intentRequest({
//             name: 'SessionInfoIntent',              // This is a new intent and we will have to populate everything.
//             slots: {
//                 SessionName: {
//                     name: 'SessionName',
//                     value: 'Cool Gadgets with IOT'
//                 }
//             }
//         });
//
//         // I like to make it fail even when the code is correct so I can ensure I have the right test
//         return result.should.eventually.match(/demo some cool ways you can use Rasberry Pi/i);
//     });
// });

////////////// Original tests //////////////

describe('starting up', function () {
    it('should fail if an unknown application id is provided', function () {
        var result = request.badAppId();
        return result.should.eventually.be.rejected;
    });

    it('should respond what to ask for', function () {
        var result = request.launchRequest();
        return result.should.eventually.equal('<speak>' + Text.setupPrompt + '</speak>');
    });
});

describe('an unknown intent', function () {
    it('should respond with an error message', function () {
        var result = request.intentRequest({ name: '', slots: {} });
        return result.should.eventually.equal('<speak>Sorry, the application didn\'t know what to do with that intent</speak>');
    });
});

describe('the help intent', function () {
    it('should respond with the help message', function () {
        var result = request.intentRequest({ name: 'AMAZON.HelpIntent' });
        return result.should.eventually.equal('<speak>' + Text.help + '</speak>');
    });
});

describe('the cancel intent', function () {
    it('should respond with the goodbye message', function () {
        var result = request.intentRequest({ name: 'AMAZON.CancelIntent' });
        return result.should.eventually.equal('<speak>' + Text.goodbye + '</speak>');
    });
});
