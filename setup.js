(() => {
  'use strict';

  const CONFIG_UUID = 'ee0c2080-8786-40ba-ab96-99b91ac981d8';

  const LOCK_STATE = 'ee0c2081-8786-40ba-ab96-99b91ac981d8';
  const LOCK = 'ee0c2082-8786-40ba-ab96-99b91ac981d8';
  const UNLOCK = 'ee0c2083-8786-40ba-ab96-99b91ac981d8';
  const DATA = 'ee0c2084-8786-40ba-ab96-99b91ac981d8';
  const FLAGS = 'ee0c2085-8786-40ba-ab96-99b91ac981d8';
  const POWER_LEVELS = 'ee0c2086-8786-40ba-ab96-99b91ac981d8';
  const POWER_MODE = 'ee0c2087-8786-40ba-ab96-99b91ac981d8';
  const PERIOD = 'ee0c2088-8786-40ba-ab96-99b91ac981d8';
  const RESET = 'ee0c2089-8786-40ba-ab96-99b91ac981d8';

  mocha.setup('bdd');
  window.startTest = () => {
    navigator.bluetooth
      .requestDevice({filters: [{services: [CONFIG_UUID]}]}).then(device => {
        console.log('Found device...');
        return device.connectGATT();
      }).then(gattServer => {
        console.log('Connected to device...');
        return gattServer.getPrimaryService(CONFIG_UUID);
      }).then(service => {
        console.log('Found service');
        return Promise.all([service.getCharacteristic(LOCK_STATE),
                            service.getCharacteristic(LOCK),
                            service.getCharacteristic(UNLOCK),
                            service.getCharacteristic(DATA),
                            service.getCharacteristic(FLAGS),
                            service.getCharacteristic(POWER_LEVELS),
                            service.getCharacteristic(POWER_MODE),
                            service.getCharacteristic(PERIOD),
                            service.getCharacteristic(RESET)]);
      }).then(characteristics => {
        console.log('Got characteristics');
        window.characteristics = characteristics;
        mocha.run();
      });
  };
})();
