/*jslint node: true */
/*jslint todo: true */
'use strict';

var cheerio = require('cheerio'),
    request = require('sync-request'),
    Config = require('../config/lambda-config');

var getUtterances = function () {
    var url = 'https://developer.amazon.com/edw/home.html#/skill/' + Config.applicationId + '/intentSchema/list',
        res = request('GET', url),
        html = res.getBody(),
        dom = cheerio.load(html),
        utterances = dom('//form/span[@class="UpdateApplicationFormRow"][3]/span[@class="UpdateApplicationFormRowTextArea"]/div');

    console.log(utterances);
};

module.exports = getUtterances;
