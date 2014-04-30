(function () {
  'use strict';

  var HomeCtrl = function($scope, $route) {
    var firstMatch = _.findWhere($route.current.locals.MatchesData, {id: 1});
    $scope.startTime = firstMatch.date.getTime();
  };

  var TopNavCtrl = function($scope, $location) {
    $scope.selected = '';

    $scope.$watch(function(){ return $location.path(); }, function(newVal, oldVal){
      $scope.selected = $location.path().split('/')[1];
    });

    $scope.changeView = function(evt) {
      evt.preventDefault();
      $scope.selected = evt.currentTarget.getAttribute('href');
      $location.path(evt.currentTarget.getAttribute('href'));
    }
  };

  var MainCtrl = function ($rootScope, $scope, $route, Groups) {
    $rootScope.matches = $route.current.locals.MatchesData;
    $rootScope.teams = $route.current.locals.TeamsData;
    $rootScope.grounds = $route.current.locals.GroundsData;
    $rootScope.groups = $route.current.locals.GroupsData;

    Groups.buildStandings($rootScope);

    $rootScope.$watch('matches', function(newVal, oldVal){
      if (_.isEqual(newVal, oldVal)) {
        console.log('evme', 'no change');
      } else {
        console.log('evme', newVal, oldVal);
      }
    });
  };

  angular.module('worldcup.controllers', [])
    .controller('HomeCtrl', ['$scope', '$route', HomeCtrl])
    .controller('TopNavCtrl', ['$scope', '$location', TopNavCtrl])
    .controller('MainCtrl',
      ['$rootScope', '$scope', '$route', 'Groups', 'Matches', MainCtrl]);
})();
