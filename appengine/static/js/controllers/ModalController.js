// var ModalDemoCtrl = function ($scope, $modal, $log) {

//   $scope.items = ['item1', 'item2', 'item3'];

//   $scope.open = function () {

//     var modalInstance = $modal.open({
//       templateUrl: 'myModalContent.html',
//       controller: ModalInstanceCtrl,
//       resolve: {
//         items: function () {
//           return $scope.items;
//         }
//       }
//     });

//     modalInstance.result.then(function (selectedItem) {
//       $scope.selected = selectedItem;
//     }, function () {
//       $log.info('Modal dismissed at: ' + new Date());
//     });
//   };

// };

var ModalInstanceCtrl = function ($scope, $modalInstance, user, profile) {

  $scope.profile = profile;
  $scope.user = user; 

  $scope.ok = function () {
    $modalInstance.close('closed');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};