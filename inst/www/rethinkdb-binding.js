var RethinkdbWebsocketClient = require('rethinkdb-websocket-client');
var r = RethinkdbWebsocketClient.rethinkdb;

// In case you want bluebird, which is bundled with the rethinkdb driver
var Promise = RethinkdbWebsocketClient.Promise;

// Rethinkdb input binding
var rethinkdbInputBinding = new Shiny.InputBinding();

// An input binding must implement these methods
$.extend(rethinkdbInputBinding, {
  initialize: function(el) {
    this.id = el.id;
    this.host = $(el).attr('data-host');
    this.port = $(el).attr('data-port');
    this.db = $(el).attr('data-db');

    var options = {
      host: this.host,       // hostname of the websocket server
      port: this.port,              // port number of the websocket server
      path: '/',               // HTTP path to websocket route
      wsProtocols: ['binary'], // sub-protocols for websocket, required for websockify
      secure: false,           // set true to use secure TLS websockets
      db: this.db,              // default database, passed to rethinkdb.connect
      simulatedLatencyMs: 100, // wait 100ms before sending each message (optional)
    };
    this.connP = RethinkdbWebsocketClient.connect(options);
    this.value = [];
  },

  find: function(scope) { // This returns a jQuery object with the DOM element
    var selector = 'label[class="rethinkdb"]';
    return $(scope).find(selector);
  },
  getId: function(el) { // return the ID of the DOM element
    return el.id;
  },
  getValue: function(el) { // Given the DOM element for the input, return the value
    console.log('getvalue', this.value);
    return JSON.stringify(this.value);
  },
  setValue: function(el, value) { // Given the DOM element for the input, set the value
    this.value = value;
  },

  // Set up the event listeners so that interactions with the
  // input will result in data being sent to server.
  // callback is a function that queues data to be sent to
  // the server.
  subscribe: function(el, callback) {
    var that = this;
    var table = $(el).attr('data-table');

    var sendAll = function() {
      that.connP.then(function(conn) {
        r.table(table).run(conn, function(err, cursor) {
          cursor.toArray(function(err, results) {
            that.value = results;
            console.log('sending update');
            callback(true);
          });
        });
      });
    };

    this.connP.then(function(conn) {
      r.table(table).changes().run(conn, function(err, cursor) {
        // There are some changes. Let's get everything and return.
        cursor.each(function(err, row) { sendAll() });
      });
    });

    sendAll();

  },

  // Remove the event listeners
  unsubscribe: function(el) {
    console.log("unsubscribe called");
    $(el).off('.urlInputBinding');
  },

  // Receive messages from the server. Messages sent by updateUrlInput() are received by this function.
  receiveMessage: function(el, data) {
    console.log("received data. ignoring...");
  },

  // This returns a full description of the input's state.
  // Note that some inputs may be too complex for a full description of the state to be feasible.
  getState: function(el) {
    console.log("getState called");
    return {
      value: this.value
    };
  },

  // The input rate limiting policy
  getRatePolicy: function() {
    console.log("getRate called");
    return {
      // Can be 'debounce' or 'throttle'
      policy: 'debounce',
      delay: 500
    };
  }
});

Shiny.inputBindings.register(rethinkdbInputBinding, 'shiny.rethinkdbInput');

