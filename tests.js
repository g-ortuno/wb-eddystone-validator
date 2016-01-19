(() => {
  'use strict';
  let expect = chai.expect;
  let toArray = (value) => {
    return Array.prototype.slice.call(new Uint8Array(value));
  };
  let toArray16 = (value) => {
    return Array.prototype.slice.call(new Uint16Array(value));
  };

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
    beforeEach((done) => {
      // Delay before each test until we figure out
      // why we get a GATT operation in progress error.
      setTimeout(done, 1000);
    });
    it('Read Lock State', () => {
      return expect(lockState().readValue().then(toArray))
        .to.eventually.deep.equal([0]);
    });
    it('Write Reset', () => {
      return expect(reset().writeValue(new Uint8Array([1])))
          .to.be.fulfilled;
    });
    it('Write and Read Data', () => {
      return expect(data().writeValue(new Uint8Array([0,0]))
          .then(() => data().readValue())
          .then(toArray)).to.eventually.deep.equal([0,0]);
    });
    it('Write and Read Tx Power Levels', () => {
      const TX_POWER_LEVELS = [1, 2, 3, 4];
      return expect(powerLevels().writeValue(new Uint8Array(TX_POWER_LEVELS))
          .then(() => powerLevels().readValue())
          .then(toArray)).to.eventually.deep.equal(TX_POWER_LEVELS);
    });
    it('Write and Read Tx Power Mode', () => {
      return expect(powerMode().writeValue(new Uint8Array([0]))
          .then(() => powerMode().readValue())
          .then(toArray)).to.eventually.deep.equal([0]);
    });
    it('Write and read Period', () => {
      return expect(period().writeValue(new Uint16Array([1000]))
          .then(() => period().readValue())
          .then(toArray16)).to.eventually.deep.equal([1000]);
    });
    it('Write Reset', () => {
      return expect(reset().writeValue(new Uint8Array([1])))
          .to.be.fulfilled;
    });
  });
})();
