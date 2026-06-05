const BaseRepository = require('../../repositories/base.repository');
const User = require('../../models/User.model');

describe('BaseRepository', () => {
  const repo = new BaseRepository(User);

  it('CRUD operations', async () => {
    const created = await repo.create({
      fullName: 'Base',
      email: 'base@test.com',
      password: 'password123',
    });
    const found = await repo.findById(created._id);
    expect(found.email).toBe('base@test.com');
    const count = await repo.count({ email: 'base@test.com' });
    expect(count).toBe(1);
    await repo.updateById(created._id, { fullName: 'Updated Base' });
    await repo.deleteById(created._id);
    const gone = await repo.findById(created._id);
    expect(gone).toBeNull();
  });
});
