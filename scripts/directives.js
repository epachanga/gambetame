(function () {
  'use strict';

  var GroupStandingsDirective = function($rootScope) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/directives/groupStandings.html',
      scope: {
        group: '@',
        real: '='
      },
      link: function(scope, element) {
        var group = $rootScope.groups[scope.group];
        scope.data = group;
        scope.standings = group.standings;
        scope.simpleMode = $rootScope.simpleMode;

        scope.$watch(
          function() { return $rootScope.simpleMode },
          function(newVal, oldVal) {
            if (newVal != oldVal) {
              scope.simpleMode = newVal;
            }
          }
        );
      }
    };
  };

  var GroupMatchesDirective = function($rootScope) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/directives/matchesList.html',
      scope: {
        group: '@'
      },
      link: function(scope, element) {
        var group = $rootScope.groups[scope.group];
        scope.data = group;
        scope.standings = group.standings;
        scope.simpleMode = $rootScope.simpleMode;
        scope.viewMode = $rootScope.viewMode;
        scope.currentDate = (new Date()).getTime();
        scope.currentUser = scope.$root.currentUser;

        scope.matches = [];
        _.forEach(group.matches, function(matchId){
          scope.matches.push(_.find($rootScope.matches, {id: matchId}));
        });

        scope.selectWinner = function($evt) {
          if ($evt.target.value == 'home') {
            $($evt.target).scope().match.teams.home.goals = 1;
            $($evt.target).scope().match.teams.away.goals = 0;
          } else if($evt.target.value == 'away') {
            $($evt.target).scope().match.teams.away.goals = 1;
            $($evt.target).scope().match.teams.home.goals = 0;
          }
        };

        scope.$watch(
          function() { return $rootScope.simpleMode },
          function(newVal, oldVal) {
            if (newVal != oldVal) {
              scope.simpleMode = newVal;
            }
          }
        );

        scope.$watch(
          function() { return $rootScope.viewMode },
          function(newVal, oldVal) {
            if (newVal != oldVal) {
              scope.viewMode = newVal;
            }
          }
        );

        scope.$watch('matches', function(newVal, oldVal){
          _.forEach(newVal, function(match) {
            match.userGuess = null;
            if (!_.isNull(match.teams.home.real_goals) && !_.isNull(match.teams.away.real_goals) && !_.isNull(match.teams.home.goals) && !_.isNull(match.teams.away.goals)) {
              match.userGuess =
                (match.teams.home.goals > match.teams.away.goals
                  && match.teams.home.real_goals > match.teams.away.real_goals) ||
                (match.teams.home.goals < match.teams.away.goals
                  && match.teams.home.real_goals < match.teams.away.real_goals) ||
                (match.teams.home.goals == match.teams.away.goals
                  && match.teams.home.real_goals == match.teams.away.real_goals);
            }
          });
          if (!_.isEqual(newVal, oldVal)) {
            $rootScope.buildStandings(scope.group);
          }
        }, true);
      }
    };
  };

  var MatchesListDirective = function($rootScope) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/directives/matchesList.html',
      scope: {
        matches: '='
      },
      link: function(scope) {
        scope.simpleMode = $rootScope.simpleMode;
        scope.viewMode = $rootScope.viewMode;
        scope.currentDate = (new Date()).getTime();
        scope.currentUser = scope.$root.currentUser;

        scope.selectWinner = function($evt) {
          var _scope = $($evt.target).scope();
          if (/\[/.test(_scope.match.teams.home.team) || /\[/.test(_scope.match.teams.away.team)) {
            $evt.stopPropagation();
            $evt.preventDefault();
            $evt.target.checked = false;
            return;
          }
          if ($evt.target.value == 'home') {
            _scope.match.teams.home.goals = 1;
            _scope.match.teams.away.goals = 0;
          } else if($evt.target.value == 'away') {
            _scope.match.teams.away.goals = 1;
            _scope.match.teams.home.goals = 0;
          }
        };

        scope.selectWinnerPenalties = function($evt) {
          var _scope = $($evt.target).scope();
          if (/\[/.test(_scope.match.teams.home.team) || /\[/.test(_scope.match.teams.away.team)) {
            $evt.stopPropagation();
            $evt.preventDefault();
            $evt.target.checked = false;
            return;
          }
          if ($evt.target.value == 'home') {
            _scope.match.teams.home.penalty = true;
            _scope.match.teams.away.penalty = false;
          } else if($evt.target.value == 'away') {
            _scope.match.teams.home.penalty = false;
            _scope.match.teams.away.penalty = true;
          }
        };

        scope.$watch(
          function() { return $rootScope.simpleMode },
          function(newVal, oldVal) {
            if (newVal != oldVal) {
              scope.simpleMode = newVal;
            }
          }
        );

        scope.$watch(
          function() { return $rootScope.viewMode },
          function(newVal, oldVal) {
            if (newVal != oldVal) {
              scope.viewMode = newVal;
            }
          }
        );

        scope.$watch('matches', function(newVal, oldVal){
          _.forEach(newVal, function(match) {
            match.userGuess = null;
            if (!_.isNull(match.teams.home.real_goals) && !_.isNull(match.teams.away.real_goals) && !_.isNull(match.teams.home.goals) && !_.isNull(match.teams.away.goals)) {
              if (match.stage != 'Group Stage') {
                var
                userWinner,
                realWinner;

                if (match.teams.home.goals > match.teams.away.goals || match.teams.home.penalty) {
                  userWinner = match.teams.home.team;
                } else {
                  userWinner = match.teams.away.team;
                }
                if (match.teams.home.real_goals > match.teams.away.real_goals || match.teams.home.real_penalty) {
                  realWinner = match.teams.home.team;
                } else {
                  realWinner = match.teams.away.team;
                }

                match.userGuess = userWinner == realWinner;
              } else {
                match.userGuess =
                  (match.teams.home.goals > match.teams.away.goals
                    && match.teams.home.real_goals > match.teams.away.real_goals) ||
                  (match.teams.home.goals < match.teams.away.goals
                    && match.teams.home.real_goals < match.teams.away.real_goals) ||
                  (match.teams.home.goals == match.teams.away.goals
                    && match.teams.home.real_goals == match.teams.away.real_goals);
              }
            }
          });
          if (!_.isEqual(newVal, oldVal) && !_.isUndefined(newVal) && !_.isUndefined(oldVal)) {
            _.forEach(newVal, function(v, k){
              delete v.$$hashKey;
              if (!_.isEqual(v, oldVal[k])) {
                if (v.stage == 'Group Stage') {
                  $rootScope.buildStandings(
                                      $rootScope.teams[v.teams.home.team].group);
                }
              }
            }, scope);
          }
        }, true);
      }
    };
  };

  var VenueDirective = function($rootScope) {
    return {
      restrict: 'E',
      scope: {
        rel: '='
      },
      link: function(scope, element) {
        element[0].innerHTML = $rootScope.grounds[scope.rel].name;
      }
    };
  };

  var TeamDirective = function($rootScope, Utils) {
    return {
      restrict: 'E',
      templateUrl: '/views/directives/team.html',
      scope: {
        rel: '='
      },
      link: function(scope, element) {
        if (!$rootScope.teams[scope.rel]) {
          if (/\[\d/.test(scope.rel)) {
            var
            matches = scope.rel.match(/\[([\d])([A-H])\]/),
            group = matches[2].toLowerCase(),
            place = parseInt(matches[1]) - 1;

            scope[group] = $rootScope.groups[group];
            scope.$watch(
              function(){ return scope[group].standings },
              function(newStandings, oldStandings){
                var standings = Utils.orderStandings(newStandings);
                if (standings[place].pts === '-') {
                  scope.name = matches[0];
                  scope.flag = false;
                  return;
                }
                if (scope[group].standings[place].name == scope[group].real_standings[place].name) {
                  scope.rel = scope[group].standings[place].name;
                } else {
                  scope.rel = scope[group].real_standings[place].name;
                }
                scope.name = $rootScope.teams[scope.rel].name;
                scope.flag = $rootScope.teams[scope.rel].flag;
              },
              true
            );

            var standings = Utils.orderStandings(scope[group].standings);
            if (standings[place].pts === '-') {
              scope.name = matches[0];
              scope.flag = false;
              return;
            }

            scope.rel = standings[place].name;
          } else if (/\[\w/.test(scope.rel)) {
            var
            matches = scope.rel.match(/\[(W|L)([\d]+)\]/),
            matchId = parseInt(matches[2]),
            result = matches[1],
            match = _.find($rootScope.matches, {id: matchId});

            scope.match = match;

            scope.$watch('match', function(newVal, oldVal){
              if (!_.isNull(newVal.teams.home.goals)
                                      && !_.isNull(newVal.teams.away.goals)
                                      && !/\[/.test(newVal.teams.home.team)
                                      && !/\[/.test(newVal.teams.away.team)) {
                if (result == 'W') {
                  if (match.teams.home.goals > match.teams.away.goals) {
                    scope.rel = match.teams.home.team;
                  } else if (match.teams.home.goals < match.teams.away.goals) {
                    scope.rel = match.teams.away.team;
                  } else if (match.teams.home.goals >= 0
                        && match.teams.away.goals >= 0
                        && match.teams.home.goals == match.teams.away.goals) {
                    if (match.teams.home.penalty) {
                      scope.rel = match.teams.home.team;
                    } else if (match.teams.away.penalty) {
                      scope.rel = match.teams.away.team;
                    } else {
                      scope.name = matches[0];
                      scope.flag = false;
                      return;
                    }
                  } else {
                    scope.name = matches[0];
                    scope.flag = false;
                    return;
                  }
                }
                if (result == 'L') {
                  if (match.teams.home.goals < match.teams.away.goals) {
                    scope.rel = match.teams.home.team;
                  } else if (match.teams.home.goals > match.teams.away.goals) {
                    scope.rel = match.teams.away.team;
                  } else if (match.teams.home.goals >= 0
                        && match.teams.away.goals >= 0
                        && match.teams.home.goals == match.teams.away.goals) {
                    if (match.teams.home.penalty) {
                      scope.rel = match.teams.away.team;
                    } else if (match.teams.away.penalty) {
                      scope.rel = match.teams.home.team;
                    } else {
                      scope.name = matches[0];
                      scope.flag = false;
                      return;
                    }
                  } else {
                    scope.name = matches[0];
                    scope.flag = false;
                    return;
                  }
                }
                scope.name = $rootScope.teams[scope.rel].name;
                scope.flag = $rootScope.teams[scope.rel].flag;
              } else {
                scope.name = matches[0];
                scope.flag = false;
                return;
              }
            }, true);
          }
        }

        if (/\[/.test(scope.rel)) {
          scope.name = matches[0];
          scope.flag = false;
          return;
        }
        scope.name = $rootScope.teams[scope.rel].name;
        scope.flag = $rootScope.teams[scope.rel].flag;
      }
    };
  };

  var TimeDirective = function() {
    return {
      restrict: 'E',
      scope: {
        datetime: '='
      },
      link: function(scope, element) {
        var
        _moment = moment(scope.datetime);

        element[0].innerHTML = _moment.format('DD MMM YYYY').toUpperCase()
                                              + ' - ' + _moment.format('HH:mm');
      }
    };
  };

  var ScoreDirective = function() {
    return {
      restrict: 'E',
      scope: {
        row: '='
      },
      link: function(scope, element) {
        var
        stages = ['GroupStage', 'Roundof16', 'QuarterFinals', 'SemiFinals', 'PlayoffForThirdPlace', 'Final'],
        totalScore = 0,
        UserScores = Parse.Object.extend('UserScores'),
        scoreQuery = new Parse.Query(UserScores);
        scoreQuery.equalTo('user', scope.row.get('user'));
        scoreQuery.find().then(function(result) {
          if (result.length) {
            result = result[0];
            _.forEach(stages, function(stage) {
              totalScore += result.get(stage);
            });
          }
          element[0].innerHTML = totalScore;
          scope.row.score = totalScore;
          scope.$apply();
        });
      }
    };
  };

  angular.module('worldcup.directives', [])
    .directive('groupStandings', ['$rootScope', GroupStandingsDirective])
    .directive('groupMatches', ['$rootScope', GroupMatchesDirective])
    .directive('matchesList', ['$rootScope', MatchesListDirective])
    .directive('team', ['$rootScope', 'Utils', TeamDirective])
    .directive('venue', ['$rootScope', VenueDirective])
    .directive('time', TimeDirective)
    .directive('score', ScoreDirective)
    ;
})();
