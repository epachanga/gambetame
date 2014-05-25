(function () {
  'use strict';

  var TopNavCtrl = function($rootScope, $scope, $location) {
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

  var UserCtrl = function($scope) {
    var self = this;

    $scope.$root.currentUser = Parse.User.current();

    $scope.currentUser = $scope.$root.currentUser;
    $scope.disabled = true;
    $scope.loading = false;

    $scope.login = function() {
      $scope.loading = true;
      Parse.FacebookUtils.logIn(null, {
        success: function(user) {
          FB.api('/me', function(me) {
            user.set('name', me.name);
            user.set('email', me.email);
            user.save().then(function(result) {
              $scope.currentUser = $scope.$root.currentUser = result;
              $scope.loading = false;
              $scope.$apply();
            });
          });
        },
        error: function(user, error) {
          debugger;
          // Handle errors and cancellation
        }
      });
    }

    $scope.logout = function() {
      Parse.User.logOut();
      $scope.currentUser = $scope.$root.currentUser = null;
    }

    $scope.save = function() {
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches);

      if (!$scope.$root.userMatches) {
        query.equalTo('userId', $scope.$root.currentUser.id);
        query.find().then(function(result){
          var userMatches;
          if (result.length) {
            userMatches = result[0];
          } else {
            userMatches = new UserMatches();
            userMatches.setACL(new Parse.ACL($scope.$root.currentUser));
            userMatches.set('userId', $scope.$root.currentUser.id);
          }
          self.saveMatches(result.length ? result[0] : userMatches);
        });
      }
    }

    $scope.$watch(function(){ return $scope.$root.matches }, function(newVal, oldVal) {
      if (!_.isUndefined(newVal) && !_.isUndefined(oldVal) && !_.isEqual(newVal, oldVal)) {
        $scope.disabled = false;
      }
    }, true);

    this.saveMatches = function(userMatches) {
      userMatches.set('matches', JSON.stringify($scope.$root.matches));
      userMatches.save().then(function(result) {
        $scope.disabled = true;
        $scope.$root.userMatches = result;
        $scope.$apply();
      });
    }
  };

  var HomeCtrl = function($scope, $route) {
    var firstMatch = _.find($route.current.locals.MatchesData, {id: 1});
    $scope.startTime = firstMatch.date.getTime();
  };

  var MainCtrl = function ($rootScope, $scope, $route, Groups) {
    $rootScope.matches = $route.current.locals.MatchesData;
    $rootScope.teams = $route.current.locals.TeamsData;
    $rootScope.grounds = $route.current.locals.GroundsData;
    $rootScope.groups = $route.current.locals.GroupsData;

    $rootScope.buildStandings = Groups.buildStandings;

    _.forEach($rootScope.groups, function(data, group) {
      $rootScope.buildStandings(group);
    });

    angular.element(document).ready(function() {
      $('[data-toggle~="tooltip"]').tooltip();
    });

    if ($scope.$root.currentUser) {
      var
      UserMatches = Parse.Object.extend('UserMatches'),
      query = new Parse.Query(UserMatches);

      query.equalTo('userId', $scope.$root.currentUser.id);
      query.find().then(function(result){
        if (result.length) {
          var matches = JSON.parse(result[0].get('matches'));
          _.forEach(matches, function(match){
            var $match =_.find($rootScope.matches, {id: match.id});
            $match.teams.home.goals = match.teams.home.goals;
            $match.teams.away.goals = match.teams.away.goals;
          });
          $scope.$apply();
        }
      });
    }
  };

  var MatchesCtrl = function ($rootScope, $scope) {
    $scope.matches = _.groupBy($rootScope.matches, 'stage');
    _.forEach($scope.matches, function(matches, stage) {
      $scope[stage.replace(/\s/g, '')] = _.groupBy(matches, function(match){
        return match.date.getDate() + '/' + parseInt(match.date.getMonth()+1);
      });
    });
  };

  angular.module('worldcup.controllers', [])
    .controller('TopNavCtrl', ['$rootScope', '$scope', '$location', TopNavCtrl])
    .controller('UserCtrl', ['$scope', UserCtrl])
    .controller('HomeCtrl', ['$scope', '$route', HomeCtrl])
    .controller('MainCtrl',
      ['$rootScope', '$scope', '$route', 'Groups', 'Matches', MainCtrl])
    .controller('MatchesCtrl', ['$rootScope', '$scope', MatchesCtrl]);
})();
