/*jslint node: true */
/*jslint todo: true */
'use strict';

//TODO! This is getting used for node-aws-lambda and the Config settings. Probably need to separate/rename.
module.exports = {
    //profile: '',                      // optional for loading AWS credentials from custom profile
    applicationId: 'amzn1.echo-sdk-ams.app.3a771739-32eb-48b4-b1bd-d9a01e0b2346',   // Must update or all calls will fail on appIntent.pre()
    applicationName: 'CodeCamp',        // Must update this - no spaces, should be a valid identifier (hypens ok)
    namespace: 'CC.',                   // Update this - it prefixes DynamoDB table names
    functionName: 'Code-Camp-Skill',    // Must update or gulp test-lambda will fail
    region: 'us-east-1',
    handler: 'index.handler',
    timeout: 3,
    memorySize: 128,
    runtime: 'nodejs'
};

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
