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
          mp: '-',
          w: '-',
          d: '-',
          l: '-',
          gf: '-',
          ga: '-',
          pts: '-'
        });
      });
      _.forEach(self.data[group].matches, function(matchId){
        var
        match = _.find($rootScope.matches, {id: matchId}),
        home = match.teams.home,
        away = match.teams.away;

        if (!_.isNull(home.goals) && !_.isNull(away.goals)) {
          var
          homeStandsings = _.findWhere(standings, {name: home.team}),
          awayStandsings = _.findWhere(standings, {name: away.team}),
          homeGoals = parseInt(home.goals),
          awayGoals = parseInt(away.goals),
          tie = homeGoals == awayGoals;

          if (homeStandsings.mp === '-') {
            homeStandsings.mp =
            homeStandsings.w =
            homeStandsings.d =
            homeStandsings.l =
            homeStandsings.gf =
            homeStandsings.ga =
            homeStandsings.pts = 0;
          }
          if (awayStandsings.mp === '-') {
            awayStandsings.mp =
            awayStandsings.w =
            awayStandsings.d =
            awayStandsings.l =
            awayStandsings.gf =
            awayStandsings.ga =
            awayStandsings.pts = 0;
          }

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
      if (!self.data[group].standings) {
        self.data[group].standings = [];
      }
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

  var Utils = function() {

    var orderStandings = function(standings) {
      return standings.sort(function(a, b) {
        var
        apts = a.pts === '-' ? -1 : a.pts,
        bpts = b.pts === '-' ? -1 : b.pts;


        if (apts > bpts) {
          return -1;
        }
        else if (apts < bpts) {
          return 1;
        }
        else if (a.priority > b.priority) {
          return 1;
        }
        else {
          return -1;
        }
      });
    };

    return {
      orderStandings: orderStandings
    }

  };

  angular.module('worldcup.services', [])
    .service('Utils', [Utils])
    .service('Grounds', ['$rootScope', '$http', '$q', Grounds])
    .service('Teams', ['$rootScope', '$http', '$q', Teams])
    .service('Groups', ['$rootScope', '$http', '$q', Groups])
    .service('Matches', ['$rootScope', '$http', '$q', Matches])
    ;
})();
