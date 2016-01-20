(() => {
  'use strict';
  let expect = chai.expect;
  let toArray = (value) => {
    return Array.prototype.slice.call(new Uint8Array(value));
  };
  let toArray16 = (value) => {
    return Array.prototype.slice.call(new Uint16Array(value));
  };

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

  let lockState = () => characteristics[0];
  let lock = () => characteristics[1];
  let unlock = () => characteristics[2];
  let data = () => characteristics[3];
  let flags = () => characteristics[4];
  let powerLevels = () => characteristics[5];
  let powerMode = () => characteristics[6];
  let period = () => characteristics[7];
  let reset = () => characteristics[8];

  describe('Core Eddystone-URL Tests', () => {
    before(function(done) {
      this.timeout(0);
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
          done();
        }).catch(error => {
          alert(error.name + ': ' + error.message);
        });
    });
    beforeEach((done) => {
      // Delay before each test until we figure out
      // why we get a GATT operation in progress error.
      setTimeout(done, 1000);
    });
    describe('Lock State', () => {
      it('Read Lock State', () => {
        return expect(lockState().readValue().then(toArray))
          .to.eventually.deep.equal([0]);
      });
    });
    describe('Reset', () => {
      it('Write Reset', () => {
        return expect(reset().writeValue(new Uint8Array([1])))
          .to.be.fulfilled;
      });
    });
    describe('Data', () => {
      it('Write Data', () => {
        return expect(data().writeValue(new Uint8Array([0,0])))
          .to.be.fulfilled;
      });
      it('Read Data', () => {
        return expect(data().readValue().then(toArray))
          .to.eventually.deep.equal([0, 0]);
      });
    });
    describe('Tx Power Levels', () => {
      const TX_POWER_LEVELS = [1, 2, 3, 4];
      it('Write Levels', () => {
        return expect(powerLevels().writeValue(new Uint8Array(TX_POWER_LEVELS)))
          .to.be.fulfilled;
      });
      it('Read Levels', () => {
        return expect(powerLevels().readValue().then(toArray))
          .to.eventually.deep.equal(TX_POWER_LEVELS);
      });
    });
    describe('Tx Power Mode', () => {
      it('Write Mode', () => {
        return expect(powerMode().writeValue(new Uint8Array([0])))
          .to.be.fulfilled;
      });
      it('Read Mode', () => {
        return expect(powerMode().readValue().then(toArray))
          .to.eventually.deep.equal([0]);
      });
    });
    describe('Period', () => {
      it('Write Period', () => {
        return expect(period().writeValue(new Uint16Array([1000])))
          .to.be.fulfilled;
      });
      it('Write and read Period', () => {
        return expect(period().readValue().then(toArray16))
          .to.eventually.deep.equal([1000]);
      });
    });
    describe('Reset to defaults', () => {
      it('Write Reset', () => {
        return expect(reset().writeValue(new Uint8Array([1])))
          .to.be.fulfilled;
      });
    });
  });
})();
