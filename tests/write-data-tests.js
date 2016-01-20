(() => {
  'use strict';
  let expect = chai.expect;

  const CONFIG_UUID = 'ee0c2080-8786-40ba-ab96-99b91ac981d8';
  const DATA = 'ee0c2084-8786-40ba-ab96-99b91ac981d8';

  let global_data;

  const byte = new Uint8Array([1]);

  describe('Write Data Tests', () => {
    before(function(done) {
      this.timeout(0);
      navigator.bluetooth
        .requestDevice({filters: [{services: [CONFIG_UUID]}]}).then(device => {
          console.log('Found Device...');
          return device.connectGATT();
        }).then(gattServer => {
          console.log('Connected to device...');
          return gattServer.getPrimaryService(CONFIG_UUID);
        }).then(service => {
          console.log('Discovered services');
          return service.getCharacteristic(DATA);
        }).then(data_characteristic => {
          console.log('Got characteristic');
          global_data = data_characteristic;
          done();
        });
    });
    it('Write data 10 times', () => {
      let write = () => global_data.writeValue(byte);
      return expect(write().then(write()).then(write()).then(write())).to.be.fulfilled;
    });
  });
})();
