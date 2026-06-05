const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

exports.admin = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboard();
  res.json({ success: true, data });
});
