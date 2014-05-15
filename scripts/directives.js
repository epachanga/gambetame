(function () {
  'use strict';

  var GroupStandingsDirective = function($rootScope, Groups) {
    return {
      restrict: 'E',
      templateUrl: '/views/directives/groupStandings.html',
      scope: {
        group: '@'
      },
      link: function(scope, element) {
        var group = $rootScope.groups[scope.group];
        scope.data = group;
        scope.standings = group.standings;

        scope.$watch('standings', function(newVal, oldVal){
          if (!_.isEqual(newVal, oldVal)) {
            debugger;
          }
        }, true);
      }
    };
  };

  var GroupMatchesDirective = function($rootScope, Groups) {
    return {
      restrict: 'E',
      templateUrl: '/views/directives/groupMatches.html',
      scope: {
        group: '@'
      },
      link: function(scope, element) {
        var group = $rootScope.groups[scope.group];
        scope.data = group;
        scope.standings = group.standings;

        scope.matches = [];
        _.forEach(group.matches, function(matchId){
          scope.matches.push(_.findWhere($rootScope.matches, {id: matchId}));
        });

        scope.buildStandings = Groups.buildStandings;

        scope.$watch('matches', function(newVal, oldVal){
          if (!_.isEqual(newVal, oldVal)) {
            scope.buildStandings(scope.group)
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

  var TeamDirective = function($rootScope) {
    return {
      restrict: 'E',
      templateUrl: '/views/directives/team.html',
      scope: {
        rel: '='
      },
      link: function(scope, element) {
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
                              + ' - ' + _moment.format('HH:mm') + ' Local time';
      }
    };
  };

  angular.module('worldcup.directives', [])
    .directive('groupStandings',
                            ['$rootScope', 'Groups', GroupStandingsDirective])
    .directive('groupMatches',
                            ['$rootScope', 'Groups', GroupMatchesDirective])
    .directive('team', ['$rootScope', TeamDirective])
    .directive('venue', ['$rootScope', VenueDirective])
    .directive('time', TimeDirective);
})();
