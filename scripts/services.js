(function () {
  'use strict';

  var Grounds = function($rootScope, $http, $q) {
    var
    data = null,
    defer = $q.defer();

    $http.get('/db/world-cup/2014/grounds.yml')
      .success(function(data) {
        data = jsyaml.load(data);
        defer.resolve(data);
      });

    return {
      promise: defer.promise
    }
  };

  var Teams = function($rootScope, $http, $q) {
    var
    data = null,
    defer = $q.defer();

    $http.get('/db/world-cup/2014/teams.yml')
      .success(function(data) {
        data = jsyaml.load(data);
        defer.resolve(data);
      });

    return {
      promise: defer.promise
    }
  };

  var Groups = function($rootScope, $http, $q) {
    var
    self = this,
    defer = $q.defer();

    this.data = null;

    $http.get('/db/world-cup/2014/groups.yml')
      .success(function(data) {
        self.data = jsyaml.load(data);
        defer.resolve(self.data);
      });

    var buildStandings = function buildStandings(group) {
      var standings = [];
      _.forEach(_.values(self.data[group].teams), function(team, i){
        standings.push({
          name: team,
          priority: i+1,
          mp: 0,
          w: 0,
          d: 0,
          l: 0,
          gf: 0,
          ga: 0,
          pts: 0
        });
      });
      _.forEach(self.data[group].matches, function(matchId){
        var
        match = _.findWhere($rootScope.matches, {id: matchId}),
        home = match.teams.home,
        away = match.teams.away;

        if (!_.isNull(home.goals) && !_.isNull(away.goals)) {
          var
          homeStandsings = _.findWhere(standings, {name: home.team}),
          awayStandsings = _.findWhere(standings, {name: away.team}),
          homeGoals = parseInt(home.goals),
          awayGoals = parseInt(away.goals),
          tie = homeGoals == awayGoals;

          homeStandsings.mp++;
          homeStandsings.gf += homeGoals;
          homeStandsings.ga += awayGoals;

          awayStandsings.mp++;
          awayStandsings.gf += awayGoals;
          awayStandsings.ga += homeGoals;

          if (tie) {
            // empate
            homeStandsings.d++;
            homeStandsings.pts += 1;

            awayStandsings.d++;
            awayStandsings.pts += 1;
          } else if (homeGoals > awayGoals) {
            // local gana
            homeStandsings.w++;
            homeStandsings.pts += 3;

            awayStandsings.l++;
          } else {
            // visitante gana
            awayStandsings.w++;
            awayStandsings.pts += 3;

            homeStandsings.l++;
          }
        }
      });
      self.data[group].standings = standings;
    };

    return {
      promise: defer.promise,
      buildStandings: buildStandings
    }
  };

  var Matches = function($rootScope, $http, $q) {
    var
    data = null,
    defer = $q.defer();

    $http.get('/db/world-cup/2014/matches.yml')
      .success(function(data) {
        data = jsyaml.load(data);
        defer.resolve(data);
      });

    return {
      promise: defer.promise
    }
  };

  angular.module('worldcup.services', [])
    .service('Grounds', ['$rootScope', '$http', '$q', Grounds])
    .service('Teams', ['$rootScope', '$http', '$q', Teams])
    .service('Groups', ['$rootScope', '$http', '$q', Groups])
    .service('Matches', ['$rootScope', '$http', '$q', Matches]);
})();
