(() => {
  'use strict';

  mocha.setup('bdd');
  window.startTest = () => {
    mocha.run();
  };
})();
