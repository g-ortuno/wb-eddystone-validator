(() => {
  'use strict';
  let expect = chai.expect;

  let stub_func = () => {
    return new Promise(resolve => setTimeout(() => resolve('Stub'), 1500));
  };

  describe('Stub suite', () => {
    it('Stub test', () => {
      return expect(stub_func()).to.eventually.equal('Stub');
    });
  });
})();
