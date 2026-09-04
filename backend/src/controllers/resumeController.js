const ResumeProfile = require('../models/ResumeProfile');
const ResumeVersion = require('../models/ResumeVersion');
const User = require('../models/User');
const { extractResumeData, computeSkillGrowth } = require('../services/resumeService');

/**
 * @desc    Upload & parse resume PDF
 * @route   POST /api/resume/upload
 * @access  Private
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid PDF resume file.' });
    }

    const userId = req.user.id;
    const file = req.file;

    const user = await User.findById(userId);
    const userInfo = {
      name: user?.name || req.user?.name || '',
      email: user?.email || req.user?.email || '',
      targetRole: user?.targetRole || 'Full Stack Developer'
    };

    console.log(`[ResumeController] Processing resume upload for user: ${userId} (${file.originalname})`);

    // 1. Extract structured profile data using real resume content
    const extractedData = await extractResumeData(file.buffer, file.originalname, file.mimetype, userInfo);

    // 2. Check for existing profile
    const existingProfile = await ResumeProfile.findOne({ userId });
    let newVersionNumber = 1;
    let addedSkills = [];

    if (existingProfile) {
      newVersionNumber = (existingProfile.currentVersion || 1) + 1;
      // Compute skill growth between versions
      addedSkills = computeSkillGrowth(extractedData.skills, existingProfile.skills);

      // Archive previous version snapshot into ResumeVersion collection
      await ResumeVersion.create({
        userId,
        versionNumber: existingProfile.currentVersion || 1,
        resumeFileName: existingProfile.resumeFileName || 'Resume-v1.pdf',
        targetRole: existingProfile.targetRole,
        skills: [
          ...(existingProfile.skills?.technical || []),
          ...(existingProfile.skills?.frameworks || []),
          ...(existingProfile.skills?.databases || [])
        ],
        skillsAddedSinceLastVersion: [],
        projectsCount: existingProfile.projects?.length || 0,
        experienceCount: existingProfile.experience?.length || 0,
        snapshot: existingProfile.toObject()
      });
    }

    // 3. Save or update active ResumeProfile
    const profileData = {
      userId,
      resumeFileName: file.originalname,
      resumeFileUrl: '',
      parsedAt: new Date(),
      basicDetails: extractedData.basicDetails,
      targetRole: extractedData.targetRole || 'Full Stack Developer',
      summary: extractedData.summary,
      skills: extractedData.skills,
      experience: extractedData.experience,
      projects: extractedData.projects,
      education: extractedData.education,
      certifications: extractedData.certifications,
      currentVersion: newVersionNumber
    };

    const savedProfile = await ResumeProfile.findOneAndUpdate(
      { userId },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );

    // 4. Archive current newly uploaded version as well
    await ResumeVersion.create({
      userId,
      versionNumber: newVersionNumber,
      resumeFileName: file.originalname,
      targetRole: savedProfile.targetRole,
      skills: [
        ...(savedProfile.skills?.technical || []),
        ...(savedProfile.skills?.frameworks || []),
        ...(savedProfile.skills?.databases || [])
      ],
      skillsAddedSinceLastVersion: addedSkills,
      projectsCount: savedProfile.projects?.length || 0,
      experienceCount: savedProfile.experience?.length || 0,
      snapshot: savedProfile.toObject()
    });

    // 5. Update User flags & target role
    await User.findByIdAndUpdate(userId, {
      hasUploadedResume: true,
      targetRole: savedProfile.targetRole
    });

    return res.status(200).json({
      success: true,
      message: 'Resume parsed and profile updated successfully!',
      data: {
        profile: savedProfile,
        version: newVersionNumber,
        newSkillsAdded: addedSkills
      }
    });
  } catch (error) {
    console.error('Error in uploadResume:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to parse resume.' });
  }
};

/**
 * @desc    Upload user profile photo (avatar)
 * @route   POST /api/resume/photo
 * @access  Private
 */
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file && !req.body.avatarBase64) {
      return res.status(400).json({ success: false, message: 'Please provide an image file or base64 data.' });
    }

    const userId = req.user.id;
    let avatarUrl = '';

    if (req.file) {
      avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else {
      avatarUrl = req.body.avatarBase64;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully!',
      data: {
        avatarUrl: updatedUser.avatarUrl
      }
    });
  } catch (error) {
    console.error('Error in uploadPhoto:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload photo.' });
  }
};

/**
 * @desc    Get structured resume profile
 * @route   GET /api/resume/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ResumeProfile.findOne({ userId });

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No resume profile found. Please upload your resume.'
      });
    }

    const user = await User.findById(userId);
    const profileObj = profile.toObject();

    // Ensure real user name is used if profile has placeholder
    if (!profileObj.basicDetails?.fullName || profileObj.basicDetails.fullName === 'Candidate Profile') {
      profileObj.basicDetails = {
        ...(profileObj.basicDetails || {}),
        fullName: user?.name || 'Candidate'
      };
    }
    if (!profileObj.basicDetails?.email || profileObj.basicDetails.email === 'candidate@mockwithsiva.com') {
      profileObj.basicDetails = {
        ...(profileObj.basicDetails || {}),
        email: user?.email || ''
      };
    }

    const versionsCount = await ResumeVersion.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: {
        ...profileObj,
        totalVersions: versionsCount
      }
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch resume profile.' });
  }
};

/**
 * @desc    Update structured resume profile details
 * @route   PUT /api/resume/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { basicDetails, targetRole, summary, skills, experience, projects, education, certifications } = req.body;

    const profile = await ResumeProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Resume profile not found. Please upload your resume first.' });
    }

    if (basicDetails) profile.basicDetails = { ...profile.basicDetails, ...basicDetails };
    if (targetRole) {
      profile.targetRole = targetRole;
      await User.findByIdAndUpdate(userId, { targetRole });
    }
    if (summary !== undefined) profile.summary = summary;
    if (skills) profile.skills = skills;
    if (experience) profile.experience = experience;
    if (projects) profile.projects = projects;
    if (education) profile.education = education;
    if (certifications) profile.certifications = certifications;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: profile
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/**
 * @desc    Delete structured resume profile
 * @route   DELETE /api/resume/profile
 * @access  Private
 */
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    await ResumeProfile.findOneAndDelete({ userId });
    await ResumeVersion.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, { hasUploadedResume: false });

    return res.status(200).json({
      success: true,
      message: 'Resume profile deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resume profile.' });
  }
};

module.exports = {
  uploadResume,
  uploadPhoto,
  getProfile,
  updateProfile,
  deleteProfile
};
