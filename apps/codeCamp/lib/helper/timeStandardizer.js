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
/*jslint regexp: true */

'use strict';

var moment = require('moment');

function zeropad(num) {
    var s = '00' + num.toString();

    return s.slice(-2);
}

var timesStandardizer = function (tm) {
    if (!tm || tm === '') {
        return null;
    }
    var digits = tm.replace(/[^0-9]/g, ''),
        ampm = tm.replace(/[^apm]/gi, ''),
        hour = Math.floor(parseInt(digits, 10) / 100),
        minute = parseInt(digits, 10) % 100;

    if (ampm.substring(0, 1) === 'p' && hour === 0 && minute < 12) {
        hour = minute;
        minute = 0;
        if (hour < 12) {
            hour += 12;
        }
    } else if (ampm.substring(0, 1) === 'a' && hour === 0 && minute < 12) {
        hour = minute;
        minute = 0;
    } else if (ampm === '' && hour === 0 && minute < 24) {
        hour = minute;
        minute = 0;
        if (hour < 6) {
            hour += 12;
        }
    } else if (ampm.substring(0, 1) === 'p' && hour < 12) {
        hour += 12;
    } else if ((!ampm || ampm === '') && hour < 6) {
        hour += 12;
    }
    if (minute < 30) {
        minute = 0;
    } else {
        minute = 30;
    }
    return moment(zeropad(hour) + ':' + zeropad(minute), "HH:mm").format('hh:mma');
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = timesStandardizer;
