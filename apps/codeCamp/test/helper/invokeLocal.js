/*jslint node: true */
/*jslint todo: true */
'use strict';

var requestPromise = require('request-promise'),
    Server = require('../../../../server'),
    Config = require('../../config/lambda-config'),
    invokeLocalHelper = {};

invokeLocalHelper.invoke = function (payload) {
    var call = requestPromise({
        method: 'POST',
        uri: 'http://localhost:8003/alexa/' + Config.applicationName,
        json: payload
    });

    return call
        .then(function (data) {
            if (data.response && data.response.outputSpeech) {
                return data.response.outputSpeech.ssml;
            }
            throw 'bad response';
        })
        .catch(function (err) {
            //console.log("Error: " + err.message);
            throw err;
        });
};

module.exports = invokeLocalHelper;
