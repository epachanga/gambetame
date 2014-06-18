(function () {
  'use strict';

  var orderStandings = function(Utils) {
    return Utils.orderStandings;
  }

  var capitalize = function() {
    return function(input) {
      if (input!=null) {
        input = input.toLowerCase();
        return input.substring(0,1).toUpperCase()+input.substring(1);
      }
    }
  }


  angular.module('worldcup.filters', [])
    .filter('orderStandings', ['Utils', orderStandings])
    .filter('capitalize', capitalize);
})();
