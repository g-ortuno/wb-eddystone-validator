(() => {
  'use strict';
  let expect = chai.expect;

  let toUint8Array = (value) => {
    return Array.prototype.slice.call(new Uint8Array(value.buffer));
  };
  let toUint16Array = (value) => {
    return Array.prototype.slice.call(new Uint16Array(value.buffer));
  };
  let toInt8Array = (value) => {
    return Array.prototype.slice.call(new Int8Array(value.buffer));
  }

  let toPropertiesArray = (characteristic) => {
    let properties = characteristic.properties;
    let properties_array = [];
    if (properties.broadcast)
      properties_array.push('broadcast');
    if (properties.read)
      properties_array.push('read');
    if (properties.writeWithoutResponse)
      properties_array.push('writeWithoutResponse');
    if (properties.write)
      properties_array.push('write');
    if (properties.notify)
      properties_array.push('notify');
    if (properties.indicate)
      properties_array.push('indicate');
    if (properties.authenticatedSignedWrites)
      properties_array.push('authenticatedSignedWrites');
    if (properties.reliableWrite)
      properties_array.push('reliableWrite');
    if (properties.writableAuxiliaries)
      properties_array.push('writableAuxiliaries');
    return properties_array;
  }

  const CONFIG_UUID = 'a3c87500-8ed3-4bdf-8a39-a01bebede295';

  let capabilities = () => window.characteristics.get(
    'a3c87501-8ed3-4bdf-8a39-a01bebede295');
  let active_slot = () => window.characteristics.get(
    'a3c87502-8ed3-4bdf-8a39-a01bebede295');
  let advertising_interval = () => window.characteristics.get(
    'a3c87503-8ed3-4bdf-8a39-a01bebede295');
  let radio_tx_power = () => window.characteristics.get(
    'a3c87504-8ed3-4bdf-8a39-a01bebede295');
  let advertised_tx_power = () => window.characteristics.get(
    'a3c87505-8ed3-4bdf-8a39-a01bebede295');
  let lock_state = () => window.characteristics.get(
    'a3c87506-8ed3-4bdf-8a39-a01bebede295');
  let unlock = () => window.characteristics.get(
    'a3c87507-8ed3-4bdf-8a39-a01bebede295');
  let public_ecdh_key = () => window.characteristics.get(
    'a3c87508-8ed3-4bdf-8a39-a01bebede295');
  let eid_identity_key = () => window.characteristics.get(
    'a3c87509-8ed3-4bdf-8a39-a01bebede295');
  let adv_slot_data = () => window.characteristics.get(
    'a3c8750A-8ed3-4bdf-8a39-a01bebede295');
  let factory_reset = () => window.characteristics.get(
    'a3c8750B-8ed3-4bdf-8a39-a01bebede295');
  let remain_connectable = () => window.characteristics.get(
    'a3c8750C-8ed3-4bdf-8a39-a01bebede295');

  let getCapabilities = () => {
    return capabilities()
        .readValue()
        .then(toInt8Array)
        .then(val => {
          return {
            'version': val[0],
            'max_supported_total_slots': val[1],
            'max_supported_eid_slots': val[2],
            'capabilities': {
              'variable_adv_supported': !!(val[3] & 0x01),
              'variable_tx_power_supported': !!(val[3] & 0x02),
              'updated_key_unencrypted': !!(val[3] & 0x04)
            },
            'supported_frame_types_bit_field': [val[4], val[5]],
            'supported_radio_tx_power': val.slice(6)
          };
        });
  };

  window.BluetoothRemoteGATTServer.prototype.discoverService = function(service_uuid) {
    let self = this;
    return this.getPrimaryService(CONFIG_UUID)
      .then(service => {
        console.log('Service discovered...');
        return service.getCharacteristics();
      })
      .then(characteristics => {
        console.log('Characteristics discovered...');
        this.characteristics = new Map();
        for (let characteristic of characteristics) {
          this.characteristics.set(characteristic.uuid, characteristic);
        }
        return this.characteristics;
      });
  };

  describe('Core Eddystone-URL Tests', function() {
    let caps_obj;
    before(function(done) {
      this.timeout(0);
      navigator.bluetooth
        .requestDevice({filters: [{services: [CONFIG_UUID]}]}).then(device => {
          console.log('Found device...');
          return device.connectGATT();
        }).then(gattServer => {
          console.log('Connected to device...');
          return gattServer.discoverService(CONFIG_UUID);
        }).then(characteristics => {
          window.characteristics = characteristics;
          done();
        }).catch(error => {
          alert(error.name + ': ' + error.message);
        });
    });

    describe('Capabilities', function() {
      it('Characteristic Properties', () => {
        expect(toPropertiesArray(capabilities()))
          .to.eql(['read']);
      });
      it('Length >= 7', function() {
        this.timeout(0);
        return expect(capabilities()
          .readValue()
          .then(toInt8Array))
          .to.eventually.have.length.of.at.least(6);
      });
      it('Version should be 0x00', function() {
        this.timeout(0);
        return expect(capabilities()
          .readValue()
          .then(val => toInt8Array(val)[0]))
          .to.eventually.equal(0x00);
      });
      it('Capabilities bit field RFU', function() {
        this.timeout(0);
        return expect(capabilities()
          .readValue()
          .then(val => !!(toInt8Array(val)[4] & 0b11111000)))
          .to.eventually.be.true;
      });
      it('Cache Capabilities', function() {
        return expect(getCapabilities().then(c => caps_obj = c))
          .to.be.fulfilled;
      });
    });

    describe('Active Slot', function() {
      it('Characteristic Properties', function() {
        this.timeout(0);
        expect(toPropertiesArray(active_slot()))
          .to.eql(['read', 'write']);
      });
      // TODO WRITE MOAR
      it('Write and Read [1]', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([1]))
          .then(() => active_slot().readValue())
          .then(toUint8Array))
          .to.eventually.eql([1]);
      });
      it('Write and Read [0]', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([0]))
          .then(() => active_slot().readValue())
          .then(toUint8Array))
          .to.eventually.eql([0]);
      });
      it('Write a value bigger than what the capabilities allow', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([caps_obj.max_supported_total_slots + 1])))
        .to.be.rejected;
      });
    });
    describe('Advertising Interval', function() {
      it('Characteristic Properties', function() {
        this.timeout(0);
        expect(toPropertiesArray(advertising_interval()))
            .to.eql(['read', 'write']);
      });
      let values_written = [];
      it('Write', function() {
        this.timeout(0);
        if (caps_obj.capabilities.variable_adv_supported) {
          this.test.title = 'Write (Variable Adv)';
          let test_promise = Promise.resolve();
          for (let i = 0; i < caps_obj.max_supported_total_slots; i++) {
            let val = [500 + i];
            values_written.push(val);
            test_promise = test_promise
              .then(() => active_slot().writeValue(new Uint8Array([i])))
              .then(() => advertising_interval().writeValue(new Uint16Array(val)));
          }
          return expect(test_promise).to.be.fulfilled;
        }
      });
      it('Read', function() {
        this.timeout(0);
        if (caps_obj.capabilities.variable_adv_supported) {
          this.test.title = 'Read (Variable Adv)';
          let values_read = [];
          let test_promise = Promise.resolve();
          for (let i = 0; i < caps_obj.max_supported_total_slots; i++) {
            test_promise = test_promise
              .then(() => active_slot().writeValue(new Uint8Array([i])))
              .then(() => advertising_interval().readValue())
              .then(toUint16Array)
              .then(value => values_read.push(value));
          }
          return expect(test_promise.then(() => values_read))
            .to.eventually.eql(values_written);
        }
      });
    });
  });
})();
