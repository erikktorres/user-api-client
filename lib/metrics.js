// module to set up metrics

// == BSD2 LICENSE ==
// Copyright (c) 2014, Tidepool Project
// 
// This program is free software; you can redistribute it and/or modify it under
// the terms of the associated License, which is identical to the BSD 2-Clause
// License as published by the Open Source Initiative at opensource.org.
// 
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the License for more details.
// 
// You should have received a copy of the License along with this program; if
// not, you can obtain one from Tidepool Project at tidepool.org.
// == BSD2 LICENSE ==

'use strict';

var log = null;

if (typeof define !== 'function') {
  /* jshint -W079 */
  var define = require('amdefine')(module);
  /* jshint +W079 */
}

define(['lodash', 'request', 'url'], function (_, request, url) {
  var hostGetter = null;
  var servername = null;

  function _withApiHost(errorCb, happyCb) {
    var hostSpec = hostGetter.get();
    if (hostSpec.length < 1) {
      return errorCb({ message: 'No metrics hosts available', statusCode: 503 });
    }
    happyCb(url.format(hostSpec[0]));
  }

  function _postServertoken(eventname, parms, token, cb) {
    _withApiHost(cb, function(apiHost) {
      // build the query to kissmetrics
      var reqOptions = {
        uri: apiHost + '/server/' + servername + '/' + eventname,
        qs: parms,
        headers: { 'x-tidepool-session-token': token },
        method: 'GET',
      };
      // leaving this here for a while until metrics stabilizes
      log.info(reqOptions.uri);
      request(reqOptions, function (error, response, body) {
        return cb();
      });
    });
  }

  function _postUsertoken(eventname, parms, token, cb) {
    _withApiHost(cb, function(apiHost) {
      // build the query to kissmetrics
      var reqOptions = {
        uri: apiHost + '/thisuser/' + eventname,
        qs: parms,
        headers: { 'x-tidepool-session-token': token },
        method: 'GET',
      };
      // leaving this here for a while until metrics stabilizes
      log.info(reqOptions.uri);
      request(reqOptions, function (error, response, body) {
        return cb();
      });
    });
  }

  function _postWithUser(userid, eventname, parms, token, cb) {
    _withApiHost(cb, function(apiHost) {
      // build the query to kissmetrics
      var reqOptions = {
        uri: apiHost + '/user/' + userid + '/' + eventname,
        qs: parms,
        headers: { 'x-tidepool-session-token': token },
        method: 'GET',
      };
      // leaving this here for a while until metrics stabilizes
      log.info(reqOptions.uri);
      request(reqOptions, function (error, response, body) {
        return cb();
      });
    });
  }

  var createMetrics = function (config, logger) {
    log = logger;
    if (!config.discovery) {
      return {
        post: function (e, p, t, cb) {
          log.warn('Metrics is using a dummy log call because discovery was not set up.');
          cb();
        }
      };
    }
    var hakkenClient = require('hakken')(config.discovery).client();
    hakkenClient.start();

    hostGetter = hakkenClient.watchFromConfig(config.metrics.serviceSpec);
    hostGetter.start();

    servername = config.serviceName || 'unnamed';
    return {
      postServer: _postServertoken,
      postThisUser: _postUsertoken,
      postWithUser: _postWithUser
    };
  };

  return {
    createMetrics: createMetrics
  };
});