(function () {
  'use strict';

  var TopNavCtrl = function($scope, $location) {
    $scope.selected = '';

    $scope.$watch(function(){ return $location.path(); },
      function(newVal, oldVal){
        $scope.selected = $location.path().split('/')[1];
      }
    );

    $scope.changeView = function(evt) {
      evt.preventDefault();
      $scope.selected = evt.currentTarget.getAttribute('href');
      $location.path(evt.currentTarget.getAttribute('href'));
    }
  };

  var HomeCtrl = function($scope, $route) {
    var firstMatch = _.findWhere($route.current.locals.MatchesData, {id: 1});
    $scope.startTime = firstMatch.date.getTime();
  };

  var MainCtrl = function ($rootScope, $scope, $route, Groups) {
    $rootScope.matches = $route.current.locals.MatchesData;
    $rootScope.teams = $route.current.locals.TeamsData;
    $rootScope.grounds = $route.current.locals.GroundsData;
    $rootScope.groups = $route.current.locals.GroupsData;

    _.forEach($rootScope.groups, function(data, group) {
      Groups.buildStandings(group);
    });

    angular.element(document).ready(function () {
      $('[data-toggle~="tooltip"]').tooltip();
    });
  };

  var MatchesCtrl = function ($rootScope, $scope) {
    $scope.matches = _.groupBy($rootScope.matches, 'stage');
    _.forEach($scope.matches, function(matches, stage) {
      $scope[stage.replace(' ', '')] = _.groupBy(matches, function(match){
        return match.date.getDate() + '/' + parseInt(match.date.getMonth()+1);
      });
    });
  };

  angular.module('worldcup.controllers', [])
    .controller('TopNavCtrl', ['$scope', '$location', TopNavCtrl])
    .controller('HomeCtrl', ['$scope', '$route', HomeCtrl])
    .controller('MainCtrl',
      ['$rootScope', '$scope', '$route', 'Groups', 'Matches', MainCtrl])
    .controller('MatchesCtrl', ['$rootScope', '$scope', MatchesCtrl]);
})();
