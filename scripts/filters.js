angular.module('worldcup.filters', [])
  .filter('orderStandings', ['Utils', function(Utils) {
    return Utils.orderStandings;
  }]);
