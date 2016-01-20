(() => {
  'use strict';

  mocha.setup('bdd');

  window.startCoreTest = () => {
    window.history.pushState({}, 'Test', '/?grep=Core Eddystone-URL Tests');
    mocha.run();
  };
  window.startServicesDiscoveredTest = () => {
    window.history.pushState({}, 'Test', '/?grep=Services Discovered');
    mocha.run();
  };
})();
