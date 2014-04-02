(function () {
  'use strict';

  var MainCtrl = function ($scope, Grounds, Teams, Groups, Matches) {
    console.log('evme', Grounds.getData(), Teams.getData(), Groups.getData(), Matches.getData());
  };

  angular.module('worldcup.controllers', [])
    .controller('MainCtrl',
      ['$scope', 'Grounds', 'Teams', 'Groups', 'Matches', MainCtrl]);
})();
