const mongoose = require('mongoose');
const Link = require('../models/Link');
const ClickEvent = require('../models/ClickEvent');
const { isValidUrl } = require('../utils/urlValidator');
const { validateCustomSlug } = require('../utils/slugValidator');
const { generateShortCode } = require('../utils/codeGenerator');
const {
  hashIp,
  detectDeviceType,
  extractReferrer,
  getClientIp,
} = require('../utils/telemetryUtils');

/**
 * Asynchronous non-blocking click telemetry logger.
 * Does not block the 302 Found redirect response.
 */
const logClickAsync = (req, linkId) => {
  setImmediate(async () => {
    try {
      const rawIp = getClientIp(req);
      const ipHashed = hashIp(rawIp);
      const referrer = extractReferrer(req);
      const deviceType = detectDeviceType(req.get('user-agent'));

      const click = new ClickEvent({
        link: linkId,
        timestamp: new Date(),
        referrer,
        deviceType,
        ipHash: ipHashed,
      });

      await click.save();
    } catch (err) {
      console.error('[Telemetry Error] Failed to log click event:', err.message);
    }
  });
};

/**
 * POST /api/links
 * Authenticated endpoint to create a shortened link with optional custom vanity slug.
 */
const createLink = async (req, res, next) => {
  try {
    const { destinationUrl, customSlug } = req.body;
    const ownerId = req.user._id;

    if (!destinationUrl) {
      return res.status(400).json({
        success: false,
        message: 'Destination URL is required.',
      });
    }

    if (!isValidUrl(destinationUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid HTTP or HTTPS destination URL.',
      });
    }

    let finalShortCode = '';
    let isCustomSlug = false;

    if (customSlug && typeof customSlug === 'string' && customSlug.trim() !== '') {
      const trimmedSlug = customSlug.trim();
      const slugValidation = validateCustomSlug(trimmedSlug);

      if (!slugValidation.valid) {
        return res.status(400).json({
          success: false,
          message: slugValidation.error,
        });
      }

      const existingLink = await Link.findOne({ shortCode: trimmedSlug });
      if (existingLink) {
        return res.status(409).json({
          success: false,
          message: 'The custom vanity slug is already in use. Please choose another.',
        });
      }

      finalShortCode = trimmedSlug;
      isCustomSlug = true;
    }

    // Save link with collision retry logic for generated 6-char codes
    let linkCreated = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !linkCreated) {
      attempts++;
      if (!isCustomSlug) {
        finalShortCode = generateShortCode(6); // EXACTLY 6 characters
      }

      try {
        const link = new Link({
          owner: ownerId,
          destinationUrl: destinationUrl.trim(),
          shortCode: finalShortCode,
          isCustomSlug,
        });

        linkCreated = await link.save();
      } catch (err) {
        // If Mongo unique constraint collision on shortCode, retry if auto-generated
        if (err.code === 11000 && !isCustomSlug && attempts < maxAttempts) {
          continue;
        } else if (err.code === 11000 && isCustomSlug) {
          return res.status(409).json({
            success: false,
            message: 'The custom vanity slug is already in use.',
          });
        } else {
          throw err;
        }
      }
    }

    if (!linkCreated) {
      return res.status(500).json({
        success: false,
        message: 'Unable to generate a unique short code. Please try again.',
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shortUrl = `${baseUrl}/r/${linkCreated.shortCode}`;

    return res.status(201).json({
      success: true,
      message: 'Short link created successfully.',
      data: {
        id: linkCreated._id,
        destinationUrl: linkCreated.destinationUrl,
        shortCode: linkCreated.shortCode,
        shortUrl,
        isCustomSlug: linkCreated.isCustomSlug,
        createdAt: linkCreated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /r/:shortCode
 * High-speed URL Redirection Endpoint (Returns HTTP 302 Found & logs telemetry asynchronously).
 */
const redirectLink = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    if (!shortCode) {
      return res.status(404).json({
        success: false,
        message: 'Short code missing.',
      });
    }

    // Fast indexed DB lookup
    const link = await Link.findOne({ shortCode: shortCode.trim() });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Short link not found.',
      });
    }

    // Asynchronous click logging (non-blocking)
    logClickAsync(req, link._id);

    // Return HTTP 302 Found immediately
    return res.redirect(302, link.destinationUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/links
 * Authenticated endpoint to list user links with search and pagination support.
 */
const getUserLinks = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search ? req.query.search.trim() : '';

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const filter = { owner: ownerId };

    if (search) {
      filter.$or = [
        { destinationUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Link.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const links = await Link.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const formattedLinks = links.map((link) => ({
      id: link._id,
      destinationUrl: link.destinationUrl,
      shortCode: link.shortCode,
      shortUrl: `${baseUrl}/r/${link.shortCode}`,
      isCustomSlug: link.isCustomSlug,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        links: formattedLinks,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/links/:id
 * Authenticated endpoint to delete a link owned by the user.
 */
const deleteLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid link ID format.',
      });
    }

    const link = await Link.findById(id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found.',
      });
    }

    // Ownership check
    if (link.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this link.',
      });
    }

    await Link.findByIdAndDelete(id);
    await ClickEvent.deleteMany({ link: id });

    return res.status(200).json({
      success: true,
      message: 'Link deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLink,
  redirectLink,
  getUserLinks,
  deleteLink,
};
