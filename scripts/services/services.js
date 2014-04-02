(function () {
  'use strict';

  var Grounds = function($http) {
    var grounds = null;

    var promise = $http.get('/db/world-cup/2014/grounds.yml')
      .success(function(data) {
        grounds = jsyaml.load(data);
      });

    return {
      promise: promise,
      getData: function() { return grounds; }
    };
  };

  var Teams = function($http) {
    var teams = null;

    var promise = $http.get('/db/world-cup/2014/teams.yml')
      .success(function(data) {
        teams = jsyaml.load(data);
      });

    return {
      promise: promise,
      getData: function() { return teams; }
    };
  };

  var Groups = function($http) {
    var groups = null;

    var promise = $http.get('/db/world-cup/2014/groups.yml')
      .success(function(data) {
        groups = jsyaml.load(data);
      });

    return {
      promise: promise,
      getData: function() { return groups; }
    };
  };

  var Matches = function($http) {
    var matches = null;

    var promise = $http.get('/db/world-cup/2014/matches.yml')
      .success(function(data) {
        matches = jsyaml.load(data);
      });

    return {
      promise: promise,
      getData: function() { return matches; }
    };
  };

  angular.module('worldcup.services', [])
    .service('Grounds', ['$http', '$q', Grounds])
    .service('Teams', ['$http', '$q', Teams])
    .service('Groups', ['$http', '$q', Groups])
    .service('Matches', ['$http', '$q', Matches]);
})();
