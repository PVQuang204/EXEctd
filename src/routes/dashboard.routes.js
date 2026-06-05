const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('admin'));
router.get('/admin', dashboardController.admin);

module.exports = router;
