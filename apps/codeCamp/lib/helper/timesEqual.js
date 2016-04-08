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

var timeStandardizer = require('./timeStandardizer');

var timesEqual = function (tm1, tm2) {
    if (!tm1 || !tm2) {
        return false;
    }
    if (tm1 === tm2) {
        return true;
    }
    return timeStandardizer(tm1) === timeStandardizer(tm2);
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = timesEqual;
