(function () {
  'use strict';

  var Grounds = function($http, $q) {
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

  var Teams = function($http, $q) {
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

  var Groups = function($http, $q) {
    var
    self = this,
    defer = $q.defer();

    this.data = null;

    $http.get('/db/world-cup/2014/groups.yml')
      .success(function(data) {
        self.data = jsyaml.load(data);
        angular.forEach(self.data, function(group) {
          group.standings = [];
          angular.forEach(group.teams, function(team){
            group.standings.push({
              team: team,
              mp: 0,
              w: 0,
              d: 0,
              l: 0,
              gf: 0,
              ga: 0,
              pts: 0
            });
          });
        });
        defer.resolve(self.data);
      });

    this.buildStandings = function(scope) {
      angular.forEach(_.groupBy(scope.matches, 'stage')['Group Stage'],
        function(match) {
          var
          home = match.teams.home,
          away = match.teams.away,
          current_group = scope.teams[home.team].group;

          if (new Date().getTime() < match.date.getTime()) {
            return;
          }

          if (!_.isNull(home.goals) && !_.isNull(away.goals)) {
            var
            tie = home.goals == away.goals;

            if (home.goals > away.goals) {
              var
              winner = _.findWhere(
                        self.data[current_group].standings, {team: home.team}),
              loser = _.findWhere(
                        self.data[current_group].standings, {team: away.team});
              winner.gf += home.goals;
              winner.ga += away.goals;
              loser.gf += away.goals;
              loser.ga += home.goals;
            } else {
              var
              winner = _.findWhere(
                        self.data[current_group].standings, {team: away.team}),
              loser = _.findWhere(
                        self.data[current_group].standings, {team: home.team});
              winner.gf += away.goals;
              winner.ga += home.goals;
              loser.gf += home.goals;
              loser.ga += away.goals;
            }
            winner.mp++;
            loser.mp++;
            if (!tie) {
              winner.pts += 3;
              winner.w++;
              loser.l++;
            } else {
              winner.pts += 1;
              loser.pts += 1;
              winner.d++;
              loser.d++;
            }
          }
        }
      );
    }

    return {
      promise: defer.promise,
      buildStandings: self.buildStandings
    }
  };

  var Matches = function($http, $q) {
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
    .service('Grounds', ['$http', '$q', Grounds])
    .service('Teams', ['$http', '$q', Teams])
    .service('Groups', ['$http', '$q', Groups])
    .service('Matches', ['$http', '$q', Matches]);
})();
