(() => {
  'use strict';
  let expect = chai.expect;

  const CONFIG_UUID = 'ee0c2080-8786-40ba-ab96-99b91ac981d8';
  let global_device;
  let global_server;

  describe('Services Discovered Tests', function() {
    // Set slow to 0 so that we see the times for all tests.
    this.slow(0);
    before(function(done) {
      this.timeout(0);
      if (!global_device) {
        navigator.bluetooth
          .requestDevice({filters: [{services: [CONFIG_UUID]}]}).then(device => {
            global_device = device;
            done();
          });
      } else {
        done();
      }
    });
    it('Connect', function() {
      this.timeout(0);
      return expect(global_device.gatt.connect()).to.be.fulfilled;
    });
    it('Discover Services', function() {
      this.timeout(0);
      return expect(global_device.gatt.getPrimaryService(CONFIG_UUID)).to.be.fulfilled;
    });
  });
})();
