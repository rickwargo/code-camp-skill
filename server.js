var AlexaAppServer = require('alexa-app-server');

// For parameter docs, see: https://github.com/matt-kruse/alexa-app-server/

var config = {
    server_root:__dirname,     // Path to root
    public_html:"public_html", // Static content
    app_dir:"apps",            // Where alexa-app modules are stored
    app_root:"/alexa/",        // Service root
    server_dir:"server",       // Contains server-side processing modules
    port:8003,                 // Port to use
    debug:true,                // GET requests to Alexa App endpoints will show the debugger UI. This can be disabled.
    log:true                   // Some information is logged with console.log(), which can be disabled
};
var server = new AlexaAppServer(config);

module.exports = server;

if (process.env.EXECUTE > 0) {
    server.start();
}
