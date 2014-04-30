(function () {
  'use strict';

  var GroupStandingsDirective = function($rootScope) {
    return {
      restrict: 'E',
      // replace: true,
      templateUrl: '/views/directives/groupStandings.html',
      scope: {
        group: '@'
      },
      link: function(scope, element) {
        var group = $rootScope.groups[scope.group];
        scope.data = group;
        scope.standings = _.sortBy(group.standings, 'pts').reverse();
      }
    };
  };

  var GroupMatchesListDirective = function($rootScope) {
    return {
      restrict: 'E',
      // replace: true,
      templateUrl: '/views/directives/groupMatches.html',
      scope: {
        group: '@'
      },
      link: function(scope, element) {
        scope.matches = [];
        angular.forEach($rootScope.groups[scope.group].matches,
          function(element) {
            scope.matches.push(_.findWhere($rootScope.matches , {id: element}));
          }
        );
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
      scope: {
        rel: '='
      },
      link: function(scope, element) {
        element[0].innerHTML = $rootScope.teams[scope.rel].name;
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
        hours = String(scope.datetime.getHours()).length > 1
                                                ? scope.datetime.getHours()
                                                : '0'+scope.datetime.getHours(),
        minutes = String(scope.datetime.getMinutes()).length > 1
                                              ? scope.datetime.getMinutes()
                                              : '0'+scope.datetime.getMinutes();

        element[0].innerHTML = scope.datetime.getDate()
                              + '/' + (scope.datetime.getMonth() + 1)
                              + ' ' + hours + ':' + minutes;
      }
    };
  };

  angular.module('worldcup.directives', [])
    .directive('groupstandings', ['$rootScope', GroupStandingsDirective])
    .directive('groupmatcheslist', ['$rootScope', GroupMatchesListDirective])
    .directive('team', ['$rootScope', TeamDirective])
    .directive('venue', ['$rootScope', VenueDirective])
    .directive('time', TimeDirective);
})();
