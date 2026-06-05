const ApiError = require('../../utils/ApiError');

describe('ApiError', () => {
  it('creates operational error', () => {
    const err = new ApiError(400, 'Bad request', ['field']);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.errors).toEqual(['field']);
    expect(err.isOperational).toBe(true);
  });
});
