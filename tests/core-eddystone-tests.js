(() => {
  'use strict';
  let expect = chai.expect;

  let toUint8Array = (value, bigEndian = false) => {
    return Array.prototype.slice.call(new Uint8Array(value.buffer));
  };

  let toUint16Array = (value) => {
    return Array.prototype.slice.call(new Uint16Array(value.buffer));
  };

  let toInt8Array = (value) => {
    return Array.prototype.slice.call(new Int8Array(value.buffer));
  };

  let getHalf = (encrypted) => {
    let array = toUint8Array(new Uint8Array(encrypted));
    var half_length = Math.ceil(array.length / 2);
    return new Uint8Array(array.slice(0, half_length).reverse());
  };

  let getUint8Array = (value) => {
    return toUint8Array(new Uint8Array(value));
  };

  let reverse = (dataview) => {
    let array = toUint8Array(new Uint8Array(dataview.buffer));
    return new Uint8Array(array.reverse());
  };

  let encrypt = (key, data) => {
    //console.log('Key');
    //console.log(toUint8Array(key));
    //console.log('Data');
    //console.log(toUint8Array(data));
    return window.crypto.subtle.importKey('raw', key, {name: 'aes-cbc'}, true, ['encrypt'])
      .then(k => window.crypto.subtle.encrypt({name: 'aes-cbc', iv: new Uint8Array(16)}, k, data))
      .then(getHalf)
      .then(encrypted_data => {
        // console.log('Encrypted');
        // console.log(encrypted_data);
        return encrypted_data;
      });
  };

  let toLockState = (val) => {
    let lock_s = toUint8Array(val)[0];
    if (lock_s == 0)
      return 'locked';
    if (lock_s == 1)
      return 'unlocked';
    if (lock_s == 2)
      return 'unlocked, relock disabled';
    return 'unknown';
  }

  let getLockValue = (old_key, new_key) => {
    return encrypt(old_key, new_key)
      .then(reverse)
      .then(toUint8Array)
      .then(e => {
        let val = [0, ...e];
        /* console.log('Old Key');
           console.log(toUint8Array(old_key));
           console.log('New Key');
           console.log(toUint8Array(new_key));
           console.log('Lock value');
           console.log(val); */
        return new Uint8Array(val);
      });
  };

  let toPropertiesArray = (characteristic) => {
    let properties = characteristic.properties;
    let properties_array = [];
    if (properties.broadcast)
      properties_array.push('broadcast');
    if (properties.read)
      properties_array.push('read');
    if (properties.writeWithoutResponse)
      properxties_array.push('writeWithoutResponse');
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
    'a3c8750a-8ed3-4bdf-8a39-a01bebede295');
  let factory_reset = () => window.characteristics.get(
    'a3c8750b-8ed3-4bdf-8a39-a01bebede295');
  let remain_connectable = () => window.characteristics.get(
    'a3c8750c-8ed3-4bdf-8a39-a01bebede295');

  let getCapabilities = () => {
    return capabilities()
        .readValue()
        .then(toInt8Array)
        .then(val => {
          let caps = {
            'version': val[0],
            'max_supported_total_slots': val[1],
            'max_supported_eid_slots': val[2],
            'capabilities': {
              'variable_adv_supported': !!(val[3] & 0x01),
              'variable_tx_power_supported': !!(val[3] & 0x02),
              'update_key_unencrypted': !!(val[3] & 0x04)
            },
            'supported_frame_types_bit_field': (() => {
              console.log(val[4].toString(2));
              console.log(val[5].toString(2));
              let supported_frame_types_bits = (val[4] << 4) | val[5];
              let array = [];

              if (!!(supported_frame_types_bits & 0x01))
                array.push('uid');
              if (!!(supported_frame_types_bits & 0x02))
                array.push('url');
              if (!!(supported_frame_types_bits & 0x04))
                array.push('tlm');
              if (!!(supported_frame_types_bits & 0x8))
                array.push('eid');
              if (!!(supported_frame_types_bits & 0xFFF0))
                array.push('unknown');
              return array;
            })(),
            'supported_radio_tx_power': val.slice(6)
          };
          return caps;
        });
  };

  let changeToSlot = i => {
    return active_slot().writeValue(new Uint8Array([i]));
  }

  let toAdvData = val => {
    let v = toInt8Array(val);
    let adv_data = {};
    // 0x00 (UID), 0x10 (URL), 0x20 (TLM), 0x30 (EID)
    if (v[0] === 0x00)
      adv_data.frame_type = 'uid';
    else if (v[0] === 0x10)
      adv_data.frame_type = 'url';
    else if (v[0] === 0x20)
      adv_data.frame_type = 'tlm';
    else if (v[0] === 0x30)
      adv_data.frame_type = 'eid';
    else
      adv_data.frame_type = 'unknown';

    adv_data.data = v.slice(1);
    return adv_data;
  }


  const expected_capabilities = {
    'version': 0x00,
    'max_supported_total_slots': 0x03,
    'max_supported_eid_slots': 0x00,
    'capabilities': {
      'variable_adv_supported': true,
      'variable_tx_power_supported': true,
      'update_key_unencrypted': false
    },
    'supported_frame_types_bit_field': ['uid', 'url', 'tlm'],
    'supported_radio_tx_power': [-30, -16, -4, 4]
  };

  window.BluetoothRemoteGATTServer.prototype.discoverService = function(service_uuid) {
    let self = this;
    return this.getPrimaryService(CONFIG_UUID)
      .then(service => {
        console.log('Service discovered: ' + service.uuid);
        return service.getCharacteristics();
      })
      .then(characteristics => {
        this.characteristics = new Map();
        for (let characteristic of characteristics) {
          this.characteristics.set(characteristic.uuid, characteristic);
        }
        return this.characteristics;
      });
  };

  describe('Core Eddystone-URL Tests', function() {
    let cached = {};
    cached.capabilities;
    cached.active_slot = 0;
    cached.advertising_intervals = [];
    cached.radio_tx_powers = [];
    cached.advertised_tx_powers;
    cached.lock_state;
    cached.adv_slot_data = [];

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

    after(function(done) {
      this.timeout(0);
      factory_reset().writeValue(new Uint8Array([0x0b])).then(done);
    });

    describe('Factory Reset', function() {
      it('Characteristic Properties', () => {
        expect(toPropertiesArray(factory_reset()))
          .to.eql(['write']);
      });

      it('Cache default values', function() {
        this.timeout(0);
        let test_promise = factory_reset().writeValue(new Uint8Array([0x0b]))
            .then(() => getCapabilities())
            .then(c => cached.capabilities = c)
            .then(() => active_slot().readValue())
            .then(toUint8Array)
            .then(a => cached.active_slot = a[0])
            .then(() => {
              let a_promise = Promise.resolve();
              for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
                a_promise = a_promise
                    .then(() => active_slot().writeValue(new Uint8Array([i])))
                    .then(() => advertising_interval().readValue())
                    .then(val => val.getInt16(0, false))
                    .then(val => cached.advertising_intervals.push(val));
              }
              return a_promise;
            })
            .then(() => {
              let r_promise = Promise.resolve();
              for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
                r_promise = r_promise
                  .then(() => active_slot().writeValue(new Uint8Array([i])))
                  .then(() => radio_tx_power().readValue())
                  .then(toInt8Array)
                  .then(val => cached.radio_tx_powers.push(val[0]));
              }
              return r_promise;
            })
            .then(() => advertised_tx_power().readValue())
            .then(toInt8Array)
            .then(val => cached.advertised_tx_power = val[0])
            .then(() => lock_state().readValue())
            .then(toLockState)
            .then(val => cached.lock_state = val)
            .then(() => {
              let a_promise = Promise.resolve();
              for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
                a_promise = a_promise
                  .then(() => changeToSlot(i))
                  .then(() => adv_slot_data().readValue())
                  .then(toAdvData)
                  .then(d => cached.adv_slot_data.push(d));
              }
              return a_promise;
            })
            .then(() => console.log(cached));
        return expect(test_promise).to.be.fulfilled;
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

      it('Capabilities bit field RFU', function() {
        this.timeout(0);
        return expect(capabilities()
          .readValue()
          .then(val => !!(toInt8Array(val)[3] & 0b11111000)))
          .to.eventually.be.false;
      });

      it('Version', function() {
        this.timeout(0);
        return expect(getCapabilities()
          .then(c => c.version))
          .to.eventually.eql(expected_capabilities.version);
      });

      it('Max Supported Total Slots', function() {
        this.timeout(0);
        return expect(getCapabilities()
          .then(c => c.max_supported_total_slots))
          .to.eventually.eql(expected_capabilities.max_supported_total_slots);
      });
      
      it('Max Supported EID Slots', function() {
        this.timeout(0);
        return expect(getCapabilities()
          .then(c => c.max_supported_eid_slots))
          .to.eventually.eql(expected_capabilities.max_supported_eid_slots);
      });

      it('Capabilities', function() {
        this.timeout(0);
        let caps = getCapabilities().then(c => c.capabilities);

        return Promise.all([
          expect(caps
            .then(c => c.variable_adv_supported))
            .to.eventually.eql(expected_capabilities.capabilities.variable_adv_supported),
          expect(caps
            .then(c => c.variable_tx_power_supported))
            .to.eventually.eql(expected_capabilities.capabilities.variable_tx_power_supported),
          expect(caps
            .then(c => c.update_key_unencrypted))
            .to.eventually.eql(expected_capabilities.capabilities.update_key_unencrypted)]);
      });

      it('Supported Frame Types Bit Field', function() {
        this.timeout(0);
        return expect(getCapabilities()
          .then(c => c.supported_frame_types_bit_field))
          .to.eventually.eql(expected_capabilities.supported_frame_types_bit_field);
      });

      it('Supported Radio Tx Power', function() {
        this.timeout(0);
        return expect(getCapabilities()
          .then(c => c.supported_radio_tx_power))
          .to.eventually.eql(expected_capabilities.supported_radio_tx_power);
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
        this.test.title += ' (' + cached.capabilities.max_supported_total_slots +
                           ' slots)';
        let values_read = [];
        let values_written = [];
        let test_promise = Promise.resolve();
        for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
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
          .writeValue(new Uint8Array([cached.capabilities.max_supported_total_slots])))
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
        if (cached.capabilities.capabilities.variable_adv_supported) {
          this.test.title = 'Write (Variable Adv)';
          let test_promise = Promise.resolve();
          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
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
        if (cached.capabilities.capabilities.variable_adv_supported) {
          this.test.title = 'Read (Variable Adv)';
          let values_read = [];
          let test_promise = Promise.resolve();
          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
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
        if (cached.capabilities.capabilities.variable_adv_supported) {
          let base_value = new DataView(new ArrayBuffer(2));
          base_value.setInt16(0, 1000, false);
          let min_value = new DataView(new ArrayBuffer(2));
          min_value.setInt16(0, 1, false);

          let test_promise = Promise.resolve();
          let base_values_written = [];
          let min_values_read = [];
          let base_values_read = [];

          let reset = () => {
            let promise = Promise.resolve();
            for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
              promise = promise.then(() => active_slot().writeValue(new Uint8Array([i])))
                .then(() => advertising_interval().writeValue(base_value));
            }
            return promise;
          };

          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
            test_promise = test_promise.then(() => reset());
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              if (i === j) {
                test_promise = test_promise
                  .then(() => active_slot().writeValue(new Uint8Array([j])))
                  .then(() => advertising_interval().writeValue(min_value));
              } else {
                base_values_written.push(base_value.getInt16(0, false));
              }
            }
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
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
              .to.eventually.not.include(1),
            expect(test_promise.then(() => base_values_read))
              .to.eventually.eql(base_values_written)]);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });
      it('Write and Read Max', function() {
        this.timeout(0);
        if (cached.capabilities.capabilities.variable_adv_supported) {
          let base_value = new DataView(new ArrayBuffer(2));
          base_value.setInt16(0, 1000, false);
          let max_value = new DataView(new ArrayBuffer(2));
          max_value.setInt16(0, 0xffff, false);

          let test_promise = Promise.resolve();
          let base_values_written = [];
          let max_values_read = [];
          let base_values_read = [];

          let reset = () => {
            let promise = Promise.resolve();
            for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
              promise = promise.then(() => active_slot().writeValue(new Uint8Array([i])))
                .then(() => advertising_interval().writeValue(base_value));
            }
            return promise;
          };

          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
            test_promise = test_promise.then(() => reset());
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              if (i === j) {
                test_promise = test_promise
                  .then(() => active_slot().writeValue(new Uint8Array([j])))
                  .then(() => advertising_interval().writeValue(max_value));
              } else {
                base_values_written.push(base_value.getInt16(0, false));
              }
            }
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              test_promise = test_promise
                .then(() => active_slot().writeValue(new Uint8Array([j])))
                .then(() => advertising_interval().readValue())
                .then(val => {
                  if (i === j) {
                    max_values_read.push(val.getInt16(0, false));
                  } else {
                    base_values_read.push(val.getInt16(0, false));
                  }
                });
            }
          }
          return Promise.all([
            expect(test_promise.then(() => max_values_read))
              .to.eventually.not.include(0xffff),
            expect(test_promise.then(() => base_values_read))
              .to.eventually.eql(base_values_written)]);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });
      it('Disable', function() {
        this.timeout(0);
        if (cached.capabilities.capabilities.variable_adv_supported) {
          let base_value = new DataView(new ArrayBuffer(2));
          base_value.setInt16(0, 1000, false);
          let disable_value = new DataView(new ArrayBuffer(2));
          disable_value.setInt16(0, 0, false);

          let test_promise = Promise.resolve();
          let values_written = [];
          let values_read = [];

          let reset = () => {
            let promise = Promise.resolve();
            for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
              promise = promise.then(() => active_slot().writeValue(new Uint8Array([i])))
                .then(() => advertising_interval().writeValue(base_value));
            }
            return promise;
          };

          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
            test_promise = test_promise.then(() => reset());
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              if (i === j) {
                test_promise = test_promise
                  .then(() => active_slot().writeValue(new Uint8Array([j])))
                  .then(() => advertising_interval().writeValue(disable_value));
                values_written.push(0);
              } else {
                values_written.push(1000);
              }
            }
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              test_promise = test_promise
                .then(() => active_slot().writeValue(new Uint8Array([j])))
                .then(() => advertising_interval().readValue())
                .then(val => {
                  values_read.push(val.getInt16(0, false));
                });
            }
          }
          return expect(test_promise.then(() => values_read))
            .to.eventually.eql(values_written);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });
    });

    // TODO: Radio Tx Power
    // TODO: Advertised Tx Power

    describe('Lock', function() {
      it('Lock State Properties', () => {
        expect(toPropertiesArray(lock_state()))
          .to.eql(['read', 'write']);
      });

      it('Unlock Properties', () => {
        expect(toPropertiesArray(unlock()))
          .to.eql(['read', 'write']);
      });

      it('Unlocked', function() {
        return expect(lock_state().readValue().then(toUint8Array))
                                  .to.eventually.eql([1]);
      });

      it('Read Unlock while unlocked', function() {
        return expect(unlock().readValue()).to.be.rejected;
      });

      it('Write Unlock while unlocked', function() {
        return expect(unlock().writeValue(new Uint8Array(16)))
          .to.be.rejected;
      });

      it('Challenge is different', function() {
        let val1;
        let val2;
        return expect(unlock()
            .readValue()
            .then(toInt8Array)
            .then(val => val1 = val)
            .then(() => unlock().readValue())
            .then(toInt8Array)
            .then(val => val2 = val)
            .then(() => val2)).to.eventually.not.be.eql(val1);
      });

      it('Lock', function() {
        return expect(lock_state()
            .writeValue(new Uint8Array([0]))
            .then(() => lock_state().readValue())
            .then(toUint8Array))
          .to.eventually.eql([0]);
      });

      [2, 16, 18].forEach(length => {
        it('Write length ' + length, function() {
          this.timeout(0);
          let test_promise = Promise.resolve()
              .then(() => lock_state().readValue())
              .then(() => lock_state().writeValue(new Uint8Array(length)))
          return expect(test_promise).to.be.rejected;
        });
      });

      it('Unlock', function() {
        let key = new Uint8Array(16);

        let test_promise = Promise.resolve()
          .then(() => unlock().readValue())
          .then(data => encrypt(key, data))
          .then(reverse)
          .then(unlock_token => unlock().writeValue(unlock_token))
          .then(() => lock_state().readValue())
          .then(toUint8Array);

        return expect(test_promise).to.eventually.eql([1]);
      });

      const TEST_KEY = [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5];

      it('Lock with key', function() {
        this.timeout(0);
        let old_key = new Uint8Array(16);
        let new_key = new Uint8Array(TEST_KEY);

        let test_promise = Promise.resolve()
          .then(() => getLockValue(old_key, new_key))
          .then(val => lock_state().writeValue(val))
          .then(() => lock_state().readValue())
          .then(toUint8Array);

        return expect(test_promise).to.eventually.eql([0]);
      });

      it('Unlock with Key', function() {
        this.timeout(0);
        let key = new Uint8Array(TEST_KEY);

        let test_promise = Promise.resolve()
            .then(() => unlock().readValue())
            .then(data => encrypt(key, data))
            .then(reverse)
            .then(unlock_token => {
              return unlock().writeValue(unlock_token);
            })
            .then(() => lock_state().readValue())
            .then(toUint8Array);
        return expect(test_promise).to.eventually.eql([1]);
      });
    });

    describe('Adv. Slot Data', function() {
      this.timeout(0);
      it('Reset', function() {
        return expect(factory_reset().writeValue(new Uint8Array([0xb0])))
          .to.be.fulfilled;
      });
      
      it('Disable', function() {
        this.timeout(0);
        if (cached.capabilities.capabilities.variable_adv_supported) {
          let base_value = new DataView(new ArrayBuffer(2));
          base_value.setInt16(0, 1000, false);
          let base_url = new Uint8Array([0x10, 0, 1, 2, 3, 4]);
          let disable_value = new DataView(new ArrayBuffer(2));
          disable_value.setInt16(0, 0, false);

          let test_promise = Promise.resolve();
          let values_written = [];
          let values_read = [];

          let reset = () => {
            let promise = Promise.resolve();
            for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
              promise = promise.then(() => active_slot().writeValue(new Uint8Array([i])))
                .then(() => advertising_interval().writeValue(base_value))
                .then(() => adv_slot_data().writeValue(base_url));
            }
            return promise;
          };

          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
            test_promise = test_promise.then(() => reset());
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              if (i === j) {
                test_promise = test_promise
                  .then(() => active_slot().writeValue(new Uint8Array([j])))
                  .then(() => advertising_interval().writeValue(disable_value));
                values_written.push([]);
              } else {
                values_written.push(toUint8Array(base_url));
              }
            }
            for (let j = 0; j < cached.capabilities.max_supported_total_slots; j++) {
              test_promise = test_promise
                .then(() => active_slot().writeValue(new Uint8Array([j])))
                .then(() => adv_slot_data().readValue())
                .then(toUint8Array)
                .then(val => {
                  values_read.push(val);
                });
            }
          }

          test_promise = test_promise.then(() => {
            console.log('Values read');
            console.log(values_read)
          });

          test_promise = test_promise.then(() => {
            console.log('Values written');
            console.log(values_written)
          });

          return expect(test_promise.then(() => values_read))
            .to.eventually.eql(values_written);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });

      it('Reset', function() {
        return expect(factory_reset().writeValue(new Uint8Array([0xb0])))
          .to.be.fulfilled;
      });
      
      it('Write URL', function() {
        this.timeout(0);
        if (cached.capabilities.capabilities.variable_adv_supported) {
          let url = [0x10, 0, 1, 2, 3];
          let base_url = new Uint8Array(url);

          let values_read = [];
          let values_written = [];

          let test_promise = Promise.resolve();

          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
            test_promise = test_promise
              .then(() => changeToSlot(i))
              .then(() => adv_slot_data().writeValue(base_url));
            values_written.push([0x10, -13, 0, 1, 2, 3]);
          }

          for (let i = 0; i < cached.capabilities.max_supported_total_slots; i++) {
            test_promise = test_promise
              .then(() => changeToSlot(i))
              .then(() => adv_slot_data().readValue())
              .then(toInt8Array)
              .then(v => values_read.push(v));
          }

          test_promise = test_promise.then(() => {
            console.log('Values read');
            console.log(values_read)
          });

          test_promise = test_promise.then(() => {
            console.log('Values written');
            console.log(values_written)
          });

          return expect(test_promise.then(() => values_written))
                                    .to.eventually.eql(values_read);
        } else {
          return expect(Promise.reject()).to.be.fulfilled;
        }
      });
    });
    // TODO: Public ECDH Key
    // TODO: EID Identity Key
  });
})();
