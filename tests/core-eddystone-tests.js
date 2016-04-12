(() => {
  'use strict';
  let expect = chai.expect;

  let toUint8Array = (value) => {
    return Array.prototype.slice.call(new Uint8Array(value));
  };
  let toUint16Array = (value) => {
    return Array.prototype.slice.call(new Uint16Array(value));
  };
  let toInt8Array = (value) => {
    return Array.prototype.slice.call(new Int8Array(value));
  }

  let toPropertiesArray = (properties) => {
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
        expect(toPropertiesArray(capabilities().properties))
          .to.eql(['read']);
      });
      it('Length >= 7', function() {
        this.timeout(0);
        return expect(capabilities()
          .readValue()
          .then(val => toInt8Array(val)))
          .to.eventually.have.length.of.at.least(6);
      });
      it('Version should be 0x00', function() {
        this.timeout(0);
        return expect(capabilities()
          .readValue()
          .then(val => toInt8Array(val)[0]))
          .to.eventually.equal(0x00);
      });
    });

    describe('Active Slot', function() {
      it('Characteristic Properties', function() {
        this.timeout(0);
        expect(toPropertiesArray(active_slot().properties))
          .to.eql(['read', 'write']);
      });
      it('Write and Read [1]', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([1]))
          .then(() => active_slot().readValue())
          .then(val => toUint8Array(val)))
          .to.eventually.eql([1]);
      });
      it('Write and Read [0]', function() {
        this.timeout(0);
        return expect(active_slot()
          .writeValue(new Uint8Array([0]))
          .then(() => active_slot().readValue())
          .then(val => toUint8Array(val)))
          .to.eventually.eql([0]);
      });
    });

    describe('Advertising Interval', function() {
      it('Characteristic Properties', function() {
        this.timeout(0);
        expect(toPropertiesArray(advertising_interval().properties))
          .to.eql(['read', 'write']);
      });
      it('Read', function() {
        this.timeout(0);
        return expect(active_slot().readValue()
          .then(val => console.log(toUint16Array(val))));
      });
    });
  });
})();
