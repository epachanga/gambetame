(function () {
  'use strict';

  var TopNavCtrl = function($scope, $location) {
    $scope.selected = '';

    $scope.$watch(function(){ return $location.path(); },
      function(newVal, oldVal){
        $scope.selected = $location.path().split('/')[1];
      }
    );
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
      FB.logout();
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

  var MainCtrl = function ($scope, $route, Groups) {
    $scope.$root.matches = $route.current.locals.MatchesData;
    $scope.$root.teams = $route.current.locals.TeamsData;
    $scope.$root.grounds = $route.current.locals.GroundsData;
    $scope.$root.groups = $route.current.locals.GroupsData;

    $scope.$root.buildStandings = Groups.buildStandings;

    _.forEach($scope.$root.groups, function(data, group) {
      $scope.$root.buildStandings(group);
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
            var $match =_.find($scope.$root.matches, {id: match.id});
            $match.teams.home.goals = match.teams.home.goals;
            $match.teams.away.goals = match.teams.away.goals;
          });
          $scope.$apply();
        }
      });
    }
  };

  var MatchesCtrl = function ($scope) {
    $scope.matches = _.groupBy($scope.$root.matches, 'stage');
    _.forEach($scope.matches, function(matches, stage) {
      $scope[stage.replace(/\s/g, '')] = _.groupBy(matches, function(match){
        return match.date.getDate() + '/' + parseInt(match.date.getMonth()+1);
      });
    });
  };

  var GroupCtrl = function($scope, $routeParams) {
    $scope.group = $routeParams.group;
  };

  var HomeCtrl = function($scope) {
    var firstMatch = _.find($scope.$root.matches, {id: 1});
    $scope.startTime = firstMatch.date.getTime();
  };

  angular.module('worldcup.controllers', [])
    .controller('MainCtrl', ['$scope', '$route', 'Groups', 'Matches', MainCtrl])
    .controller('TopNavCtrl', ['$scope', '$location', TopNavCtrl])
    .controller('HomeCtrl', ['$scope', HomeCtrl])
    .controller('GroupCtrl', ['$scope', '$routeParams', GroupCtrl])
    .controller('MatchesCtrl', ['$scope', MatchesCtrl])
    .controller('UserCtrl', ['$scope', UserCtrl])
    ;
})();
