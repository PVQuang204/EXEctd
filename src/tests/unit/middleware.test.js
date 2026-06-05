const roleMiddleware = require('../../middleware/role.middleware');
const validateRequest = require('../../middleware/validateRequest.middleware');
const errorHandler = require('../../middleware/errorHandler.middleware');
const ApiError = require('../../utils/ApiError');

describe('Middleware', () => {
  it('roleMiddleware allows matching role', (done) => {
    const mw = roleMiddleware('admin');
    const req = { user: { role: 'admin' } };
    mw(req, {}, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('roleMiddleware blocks wrong role', (done) => {
    const mw = roleMiddleware('admin');
    mw({ user: { role: 'customer' } }, {}, (err) => {
      expect(err.statusCode).toBe(403);
      done();
    });
  });

  it('validateRequest fails on missing field', (done) => {
    const mw = validateRequest({ email: { required: true, type: 'email' } });
    mw({ body: {} }, {}, (err) => {
      expect(err.statusCode).toBe(400);
      done();
    });
  });

  it('errorHandler formats ApiError', () => {
    const err = new ApiError(404, 'Not found');
    const json = jest.fn();
    errorHandler(err, {}, { status: (c) => ({ json }) });
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Not found' }));
  });
});
