const BioProfile = require('../models/BioProfile');
const {
  validateUsername,
  validateAvatarUrl,
  validateSocialLinks,
  validateTheme,
} = require('../utils/bioValidator');

/**
 * GET /api/bio/me
 * Authenticated endpoint to retrieve the current user's BioProfile.
 */
const getMyBio = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await BioProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(200).json({
        success: true,
        exists: false,
        profile: null,
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bio/me
 * Authenticated endpoint to create or update the current user's BioProfile.
 */
const updateMyBio = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { username, displayName, bio, avatarUrl, socialLinks, theme } = req.body;

    // Validate Username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: usernameValidation.error,
      });
    }
    const normalizedUsername = usernameValidation.normalized;

    // Validate Display Name
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Display name is required.',
      });
    }
    if (displayName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Display name cannot exceed 50 characters.',
      });
    }

    // Validate Bio length
    const bioText = (bio || '').trim();
    if (bioText.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 300 characters.',
      });
    }

    // Validate Avatar URL
    const avatarValidation = validateAvatarUrl(avatarUrl);
    if (!avatarValidation.valid) {
      return res.status(400).json({
        success: false,
        message: avatarValidation.error,
      });
    }

    // Validate Social Links
    const socialValidation = validateSocialLinks(socialLinks);
    if (!socialValidation.valid) {
      return res.status(400).json({
        success: false,
        message: socialValidation.error,
      });
    }

    // Validate Theme
    const themeValidation = validateTheme(theme);
    if (!themeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: themeValidation.error,
      });
    }

    // Check Username Collision with other users
    const existingUserWithUsername = await BioProfile.findOne({
      username: normalizedUsername,
      user: { $ne: userId },
    });

    if (existingUserWithUsername) {
      return res.status(409).json({
        success: false,
        message: `The username '${normalizedUsername}' is already taken by another user.`,
      });
    }

    // Save or update profile (upsert)
    const updatedProfile = await BioProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        username: normalizedUsername,
        displayName: displayName.trim(),
        bio: bioText,
        avatarUrl: avatarValidation.url,
        socialLinks: socialValidation.normalized,
        theme: themeValidation.theme,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Bio profile saved successfully.',
      profile: updatedProfile,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'The username is already taken by another user.',
      });
    }
    next(error);
  }
};

/**
 * GET /api/bio/:username
 * Public, unauthenticated endpoint returning non-sensitive profile info for /bio/:username.
 */
const getPublicBio = async (req, res, next) => {
  try {
    const rawUsername = req.params.username;

    if (!rawUsername || typeof rawUsername !== 'string') {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    const normalizedUsername = rawUsername.trim().toLowerCase();
    const profile = await BioProfile.findOne({ username: normalizedUsername });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Bio profile not found.',
      });
    }

    // Return ONLY public profile payload (No private email, password, or tokens)
    return res.status(200).json({
      success: true,
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        socialLinks: profile.socialLinks,
        theme: profile.theme,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBio,
  updateMyBio,
  getPublicBio,
};
