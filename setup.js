(() => {
  'use strict';

  let clearPreviousTests = () => {
    let testDiv = document.querySelector('#mocha');
    testDiv.innerHTML = "";
  };

  mocha.setup('bdd');

  window.startCoreTest = () => {
    clearPreviousTests();
    window.history.pushState({}, 'Test', '/?grep=Core Eddystone-URL Tests');
    mocha.run();
  };
})();
