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

  window.BluetoothRemoteGATTCharacteristic

  describe('Core Eddystone-URL Tests', function() {
    let caps_obj;
    before(function(done) {
      this.timeout(0);
      navigator.bluetooth
        .requestDevice({filters: [{services: [CONFIG_UUID]}]}).then(device => {
          console.log('Found device...');
          window.device = device;
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
      it('Version should be 0x01', function() {
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
          .then(val => !!(toInt8Array(val)[3] & 0b11111000)))
          .to.eventually.be.false;
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

      it('Write and Read', function() {
        this.timeout(0);
        this.test.title += ' (' + caps_obj.max_supported_total_slots +
                           ' slots)';
        let values_read = [];
        let values_written = [];
        let test_promise = Promise.resolve();
        for (let i = 0; i < caps_obj.max_supported_total_slots; i++) {
          values_written.push([i]);
          test_promise = test_promise
            .then(() => active_slot().writeValue(new Uint8Array([i])))
            .then(() => active_slot().readValue())
            .then(toUint8Array)
            .then(value => values_read.push(value));
        }
        test_promise = test_promise.then(() => values_read);
        return expect(test_promise).to.eventually.eql(values_written);
      });

      it('Write a value bigger than what the capabilities allow', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([caps_obj.max_supported_total_slots])))
        .to.be.rejected;
      });

      it('Write a value with wrong length', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([0, 0])))
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
            let val = 500 + i;
            // TODO: Find a better way to write big endian.
            let dataView = new DataView(new ArrayBuffer(2));
            dataView.setInt16(0, val, false);
            values_written.push(val);
            test_promise = test_promise
              .then(() => active_slot().writeValue(new Uint8Array([i])))
              .then(() => advertising_interval().writeValue(dataView));
          }
          return expect(test_promise).to.be.fulfilled;
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
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
              .then(val => val.getInt16(0, false))
              .then(value => values_read.push(value));
          }
          return expect(test_promise.then(() => values_read))
            .to.eventually.eql(values_written);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });

      it('Write and Read Min', function() {
        this.timeout(0);
        if (caps_obj.capabilities.variable_adv_supported) {
          let base_value = new DataView(new ArrayBuffer(2));
          base_value.setInt16(0, 1000, false);
          let min_value = new DataView(new ArrayBuffer(2));
          min_value.setInt16(0, 1, false);

          let test_promise = Promise.resolve();
          let min_values_written = [];
          let base_values_written = [];
          let min_values_read = [];
          let base_values_read = [];

          let reset = () => {
            let promise = Promise.resolve();
            for (let i = 0; i < caps_obj.max_supported_total_slots; i++) {
              promise = promise.then(() => active_slot().writeValue(new Uint8Array([i])))
                .then(() => advertising_interval().writeValue(base_value));
            }
            return promise;
          };

          for (let i = 0; i < caps_obj.max_supported_total_slots; i++) {
            test_promise = test_promise.then(() => reset());
            for (let j = 0; j < caps_obj.max_supported_total_slots; j++) {
              if (i === j) {
                test_promise = test_promise
                  .then(() => active_slot().writeValue(new Uint8Array([j])))
                  .then(() => advertising_interval().writeValue(min_value));
                min_values_written.push(min_value.getInt16(0, false));
              } else {
                base_values_written.push(base_value.getInt16(0, false));
              }
            }
            for (let j = 0; j < caps_obj.max_supported_total_slots; j++) {
              test_promise = test_promise
                .then(() => active_slot().writeValue(new Uint8Array([j])))
                .then(() => advertising_interval().readValue())
                .then(val => {
                  if (i === j) {
                    min_values_read.push(val.getInt16(0, false));
                  } else {
                    base_values_read.push(val.getInt16(0, false));
                  }
                });
            }
          }
          return Promise.all([
            expect(test_promise.then(() => min_values_read))
              .to.eventually.not.eql(min_values_written),
            expect(test_promise.then(() => base_values_read))
              .to.eventually.eql(base_values_written)]);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });
    });
  });
})();
