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

var gulp = require('gulp-help')(require('gulp')),
    gutil = require('gulp-util'),
    jslint = require('gulp-jslint'),
    install = require('gulp-install'),
    zip = require('gulp-zip'),
    runSequence = require('run-sequence'),
    awsLambda = require('node-aws-lambda'),
    AWS = require('aws-sdk'),
    Config = require('./config/lambda-config'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul'),
    env = require('gulp-env'),
    vinylPaths = require('vinyl-paths'),
    del = require('del'),
    fs = require('fs');

AWS.config.update({region:  Config.region});

var filePaths = {
    lambdaFiles:    ['index.js', 'lib/**/*.js', 'config/**/*.js', 'vendor/**', 'assets/**', 'images/**'],
    lintFiles:      ['index.js', 'gulpfile.js', 'lib/**/*.js', 'config/**/*.js', 'test/**/*.js', 'bin/**/*.js'],
    coverFiles:     ['index.js', 'lib/**/*.js', 'config/**/*.js', '!lib/playground.js'],
    unitTestFiles:  ['test/intents.js', 'index.js', 'lib/**/*.js', 'config/**/*.js', '!lib/playground.js'],
    coverTestFiles: ['test/intents.js']
};

var server = require('../../server');

/*jslint nomen: true*/
function stringAsSrc(filename, string) {
    var src = require('stream').Readable({ objectMode: true });
    src._read = function () {
        this.push(new gutil.File({ cwd: '', base: '', path: filename, contents: new Buffer(string) }));
        this.push(null);
    };
    return src;
}
/*jslint nomen: false*/

gulp.task('default', ['help']);

gulp.task('lint', 'Lints all server side js', function () {
    return gulp.src(filePaths.lintFiles)
        .pipe(jslint());
});

gulp.task('test-local', 'Run unit tests against local server **', function () {
    var result,
        envs = env.set({
            SERVER: 'Local'
        }),
        instance = server.start();

    result = gulp.src(filePaths.unitTestFiles)
        .pipe(envs)
        .pipe(mocha({reporter: 'progress'}))
        .on('end', function () {
            instance.close();
        });
    return result;
}, {
    aliases: ['test']
});

gulp.task('test-lambda', 'Run unit tests against AWS lambda **', function () {
    var envs = env.set({
        SERVER: 'Lambda'
    });
    return gulp.src(filePaths.unitTestFiles)
        .pipe(envs)
        .pipe(mocha({ timeout: 5000 }));
}, {
    aliases: ['lambda']
});

gulp.task('test-and-cover', 'Show coverage for tested code **', function () {
    var envs = env.set({
            SERVER: 'Local'
        }),
        instance = server.start();

    gulp.src(filePaths.coverFiles)
        .pipe(envs)
        // Covering files
        .pipe(istanbul({includeUntested: true}))
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());

    return gulp.src(filePaths.coverTestFiles)
        .pipe(mocha({ reporter: 'progress' }))
        .pipe(istanbul.writeReports())  // Creating the reports after tests ran
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))  // Enforce a coverage of at least 90%
        .on('end', function () {
            instance.close();
        });
}, {
    aliases: ['cover']
});

gulp.task('build-lambda-code', 'Process source and create dist.zip file to upload to AWS lambda **', function (callback) {
    return runSequence(
        'lint',
        'test-local',
        'build-zip',
        callback
    );
}, {
    aliases: ['build']
});

gulp.task('push-lambda-code', 'Process source then upload to AWS lambda **', function (callback) {
    return runSequence(
        'build-lambda-code',
        'upload',
        'test-lambda',
        callback
    );
}, {
    aliases: ['push']
});

gulp.task('quick-push-lambda-code', 'Process source then upload to AWS lambda without updating modules **', function (callback) {
    return runSequence(
        'lint',
        'make-dist',
        'test-local',
        'quick-build-zip',
        'upload',
        'test-lambda',
        callback
    );
}, {
    aliases: ['quick', 'quick-push']
});

