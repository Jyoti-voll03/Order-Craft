const { seedDatabase } = require('../seed/seedData');

// POST /api/demo/reset
async function resetDemoDatabase(_req, res, next) {
  try {
    const stats = await seedDatabase(false);
    return res.json({
      success: true,
      message: 'Demo database reset to fresh factory records successfully',
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { resetDemoDatabase };
