(() => {
  'use strict';

  mocha.setup('bdd');

  window.startCoreTest = () => {
    window.history.pushState({}, 'Test', '/?grep=Core Eddystone-URL Tests');
    mocha.run();
  };
})();
