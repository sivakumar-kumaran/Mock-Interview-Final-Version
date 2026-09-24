const ResumeProfile = require('../models/ResumeProfile');
const ResumeVersion = require('../models/ResumeVersion');
const User = require('../models/User');
const { extractResumeData, extractResumeFromText, generateResumeSummaryAndReport, computeSkillGrowth } = require('../services/resumeService');

/**
 * @desc    Upload & parse resume PDF or pasted text
 * @route   POST /api/resume/upload
 * @access  Private
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file && (req.body?.resumeText || req.body?.text)) {
      return pasteResumeText(req, res);
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid PDF resume file or paste your resume text.' });
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

    // 1. Extract structured profile data and generate rich AI summary report
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
      rawText: extractedData.rawText || '',
      basicDetails: extractedData.basicDetails,
      targetRole: extractedData.targetRole || 'Full Stack Developer',
      summary: extractedData.summary,
      skills: extractedData.skills,
      experience: extractedData.experience,
      projects: extractedData.projects,
      education: extractedData.education,
      certifications: extractedData.certifications,
      achievements: extractedData.achievements || [],
      areasOfInterest: extractedData.areasOfInterest || [],
      likelyInterviewQuestions: extractedData.likelyInterviewQuestions || [],
      summaryReport: extractedData.summaryReport || null,
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

    // 5. Update User flags, target role & candidate name
    const userUpdateFields = {
      hasUploadedResume: true,
      targetRole: savedProfile.targetRole
    };
    if (savedProfile.basicDetails?.fullName && savedProfile.basicDetails.fullName !== 'Candidate' && savedProfile.basicDetails.fullName !== 'Candidate Profile') {
      userUpdateFields.name = savedProfile.basicDetails.fullName;
    }
    await User.findByIdAndUpdate(userId, userUpdateFields);

    return res.status(200).json({
      success: true,
      message: 'Resume parsed, summarized, and profile updated successfully!',
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
    let profile = await ResumeProfile.findOne({ userId });

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No resume profile found. Please upload your resume.'
      });
    }

    const user = await User.findById(userId);
    let profileObj = profile.toObject();

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

    // Auto-generate summary report only if missing professionalSummary and report
    if (!profileObj.summaryReport || !profileObj.summaryReport.professionalSummary) {
      try {
        const textToUse = profile.rawText || '';
        const generatedReport = await generateResumeSummaryAndReport(textToUse, profileObj, {
          name: profileObj.basicDetails?.fullName || user?.name || '',
          email: profileObj.basicDetails?.email || user?.email || '',
          targetRole: profileObj.targetRole
        });

        profile.summaryReport = generatedReport;
        profile.summary = generatedReport.professionalSummary || profile.summary;
        profile.achievements = generatedReport.achievements || profile.achievements || [];
        profile.areasOfInterest = generatedReport.areasOfInterest || profile.areasOfInterest || [];
        profile.likelyInterviewQuestions = generatedReport.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];
        await profile.save();

        profileObj = profile.toObject();
      } catch (err) {
        console.warn('[ResumeController] Auto summary generation exception:', err.message);
      }
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
 * @desc    Re-analyze resume and regenerate AI summary report
 * @route   POST /api/resume/re-analyze
 * @access  Private
 */
const reanalyzeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ResumeProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'No resume profile found to re-analyze.' });
    }

    const user = await User.findById(userId);
    const userInfo = {
      name: profile.basicDetails?.fullName || user?.name || 'Candidate',
      email: profile.basicDetails?.email || user?.email || '',
      targetRole: profile.targetRole || 'Full Stack Developer'
    };

    console.log(`[ResumeController] Re-analyzing profile for user ${userId}`);

    // Use stored raw resume text for accurate re-analysis
    const storedRawText = profile.rawText || '';
    const summaryReport = await generateResumeSummaryAndReport(storedRawText, profile.toObject(), userInfo);

    profile.summaryReport = summaryReport;
    profile.summary = summaryReport.professionalSummary || profile.summary;
    profile.achievements = summaryReport.achievements || profile.achievements || [];
    profile.areasOfInterest = summaryReport.areasOfInterest || profile.areasOfInterest || [];
    profile.likelyInterviewQuestions = summaryReport.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Resume re-analyzed and AI report generated successfully!',
      data: profile
    });
  } catch (error) {
    console.error('Error in reanalyzeProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to re-analyze resume profile.' });
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
    const { basicDetails, targetRole, summary, skills, experience, projects, education, certifications, achievements, areasOfInterest, likelyInterviewQuestions, summaryReport } = req.body;

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
    if (achievements) profile.achievements = achievements;
    if (areasOfInterest) profile.areasOfInterest = areasOfInterest;
    if (likelyInterviewQuestions) profile.likelyInterviewQuestions = likelyInterviewQuestions;
    if (summaryReport) profile.summaryReport = summaryReport;

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

