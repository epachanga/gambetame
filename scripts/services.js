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

    this.promise = defer.promise;
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

    this.promise = defer.promise;
  };

  var Groups = function($rootScope, $http, $q) {
    var
    self = this,
    defer = $q.defer();

    this.data = null;

    $http.get('/db/world-cup/2014/groups.yml')
      .success(function(data) {
        self.data = jsyaml.load(data);
        _.forEach(self.data, function(data, group) {
          self.data[group].standings = [];
          _.forEach(_.values(self.data[group].teams), function(team, i){
            self.data[group].standings.push({
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
        });
        defer.resolve(self.data);
      });

    this.promise = defer.promise;

    this.buildStandings = function buildStandings(group) {
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
      self.data[group].standings = standings;
    };

    this.buildRealStandings = function buildRealStandings(group) {
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

        if (!_.isNull(home.score) && !_.isNull(away.score)) {
          var
          homeStandsings = _.findWhere(standings, {name: home.team}),
          awayStandsings = _.findWhere(standings, {name: away.team}),
          homeScore = parseInt(home.score),
          awayScore = parseInt(away.score),
          tie = homeScore == awayScore;

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
          homeStandsings.gf += homeScore;
          homeStandsings.ga += awayScore;

          awayStandsings.mp++;
          awayStandsings.gf += awayScore;
          awayStandsings.ga += homeScore;

          if (tie) {
            // empate
            homeStandsings.d++;
            homeStandsings.pts += 1;

            awayStandsings.d++;
            awayStandsings.pts += 1;
          } else if (homeScore > awayScore) {
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
      self.data[group].real_standings = standings;
    };
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

    this.promise = defer.promise;
  };

  var Utils = function($rootScope) {

    this.orderStandings = function(standings) {
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
        else if (a.gf - a.ga > b.gf - b.ga) {
          return -1;
        }
        else {
          return 1;
        }
      });
    };

    this.loadUserMatches = function(userMatches, currentStage) {
      var
      groupStageMatches = userMatches.get('GroupStage') ? JSON.parse(userMatches.get('GroupStage')) : [],
      roundOf16Matches = userMatches.get('Roundof16') ? JSON.parse(userMatches.get('Roundof16')) : [],
      quarterFinalsMatches = userMatches.get('QuarterFinals') ? JSON.parse(userMatches.get('QuarterFinals')) : [],
      semiFinalsMatches = userMatches.get('SemiFinals') ? JSON.parse(userMatches.get('SemiFinals')) : [],
      playOffForThirdPlaceMatches = userMatches.get('PlayoffForThirdPlace') ? JSON.parse(userMatches.get('PlayoffForThirdPlace')) : [],
      finalMatches = userMatches.get('Final') ? JSON.parse(userMatches.get('Final')) : [];

      switch(currentStage) {
        case 'GroupStage':
          _.forEach(groupStageMatches, function(match){
            if (match.stage == 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          break;
        case 'Roundof16':
          _.forEach(groupStageMatches, function(match){
            if (match.stage == 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(roundOf16Matches, function(match){
            if (match.stage != 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          break;
        case 'QuarterFinals':
          _.forEach(groupStageMatches, function(match){
            if (match.stage == 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(roundOf16Matches, function(match){
            if (match.stage == 'Round of 16') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(quarterFinalsMatches, function(match){
            if (match.stage != 'Group Stage' && match.stage != 'Round of 16') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          break;
        case 'SemiFinals':
          _.forEach(groupStageMatches, function(match){
            if (match.stage == 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(roundOf16Matches, function(match){
            if (match.stage == 'Round of 16') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(quarterFinalsMatches, function(match){
            if (match.stage == 'Quarter Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(semiFinalsMatches, function(match){
            if (match.stage != 'Group Stage' && match.stage != 'Round of 16' && match.stage != 'Quarter Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          break;
        case 'PlayoffForThirdPlace':
          _.forEach(groupStageMatches, function(match){
            if (match.stage == 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(roundOf16Matches, function(match){
            if (match.stage == 'Round of 16') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(quarterFinalsMatches, function(match){
            if (match.stage == 'Quarter Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(semiFinalsMatches, function(match){
            if (match.stage == 'Semi Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(playOffForThirdPlaceMatches, function(match){
            if (match.stage != 'Group Stage' && match.stage != 'Round of 16' && match.stage != 'Quarter Finals' && match.stage != 'Semi Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          break;
        case 'Final':
          _.forEach(groupStageMatches, function(match){
            if (match.stage == 'Group Stage') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(roundOf16Matches, function(match){
            if (match.stage == 'Round of 16') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(quarterFinalsMatches, function(match){
            if (match.stage == 'Quarter Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(semiFinalsMatches, function(match){
            if (match.stage == 'Semi Finals') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(playOffForThirdPlaceMatches, function(match){
            if (match.stage == 'Play-off For Third Place') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          _.forEach(finalMatches, function(match){
            if (match.stage != 'Group Stage' && match.stage != 'Round of 16' && match.stage != 'Quarter Finals' && match.stage != 'Semi Finals' && match.stage != 'Play-off For Third Place') {
              var
              $match =_.find($rootScope.matches, {id: match.id});
              $match.teams.home.goals = match.teams.home.goals;
              $match.teams.away.goals = match.teams.away.goals;
              $match.teams.home.penalty = match.teams.home.penalty;
              $match.teams.away.penalty = match.teams.away.penalty;
            }
          });
          break;
      }
    };

  };

  angular.module('worldcup.services', [])
    .service('Utils', ['$rootScope', Utils])
    .service('Grounds', ['$http', '$q', Grounds])
    .service('Teams', ['$http', '$q', Teams])
    .service('Matches', ['$http', '$q', Matches])
    .service('Groups', ['$rootScope', '$http', '$q', Groups])
    ;
})();
