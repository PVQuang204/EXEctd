const request = require('supertest');
const app = require('../../app');
const { uploadFromBuffer } = require('../../services/upload.service');

describe('Upload (local fallback)', () => {
  it('uploads avatar via API without Cloudinary', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      fullName: 'Upload User',
      email: `upload_${Date.now()}@test.com`,
      password: 'password123',
    });
    const token = reg.body.data.accessToken;

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', pngBuffer, 'avatar.png');

    expect(res.status).toBe(200);
    expect(res.body.data.avatar).toMatch(/\/uploads\/avatars\//);
  });

  it('uploadFromBuffer returns local URL in dev', async () => {
    const url = await uploadFromBuffer(Buffer.from('fake-image'), 'test-folder');
    expect(url).toContain('/uploads/test-folder/');
  });
});