/**
 * @desc    Parse resume directly from pasted text
 * @route   POST /api/resume/paste-text
 * @access  Private
 */
const pasteResumeText = async (req, res) => {
  try {
    const rawText = req.body.resumeText || req.body.text || req.body.resume;
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please paste your resume text (at least 20 characters).'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    const userInfo = {
      name: user?.name || req.user?.name || '',
      email: user?.email || req.user?.email || '',
      targetRole: req.body.targetRole || user?.targetRole || 'Full Stack Developer'
    };

    console.log(`[ResumeController] Processing pasted resume text for user: ${userId}`);

    // 1. Extract structured profile data and rich AI summary report
    const extractedData = await extractResumeFromText(rawText.trim(), userInfo);

    // 2. Check for existing profile
    const existingProfile = await ResumeProfile.findOne({ userId });
    let newVersionNumber = 1;
    let addedSkills = [];

    if (existingProfile) {
      newVersionNumber = (existingProfile.currentVersion || 1) + 1;
      addedSkills = computeSkillGrowth(extractedData.skills, existingProfile.skills);

      await ResumeVersion.create({
        userId,
        versionNumber: existingProfile.currentVersion || 1,
        resumeFileName: existingProfile.resumeFileName || 'Pasted-Resume-v1.txt',
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
      resumeFileName: 'Pasted Resume Text',
      resumeFileUrl: '',
      parsedAt: new Date(),
      rawText: rawText.trim(),
      basicDetails: extractedData.basicDetails,
      targetRole: extractedData.targetRole || userInfo.targetRole,
      summary: extractedData.summary,
      skills: extractedData.skills,
      experience: extractedData.experience,
      projects: extractedData.projects,
      education: extractedData.education,
      certifications: extractedData.certifications,
      achievements: extractedData.achievements || [],
      areasOfInterest: extractedData.areasOfInterest || [],
      likelyInterviewQuestions: extractedData.likelyInterviewQuestions || [],
      summaryReport: extractedData.summaryReport || null,
      currentVersion: newVersionNumber
    };

    const savedProfile = await ResumeProfile.findOneAndUpdate(
      { userId },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );

    // 4. Archive version
    await ResumeVersion.create({
      userId,
      versionNumber: newVersionNumber,
      resumeFileName: 'Pasted Resume Text',
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

    // 5. Update User flags, target role & candidate name
    const userUpdateFields = {
      hasUploadedResume: true,
      targetRole: savedProfile.targetRole
    };
    if (savedProfile.basicDetails?.fullName && savedProfile.basicDetails.fullName !== 'Candidate' && savedProfile.basicDetails.fullName !== 'Candidate Profile') {
      userUpdateFields.name = savedProfile.basicDetails.fullName;
    }
    await User.findByIdAndUpdate(userId, userUpdateFields);

    return res.status(200).json({
      success: true,
      message: 'Resume text analyzed, section-wise summary generated, and profile updated successfully!',
      data: {
        profile: savedProfile,
        version: newVersionNumber,
        newSkillsAdded: addedSkills
      }
    });
  } catch (error) {
    console.error('Error in pasteResumeText:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to parse resume text.' });
  }
};

module.exports = {
  uploadResume,
  pasteResumeText,
  uploadPhoto,
  getProfile,
  reanalyzeProfile,
  updateProfile,
  deleteProfile
};


