const Link = require('../models/Link');
const ClickEvent = require('../models/ClickEvent');

/**
 * GET /api/analytics
 * Authenticated endpoint returning user-isolated click analytics metrics:
 * - Total clicks
 * - Clicks over time (date aggregated)
 * - Top referrers (domain aggregated, top 10)
 * - Device distribution (Mobile, Desktop, Tablet aggregated)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    // Resolve all link IDs owned by authenticated user
    const userLinks = await Link.find({ owner: ownerId }).select('_id');
    const linkIds = userLinks.map((l) => l._id);

    if (linkIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalClicks: 0,
          clicksOverTime: [],
          topReferrers: [],
          deviceDistribution: [],
        },
      });
    }

    // 1. Total click count
    const totalClicks = await ClickEvent.countDocuments({
      link: { $in: linkIds },
    });

    // 2. Clicks over time (grouped by YYYY-MM-DD date string)
    const clicksOverTime = await ClickEvent.aggregate([
      { $match: { link: { $in: linkIds } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', clicks: 1, _id: 0 } },
    ]);

    // 3. Top referrers (grouped by referrer domain, top 10)
    const topReferrers = await ClickEvent.aggregate([
      { $match: { link: { $in: linkIds } } },
      {
        $group: {
          _id: '$referrer',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
      { $project: { referrer: '$_id', clicks: 1, _id: 0 } },
    ]);

    // 4. Device distribution (grouped by deviceType)
    const deviceDistribution = await ClickEvent.aggregate([
      { $match: { link: { $in: linkIds } } },
      {
        $group: {
          _id: '$deviceType',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $project: { deviceType: '$_id', clicks: 1, _id: 0 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalClicks,
        clicksOverTime,
        topReferrers,
        deviceDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