gulp.task('super-quick-push-lambda-code', 'Process source then upload to AWS lambda without updating modules **', function (callback) {
    return runSequence(
        'lint',
        'make-dist',
        'quick-build-zip',
        'upload',
        callback
    );
}, {
    aliases: ['super-quick', 'super-quick-push']
});

gulp.task('build-intent-schema', 'Build the intent schema from source **', function () {
    var app = require('./index.js'),
        str = app.schema();

    return stringAsSrc('IntentSchema.json', str).pipe(gulp.dest('assets/speech/'));
}, {
    aliases: ['intent', 'intents']
});

gulp.task('build-utterances', 'Build the utterances from source **', function () {
    var app = require('./index.js'),
        str = app.utterances();

    return stringAsSrc('SampleUtterances.txt', str).pipe(gulp.dest('assets/speech/'));
}, {
    aliases: ['utterances']
});

gulp.task('build-custom-slot-types', 'Build the custom slot types from source **', function () {
    var app = require('./index.js'),
        str = app.customSlotTypes();

    return stringAsSrc('CustomSlotTypes.txt', str).pipe(gulp.dest('assets/speech/'));
}, {
    aliases: ['slots']
});

gulp.task('clean', 'Clean out the dist folder and remove the compiled zip file', function () {
    return gulp.src(['./dist', './dist.zip'])
        .pipe(vinylPaths(del));
});

// TODO: Make this env production/develop/test config files
gulp.task('make-dist', 'Compile/move javascript files to dist', function () {
    return gulp.src(filePaths.lambdaFiles, { base: '.' })
        .pipe(gulp.dest('dist/'));
});

gulp.task('rm-dist-package', 'Removes unnecessary package.json from dist so it does not go to AWS Lambda', function () {
    return gulp.src(['dist/package.json'])
        .pipe(vinylPaths(del));
});

gulp.task('gather-node-mods', 'Install npm packages to dist, ignoring devDependencies', function () {
    return gulp.src('./package.json')
        .pipe(gulp.dest('./dist/'))
        .pipe(install({production: true}));
});

gulp.task('node-mods', 'Install npm packages to dist, ignoring devDependencies', function (callback) {
    return runSequence(
        'gather-node-mods',
        'rm-dist-package',
        callback
    );
});

gulp.task('create-zip-file', 'Zip the dist directory', function () {
    return gulp.src(['dist/**/*'])
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest('./'));
}, {
    aliases: ['zip']
});

gulp.task('build-assets', 'Build assets for updating Alexa Skill Model', function (callback) {
    return runSequence(
        ['build-intent-schema', 'build-utterances', 'build-custom-slot-types'],
        callback
    );
}, {
    aliases: ['assets']
});

gulp.task('build-zip', 'Process source and create zip file', function (callback) {
    return runSequence(
        'clean',
        'make-dist',
        'node-mods',
        'build-assets',
        'create-zip-file',
        callback
    );
});

gulp.task('quick-build-zip', 'Process source and create zip file (without rebuilding node modules)', function (callback) {
    return runSequence(
        'make-dist',
        'build-assets',
        'create-zip-file',
        callback
    );
});

gulp.task('upload', 'Upload zip file to lambda', function (callback) {
    return awsLambda.deploy('./dist.zip', Config, callback);
});

gulp.task('watch-test', 'Watch for changed files and run unit tests when a file changes', function () {
    return gulp.watch(filePaths.unitTestFiles, ['test-local']);
});

gulp.task('watch-lint', 'Watch for changed files and run lint of the file that has changed', function () {
    return gulp.watch(filePaths.lintFiles).on('change', function (file) {
        gulp.src(file.path)
            .pipe(jslint())
            .on('error', function (err) { console.log(err); });   // jslint spits out errors
    });
});

gulp.task('watch', ['watch-lint', 'watch-test']);
