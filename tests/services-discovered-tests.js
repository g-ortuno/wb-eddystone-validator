(() => {
  'use strict';
  let expect = chai.expect;

  const CONFIG_UUID = 'ee0c2080-8786-40ba-ab96-99b91ac981d8';
  const TEST_UUID   = 'deadbeef-0000-0000-0000-000000000000'
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
      return expect(global_device.gatt.getPrimaryService(TEST_UUID)).to.be.fulfilled;
    });
    it('Print characteristics', function() {
      this.timeout(0);
      return expect(global_device.gatt.getPrimaryService(TEST_UUID)
          .then(s => {
            s.getCharacteristics()
                .then(characteristics => {
                  let output_div = document.querySelector('div#test-output')

                  let service_heading_text = document.createTextNode('Service:');
                  let service_heading = document.createElement('h3');
                  service_heading.appendChild(service_heading_text);
                  output_div.appendChild(service_heading);

                  let service_uuid = document.createTextNode(s.uuid);
                  output_div.appendChild(service_uuid);

                  let characteristics_heading_text = document.createTextNode(
                      'Characteristics:');
                  let characteristics_heading = document.createElement('h4');
                  characteristics_heading.appendChild(
                      characteristics_heading_text);

                  output_div.appendChild(characteristics_heading);

                  let characteristic_count = 1;
                  characteristics.forEach(characteristic => {
                    let text = document.createTextNode(
                            characteristic_count++ + ". " + characteristic.uuid);

                    let char_div = document.createElement('div');
                    char_div.appendChild(text);

                    output_div.appendChild(char_div);
                  });
                });
          })).to.be.fulfilled;
    });
  });
})();
