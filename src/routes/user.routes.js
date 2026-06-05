const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

router.get('/', roleMiddleware('admin'), userController.listUsers);
router.patch('/:id/lock', roleMiddleware('admin'), userController.lockUser);
router.patch('/:id/unlock', roleMiddleware('admin'), userController.unlockUser);

module.exports = router;
