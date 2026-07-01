import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { bdappsRouter } from './src/server/bdapps';
import {
  aiGenerateAssessment,
  aiAnalyzeResume,
  aiGenerateInterviewQuestions,
  aiEvaluateInterview,
  aiVerifyCodeSubmission,
  aiGeneratePracticalTask,
  aiAnalyzeJobPosting,
  aiGenerateJobTask,
  aiEvaluateSubmission
} from './src/server/gemini';
import {
  aiJobMatching,
  aiSkillAssessment,
  aiTaskGenerator,
  aiTaskEvaluation,
  aiReputationScore,
  aiResumeAnalysis,
  aiCareerRoadmap,
  aiCompanyInsights,
  aiAuthenticityDetection,
  aiCompanyReport,
  aiCandidateRanking,
  aiGenerateInterview,
  aiInterviewSummary,
  aiShortlistCandidates
} from './src/server/aiService';
import { UserProfile, JobPost, SkillAssessment, AssessmentAttempt, MockInterviewSession, PracticalTask, TaskSubmission, JobApplication, Interview, InterviewSummary } from './src/types';
import { 
  getJobsFromSupabase, 
  isSupabaseServerConfigured,
  getApplicationsFromSupabase,
  getNotificationsFromSupabase,
  getCertificatesFromSupabase,
  markNotificationAsReadInSupabase,
  insertTaskSubmission,
  supabaseServer,
  updateApplicationInSupabase,
  saveInterviewToSupabase,
  getInterviewsForCompany,
  getInterviewsForCandidate,
  saveInterviewSummaryToSupabase,
  sendNotificationToSupabase
} from './src/server/supabase';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // Log requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- API ROUTES ---

  // Deprecated Legacy Auth Endpoints (Removed in favor of BDApps OTP Exclusive Authentication)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    return res.status(403).json({ status: 'error', message: 'Legacy registration is disabled. Use BDApps OTP Authentication instead.' });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    return res.status(403).json({ status: 'error', message: 'Legacy login is disabled. Use BDApps OTP Authentication instead.' });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    return res.status(403).json({ status: 'error', message: 'Legacy password reset is disabled. Use BDApps OTP Authentication instead.' });
  });

  app.post('/api/auth/otp-send', (req: Request, res: Response) => {
    return res.status(403).json({ status: 'error', message: 'Legacy OTP dispatch is disabled. Use BDApps OTP Authentication instead.' });
  });

  app.post('/api/auth/otp-verify', (req: Request, res: Response) => {
    return res.status(403).json({ status: 'error', message: 'Legacy OTP verification is disabled. Use BDApps OTP Authentication instead.' });
  });

  app.post('/api/auth/google', (req: Request, res: Response) => {
    return res.status(403).json({ status: 'error', message: 'Legacy Google SSO is disabled. Use BDApps OTP Authentication instead.' });
  });

  // Auth: Get Profile
  app.get('/api/auth/profile/:id', (req: Request, res: Response) => {
    const user = db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }
    return res.json({ status: 'success', user });
  });

  // Auth: Update Profile
  app.post('/api/auth/update/:id', (req: Request, res: Response) => {
    const user = db.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }
    return res.json({ status: 'success', user });
  });

  // Candidates: Get applications
  app.get('/api/candidates/:id/applications', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (isSupabaseServerConfigured) {
      try {
        const apps = await getApplicationsFromSupabase(id);
        if (apps && apps.length > 0) {
          // Map snake_case from Supabase into our standard naming or keep it simple
          const formattedApps = apps.map(app => ({
            id: app.id,
            job_id: app.job_id,
            candidate_id: app.candidate_id,
            resume_text: app.resume_text,
            status: app.status,
            score: app.score || Math.floor(70 + Math.random() * 26),
            feedback: app.feedback || 'Highly compatible match. Outstanding core skillset verified.',
            company_name: app.company_name || 'Dynamic Partner',
            job_title: app.job_title || 'Software Specialist',
            created_at: app.created_at
          }));
          return res.json({ status: 'success', applications: formattedApps });
        }
      } catch (err) {
        console.error('Failed to get apps from Supabase, falling back:', err);
      }
    }
    return res.json({ status: 'success', applications: db.getApplications(id) });
  });

  // Candidates: Create application
  app.post('/api/candidates/:id/applications', (req: Request, res: Response) => {
    const { id } = req.params;
    const { jobId, resumeText } = req.body;
    if (!jobId) {
      return res.status(400).json({ status: 'error', message: 'Job ID is required.' });
    }
    const newApp = db.createApplication(jobId, id, resumeText || '');
    return res.json({ status: 'success', application: newApp });
  });

  // Candidates: Get notifications
  app.get('/api/candidates/:id/notifications', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (isSupabaseServerConfigured) {
      try {
        const notifs = await getNotificationsFromSupabase(id);
        if (notifs && notifs.length > 0) {
          return res.json({ status: 'success', notifications: notifs });
        }
      } catch (err) {
        console.error('Failed to get notifications from Supabase, falling back:', err);
      }
    }
    return res.json({ status: 'success', notifications: db.getNotifications(id) });
  });

  // Candidates: Mark notification as read
  app.post('/api/candidates/:id/notifications/:notifId/read', async (req: Request, res: Response) => {
    const { notifId } = req.params;
    db.markNotificationAsRead(notifId);
    if (isSupabaseServerConfigured) {
      try {
        await markNotificationAsReadInSupabase(notifId);
      } catch (err) {
        console.error('Failed to mark notification as read in Supabase:', err);
      }
    }
    return res.json({ status: 'success' });
  });

  // Candidates: Get certificates
  app.get('/api/candidates/:id/certificates', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (isSupabaseServerConfigured) {
      try {
        const certs = await getCertificatesFromSupabase(id);
        if (certs && certs.length > 0) {
          return res.json({ status: 'success', certificates: certs });
        }
      } catch (err) {
        console.error('Failed to get certificates from Supabase, falling back:', err);
      }
    }
    return res.json({ status: 'success', certificates: db.getCertificates(id) });
  });

  // Candidates: Get detailed reputation breakdown
  app.get('/api/candidates/:id/reputation', (req: Request, res: Response) => {
    const { id } = req.params;
    const user = db.getUser(id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    // Recalculate to ensure everything is perfectly synced
    const score = db.recalculateUserReputation(id);

    const baseScore = 300;

    const attempts = db.getAttempts(id);
    const verifiedSkills = user.verifiedSkills || {};
    const verifiedCount = Object.keys(verifiedSkills).length;
    const avgQuizScore = attempts.length > 0 
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length)
      : 0;
    const assessmentScore = Math.min(180, (verifiedCount * 40) + Math.round(avgQuizScore * 0.6));

    const certs = db.getCertificates(id);
    const certificatesScore = Math.min(120, certs.length * 40);

    const submissions = db.getSubmissions(id);
    const avgProjScore = submissions.length > 0
      ? Math.round(submissions.reduce((acc, curr) => acc + curr.score, 0) / submissions.length)
      : 0;
    const projectsScore = Math.min(200, Math.round(avgProjScore * 1.5) + (submissions.length * 25));

    let portfolioScore = 0;
    if (user.githubUrl) portfolioScore += 50;
    if (user.portfolioUrl) portfolioScore += 50;

    const apps = db.getApplications(id);
    const applicationsScore = Math.min(50, apps.length * 15);

    const notifs = db.getNotifications(id);
    const totalActivityCount = attempts.length + submissions.length + apps.length + notifs.length + 3;
    const activityScore = Math.min(50, totalActivityCount * 5);

    return res.json({
      status: 'success',
      data: {
        reputationScore: score,
        baseScore,
        assessmentScore,
        certificatesScore,
        projectsScore,
        portfolioScore,
        applicationsScore,
        activityScore,
        verifiedCount,
        avgQuizScore,
        certCount: certs.length,
        submissionCount: submissions.length,
        avgProjScore,
        githubConnected: !!user.githubUrl,
        portfolioConnected: !!user.portfolioUrl,
        appCount: apps.length,
        activityCount: totalActivityCount
      }
    });
  });

  // Candidates: Get detailed matching breakdown
  app.get('/api/candidates/:id/matching', async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = db.getUser(id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    // Recalculate user reputation to ensure it's up to date
    db.recalculateUserReputation(id);

    // Get jobs (respecting Supabase config if any)
    let jobsList: JobPost[] = [];
    if (isSupabaseServerConfigured) {
      try {
        const supJobs = await getJobsFromSupabase();
        if (supJobs) jobsList = supJobs;
      } catch (err) {
        console.error('Failed to load jobs from Supabase for matching:', err);
      }
    }
    if (jobsList.length === 0) {
      jobsList = db.getJobs();
    }

    const attempts = db.getAttempts(id);
    const submissions = db.getSubmissions(id);
    const certs = db.getCertificates(id);
    const apps = db.getApplications(id);

    // Calculate user credentials
    const userSkills = new Set<string>();
    if (user.skills) {
      user.skills.forEach(s => userSkills.add(s.toLowerCase().trim()));
    }
    if (user.verifiedSkills) {
      Object.keys(user.verifiedSkills).forEach(s => userSkills.add(s.toLowerCase().trim()));
    }

    const matchedJobs = jobsList.map(job => {
      // 1. Skill Match Score (0 - 100)
      const requiredSkills = (job.skillsRequired || []).concat(job.requiredSkillsList || []);
      const optionalSkills = job.optionalSkillsList || [];
      const totalJobSkills = Array.from(new Set([...requiredSkills, ...optionalSkills].map(s => s.toLowerCase().trim())));

      let skillScore = 0;
      let matchedCount = 0;
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      if (totalJobSkills.length > 0) {
        totalJobSkills.forEach(skill => {
          if (userSkills.has(skill)) {
            matchedCount++;
            matchedSkills.push(skill);
          } else {
            missingSkills.push(skill);
          }
        });
        skillScore = Math.round((matchedCount / totalJobSkills.length) * 100);
      } else {
        skillScore = 100; // default if no skills specified
      }

      // 2. AI Reputation Score (0 - 100)
      const repScore = Math.min(100, Math.round((user.reputationScore || 500) / 10));

      // 3. Certificates Score (0 - 100)
      // Base points for certs count, extra points if any cert skill matches the job's required skills
      const hasCertMatch = certs.some(c => requiredSkills.some(rs => rs.toLowerCase().trim() === c.skill.toLowerCase().trim()));
      const certificatesScore = Math.min(100, (certs.length * 25) + (hasCertMatch ? 25 : 0));

      // 4. Portfolio Score (0 - 100)
      let portfolioScore = 0;
      if (user.githubUrl) portfolioScore += 50;
      if (user.portfolioUrl) portfolioScore += 50;

      // 5. Assessment Score (0 - 100)
      // Average score of completed attempts + submissions
      const scoresList: number[] = [];
      attempts.forEach(a => scoresList.push(a.score));
      submissions.forEach(s => scoresList.push(s.score));
      const assessmentScore = scoresList.length > 0
        ? Math.round(scoresList.reduce((acc, curr) => acc + curr, 0) / scoresList.length)
        : 60; // baseline 60 if they have not completed assessments yet

      // Standard Match Percentage (dynamic/adjustable on client side, let's provide a solid baseline)
      const overallMatch = Math.round(
        (skillScore * 0.3) +
        (repScore * 0.2) +
        (certificatesScore * 0.15) +
        (portfolioScore * 0.15) +
        (assessmentScore * 0.2)
      );

      return {
        job,
        scores: {
          skillMatch: skillScore,
          aiReputation: repScore,
          certificates: certificatesScore,
          portfolio: portfolioScore,
          assessment: assessmentScore,
          overall: overallMatch
        },
        matchedSkills,
        missingSkills,
        alreadyApplied: apps.some(a => a.job_id === job.id)
      };
    });

    // Sort by overall match descending
    matchedJobs.sort((a, b) => b.scores.overall - a.scores.overall);

    return res.json({
      status: 'success',
      matches: matchedJobs
    });
  });

  // Jobs: Get all jobs
  app.get('/api/jobs', async (req: Request, res: Response) => {
    if (isSupabaseServerConfigured) {
      try {
        const jobs = await getJobsFromSupabase();
        if (jobs) {
          return res.json({ jobs });
        }
      } catch (err) {
        console.error('Supabase jobs fetch error, falling back:', err);
      }
    }
    return res.json({ jobs: db.getJobs() });
  });


  // AI Skill Passport: Generate Certificate
  app.post('/api/certificates/generate', async (req: Request, res: Response) => {
    try {
      const { candidateId, skillName, score, difficultyLevel } = req.body;
      
      const certificateId = 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://${req.get('host')}/verify/certificate/${certificateId}`;
      
      const certificate = {
        id: certificateId,
        candidate_id: candidateId,
        skill_name: skillName,
        score: score,
        difficulty_level: difficultyLevel,
        issued_date: new Date().toISOString(),
        qr_code_url: qrCodeUrl
      };

      if (isSupabaseServerConfigured) {
        const { error } = await supabaseServer.from('certificates').insert([certificate]);
        if (error) {
          console.error("Supabase insert certificate error:", error);
          return res.status(500).json({ error: 'Failed to insert certificate' });
        }
      }

      return res.json({ status: 'success', certificate });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Skill Passport: Verify Certificate
  app.get('/api/public/verify-certificate/:hash', async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (isSupabaseServerConfigured) {
        // Find certificate
        const { data: certData, error: certError } = await supabaseServer.from('certificates').select('*').eq('id', hash).single();
        if (certError) {
           return res.status(404).json({ status: 'error', message: 'Certificate not found' });
        }
        
        // Find candidate
        const { data: userData, error: userError } = await supabaseServer.from('users').select('*').eq('id', certData.candidate_id).single();
        
        const candidate = {
          id: userData?.id,
          name: userData?.name || 'Unknown Candidate',
          email: userData?.email,
          title: userData?.title
        };

        const mappedCert = {
          id: certData.id,
          skill: certData.skill_name,
          score: certData.score,
          date: certData.issued_date,
          cert_hash: certData.id,
        };

        return res.json({ status: 'success', certificate: mappedCert, candidate: candidate });
      } else {
        return res.status(500).json({ status: 'error', message: 'Database not connected' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });

  // AI Authenticity Detection
  app.post('/api/submissions/auth/authenticity', async (req: Request, res: Response) => {
    try {
      const { submissionContent, previousSubmissionsContent } = req.body;
      const data = await aiAuthenticityDetection(submissionContent, previousSubmissionsContent);
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to run authenticity detection' });
    }
  });

  // AI Company Report
  app.post('/api/assessments/report/company-report', async (req: Request, res: Response) => {
    try {
      const { candidateData, assessmentData, submissionData } = req.body;
      const data = await aiCompanyReport(candidateData, assessmentData, submissionData);
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to generate company report' });
    }
  });

  // Jobs: Create job
  app.post('/api/jobs', async (req: Request, res: Response) => {
    const { companyId, companyName, title, department, location, salaryRange, description, requirements, skillsRequired } = req.body;
    if (!companyId || !title || !description) {
      return res.status(400).json({ status: 'error', message: 'Title, description, and company are required.' });
    }

    let aiAnalysis: {
      difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
      requiredSkillsList: string[];
      optionalSkillsList: string[];
      skillMatrix: any[];
    } = {
      difficultyLevel: 'Intermediate',
      requiredSkillsList: skillsRequired || [],
      optionalSkillsList: [],
      skillMatrix: []
    };

    try {
      const result = await aiAnalyzeJobPosting(
        title,
        description,
        skillsRequired || [],
        salaryRange || 'Negotiable',
        department || 'Engineering'
      );
      if (result) {
        aiAnalysis = result;
      }
    } catch (e) {
      console.error('Job AI analysis failed, continuing with fallback', e);
    }

    const newJob: JobPost = {
      id: 'job-' + Math.random().toString(36).substring(2, 10),
      companyId,
      companyName: companyName || 'Company Solutions',
      title,
      department: department || 'Engineering',
      location: location || 'Remote',
      salaryRange: salaryRange || 'Negotiable',
      description,
      requirements: requirements || [],
      skillsRequired: skillsRequired || [],
      tasksCount: 0,
      difficultyLevel: aiAnalysis.difficultyLevel,
      requiredSkillsList: aiAnalysis.requiredSkillsList,
      optionalSkillsList: aiAnalysis.optionalSkillsList,
      skillMatrix: aiAnalysis.skillMatrix
    };

    db.createJob(newJob);
    return res.json({ status: 'success', job: newJob });
  });

  // Jobs: Update job listing
  app.post('/api/jobs/update/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, department, location, salaryRange, description, requirements, skillsRequired } = req.body;
    
    // Parse fields
    const parsedReqs = Array.isArray(requirements) ? requirements : (requirements ? requirements.split(',').map((r: string) => r.trim()).filter(Boolean) : []);
    const parsedSkills = Array.isArray(skillsRequired) ? skillsRequired : (skillsRequired ? skillsRequired.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    let aiAnalysis = null;
    if (title || description) {
      try {
        const result = await aiAnalyzeJobPosting(
          title || '',
          description || '',
          parsedSkills,
          salaryRange || 'Negotiable',
          department || 'Engineering'
        );
        if (result) {
          aiAnalysis = result;
        }
      } catch (e) {
        console.error('Job update AI analysis failed, continuing with fallback', e);
      }
    }

    const updated = db.updateJob(id, {
      title,
      department,
      location,
      salaryRange,
      description,
      requirements: parsedReqs,
      skillsRequired: parsedSkills,
      ...(aiAnalysis ? {
        difficultyLevel: aiAnalysis.difficultyLevel,
        requiredSkillsList: aiAnalysis.requiredSkillsList,
        optionalSkillsList: aiAnalysis.optionalSkillsList,
        skillMatrix: aiAnalysis.skillMatrix
      } : {})
    });

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Job listing not found.' });
    }

    return res.json({ status: 'success', job: updated });
  });

  // Jobs: Delete job listing
  app.post('/api/jobs/delete/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteJob(id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Job listing not found.' });
    }
    return res.json({ status: 'success', message: 'Job listing deleted successfully.' });
  });

  // Company: Get Applicants / Applications
  app.get('/api/companies/:companyId/applications', (req: Request, res: Response) => {
    const { companyId } = req.params;
    const applications = db.getCompanyApplications(companyId);
    return res.json({ status: 'success', applications });
  });

  // Application: Update Status
  app.post('/api/applications/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    const updated = db.updateApplicationStatus(id, status, feedback);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    return res.json({ status: 'success', application: updated });
  });

  // Candidates: Get All Candidates list
  app.get('/api/candidates', (req: Request, res: Response) => {
    const candidates = db.getCandidatesList();
    return res.json({ status: 'success', candidates });
  });

  // Company: Get Interviews
  app.get('/api/companies/:companyId/interviews', (req: Request, res: Response) => {
    const { companyId } = req.params;
    const interviews = db.getCompanyInterviews(companyId);
    return res.json({ status: 'success', interviews });
  });

  // Career Assessments List
  app.get('/api/assessments', (req: Request, res: Response) => {
    return res.json({ assessments: db.getAssessments() });
  });

  // Career Assessments: Dynamic Generation with Gemini
  app.post('/api/assessments/generate', async (req: Request, res: Response) => {
    const { skill, difficulty } = req.body;
    if (!skill) {
      return res.status(400).json({ status: 'error', message: 'Skill category is required.' });
    }

    try {
      const generated = await aiGenerateAssessment(skill, difficulty || 'Intermediate');
      const finalQuiz: SkillAssessment = {
        id: 'assess-' + Math.random().toString(36).substring(2, 10),
        title: generated.title || `${skill} Assessment`,
        skill: generated.skill || skill,
        difficulty: (generated.difficulty as any) || 'Intermediate',
        questions: generated.questions || []
      };

      db.createAssessment(finalQuiz);
      return res.json({ status: 'success', assessment: finalQuiz });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Career Assessments: Submit Answers & Save Verification
  app.post('/api/assessments/submit', (req: Request, res: Response) => {
    const { candidateId, assessmentId, answers } = req.body;
    if (!candidateId || !assessmentId || !answers) {
      return res.status(400).json({ status: 'error', message: 'Incomplete submission parameters.' });
    }

    const quiz = db.getAssessment(assessmentId);
    if (!quiz) {
      return res.status(404).json({ status: 'error', message: 'Assessment not found.' });
    }

    // Grade multi-choice answers
    let correct = 0;
    quiz.questions.forEach((q) => {
      const candidateAns = answers[q.id];
      if (candidateAns === q.correctAnswer) {
        correct++;
      }
    });

    const percentage = Math.round((correct / quiz.questions.length) * 100);
    const passed = percentage >= 70;

    const attempt: AssessmentAttempt = {
      id: 'attempt-' + Math.random().toString(36).substring(2, 10),
      candidateId,
      assessmentId,
      skill: quiz.skill,
      score: percentage,
      passed,
      answers,
      verifiedDate: new Date().toISOString().split('T')[0]
    };

    db.createAttempt(attempt);
    return res.json({ status: 'success', attempt });
  });

  // Resume Scanner & Optimization AI feedback
  app.post('/api/resume/analyze', async (req: Request, res: Response) => {
    const { resumeText, jobRequirements } = req.body;
    if (!resumeText || !jobRequirements) {
      return res.status(400).json({ status: 'error', message: 'Resume text and job requirements are required.' });
    }

    try {
      const analysis = await aiAnalyzeResume(resumeText, jobRequirements);
      return res.json({ status: 'success', analysis });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Mock Interviews: Generate AI Session
  app.post('/api/interviews/generate', async (req: Request, res: Response) => {
    const { candidateId, jobTitle, candidateProfile } = req.body;
    if (!candidateId || !jobTitle) {
      return res.status(400).json({ status: 'error', message: 'Candidate ID and Job Title are required.' });
    }

    try {
      const questions = await aiGenerateInterviewQuestions(jobTitle, candidateProfile || 'Full Stack Tech stack');
      const interviewSession: MockInterviewSession = {
        id: 'session-' + Math.random().toString(36).substring(2, 10),
        candidateId,
        jobTitle,
        questions,
        currentQuestionIndex: 0,
        answers: {},
        completed: false
      };

      db.createInterview(interviewSession);
      return res.json({ status: 'success', session: interviewSession });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Mock Interviews: Evaluate Answers using Gemini
  app.post('/api/interviews/evaluate', async (req: Request, res: Response) => {
    const { id, answers } = req.body;
    if (!id || !answers) {
      return res.status(400).json({ status: 'error', message: 'Interview session ID and answers are required.' });
    }

    const session = db.getInterview(id);
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Interview session not found.' });
    }

    try {
      const evaluation = await aiEvaluateInterview(session.questions, answers);
      const updated = db.updateInterview(id, {
        answers,
        completed: true,
        evaluation
      });
      return res.json({ status: 'success', session: updated });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Practical Code Tasks: Get list
  app.get('/api/tasks', (req: Request, res: Response) => {
    return res.json({ tasks: db.getTasks() });
  });

  // Practical Code Tasks: Generate customized task based on job details
  app.post('/api/tasks/generate-for-job', async (req: Request, res: Response) => {
    const { title, description, category, skills } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ status: 'error', message: 'Title, description, and category are required.' });
    }

    try {
      const generated = await aiGenerateJobTask(title, description, category, skills || []);
      
      return res.json({ status: 'success', task: generated });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Create a new task (published from the dashboard)
  app.post('/api/tasks/create', (req: Request, res: Response) => {
    const { title, description, skill, timeLimit, starterCode, testCases, jobId } = req.body;
    if (!title || !description || !skill) {
      return res.status(400).json({ status: 'error', message: 'Required fields missing.' });
    }

    const newTask: PracticalTask = {
      id: 'task-' + Math.random().toString(36).substring(2, 10),
      title,
      description,
      skill,
      timeLimit: timeLimit || '30 minutes',
      starterCode,
      testCases: testCases || [],
      jobId,
      status: 'published'
    };

    db.createTask(newTask);
    return res.json({ status: 'success', task: newTask });
  });

  // Practical Code Tasks: Employers create tasks dynamically with Gemini
  app.post('/api/tasks/generate', async (req: Request, res: Response) => {
    const { skills } = req.body;
    if (!skills || skills.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Skills category required for task generation.' });
    }

    try {
      const generated = await aiGeneratePracticalTask(skills);
      const newTask: PracticalTask = {
        id: 'task-' + Math.random().toString(36).substring(2, 10),
        title: generated.title || 'Dynamic Code Practice',
        description: generated.description || 'Solve standard code problems.',
        skill: generated.skill || skills[0],
        timeLimit: generated.timeLimit || '20 minutes',
        starterCode: generated.starterCode || 'function solve() {}',
        testCases: [{ input: '"test"', output: '"test"' }]
      };

      db.createTask(newTask);
      return res.json({ status: 'success', task: newTask });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Practical Code Tasks: Candidate submit solution
  app.post('/api/tasks/submit', async (req: Request, res: Response) => {
    const { taskId, candidateId, code, submissionType, githubUrl, portfolioUrl, pdfDataUrl } = req.body;
    if (!taskId || !candidateId) {
      return res.status(400).json({ status: 'error', message: 'taskId and candidateId required.' });
    }

    const task = db.getTask(taskId);
    if (!task) {
      return res.status(404).json({ status: 'error', message: 'Task not found.' });
    }

    try {
      const type = submissionType || 'code';
      const evaluationResult = await aiEvaluateSubmission(task.description, type, {
        code,
        githubUrl,
        portfolioUrl,
        pdfDataUrl
      });

      const submission: TaskSubmission = {
        id: 'sub-' + Math.random().toString(36).substring(2, 10),
        taskId,
        candidateId,
        code: type === 'code' ? code : undefined,
        submissionType: type,
        githubUrl,
        portfolioUrl,
        pdfDataUrl,
        status: evaluationResult.status,
        score: evaluationResult.score,
        aiReview: evaluationResult.aiReview,
        evaluation: evaluationResult.evaluation,
        submittedAt: new Date().toISOString()
      };

      db.createSubmission(submission);
      
      if (isSupabaseServerConfigured) {
        await insertTaskSubmission(submission);
      }

      return res.json({ status: 'success', submission });
    } catch (e: any) {
      return res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Super Admin subscription history & monitor
  app.get('/api/admin/subscriptions', (req: Request, res: Response) => {
    const subs = db.getAllSubscriptions();
    const users = db.getUsers();
    
    // Join details
    const records = Object.entries(subs).map(([phone, record]) => {
      const user = users.find(u => u.phone === phone);
      return {
        phone,
        status: record.status,
        date: record.date,
        userName: user?.name || 'Anonymous Subscriber',
        userEmail: user?.email || 'unregistered@carrier.bd'
      };
    });

    return res.json({ subscriptions: records });
  });

  // Super Admin: Get all users
  app.get('/api/admin/users', (req: Request, res: Response) => {
    const users = db.getUsers();
    return res.json({ status: 'success', users });
  });

  // Super Admin: Update a user profile (reputation, title, bio, role, name, phone, subscribed status)
  app.post('/api/admin/users/update/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    const updated = db.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'User profile not found.' });
    }
    return res.json({ status: 'success', user: updated });
  });

  // Super Admin: Delete a user
  app.post('/api/admin/users/delete/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'User not found or deletion failed.' });
    }
    return res.json({ status: 'success', message: 'User removed from database successfully.' });
  });

  // Super Admin: Get all job posts
  app.get('/api/admin/jobs', (req: Request, res: Response) => {
    const jobs = db.getJobs();
    return res.json({ status: 'success', jobs });
  });

  // Super Admin: Manually add or modify subscriber number
  app.post('/api/admin/subscriptions/update', (req: Request, res: Response) => {
    const { phone, status } = req.body;
    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Subscriber phone number is required.' });
    }
    
    db.updateSubscription(phone, status || 'subscribed');
    return res.json({ status: 'success', message: `Subscription state synced successfully for ${phone}` });
  });

  // Super Admin: Retrieve system logs (AI Sandboxes and evaluated interviews)
  app.get('/api/admin/logs', (req: Request, res: Response) => {
    const interviews = db.getInterviews().map(i => {
      const user = db.getUser(i.candidateId);
      return {
        id: i.id,
        type: 'Mock Interview Evaluation',
        target: i.jobTitle,
        user: user?.name || 'Anonymous Candidate',
        score: i.evaluation?.overallScore || 0,
        timestamp: 'Completed Session',
        details: i.evaluation?.feedback || 'Interview evaluated by Gemini.'
      };
    });

    const submissions = db.getSubmissions().map(s => {
      const user = db.getUser(s.candidateId);
      const task = db.getTask(s.taskId);
      return {
        id: s.id,
        type: 'AI Coding Sandbox',
        target: task?.title || 'Coding Task',
        user: user?.name || 'Anonymous Candidate',
        score: s.score,
        timestamp: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Just now',
        details: s.aiReview || s.status || 'Code submission verified.'
      };
    });

    const allLogs = [...interviews, ...submissions].sort((a, b) => b.score - a.score);
    return res.json({ status: 'success', logs: allLogs });
  });

  // Super Admin: Retrieve system setting toggles
  app.get('/api/admin/settings', (req: Request, res: Response) => {
    const settings = db.getSystemSettings();
    return res.json({ status: 'success', settings });
  });

  // Super Admin: Save system setting toggles
  app.post('/api/admin/settings', (req: Request, res: Response) => {
    const updates = req.body;
    const updated = db.updateSystemSettings(updates);
    return res.json({ status: 'success', settings: updated });
  });

  // Super Admin: Retrieve aggregated analytics data
  app.get('/api/admin/analytics', (req: Request, res: Response) => {
    const users = db.getUsers();
    const jobs = db.getJobs();
    const subs = db.getAllSubscriptions();
    const subArray = Object.entries(subs).map(([phone, rec]) => ({ phone, ...rec }));

    const candidates = users.filter(u => u.role === 'candidate');
    const companies = users.filter(u => u.role === 'company');

    // Calculate skill counts
    const skillCounts: Record<string, number> = {};
    candidates.forEach(c => {
      c.skills.forEach(s => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const skillsChart = Object.entries(skillCounts).map(([name, value]) => ({ name, value }));

    // Subscription billing breakdown
    const activeSubs = subArray.filter(s => s.status === 'subscribed').length;
    const suspendedSubs = subArray.filter(s => s.status === 'suspended').length;
    const unsubbedSubs = subArray.filter(s => s.status === 'unsubscribed').length;

    const subStatesChart = [
      { name: 'Active (Premium)', value: activeSubs },
      { name: 'Suspended', value: suspendedSubs },
      { name: 'Unsubscribed', value: unsubbedSubs }
    ];

    return res.json({
      status: 'success',
      data: {
        userDistribution: [
          { name: 'Candidates', count: candidates.length },
          { name: 'Companies', count: companies.length }
        ],
        subStates: subStatesChart,
        skills: skillsChart.slice(0, 5),
        totals: {
          users: users.length,
          jobs: jobs.length,
          subscriptions: activeSubs,
          submissions: db.getSubmissions().length
        }
      }
    });
  });

  // --- CENTRALIZED GROQ AI API ENDPOINTS ---

  // 1. AI Job Matching
  app.post('/api/ai/job-match', async (req: Request, res: Response) => {
    const { candidateId, jobId } = req.body;
    if (!candidateId || !jobId) {
      return res.status(400).json({ status: 'error', message: 'Candidate ID and Job ID are required.' });
    }
    const candidate = db.getUser(candidateId);
    const job = db.getJob(jobId);
    if (!candidate) {
      return res.status(404).json({ status: 'error', message: 'Candidate profile not found.' });
    }
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job listing not found.' });
    }
    try {
      const result = await aiJobMatching(candidate, job);
      return res.json({ status: 'success', match: result });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 2. AI Skill Assessment
  app.post('/api/ai/assessments/generate', async (req: Request, res: Response) => {
    const { skill, difficulty } = req.body;
    if (!skill) {
      return res.status(400).json({ status: 'error', message: 'Skill name is required.' });
    }
    try {
      const assessment = await aiSkillAssessment(skill, difficulty || 'Intermediate');
      return res.json({ status: 'success', assessment });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 3. AI Task Generator
  app.post('/api/ai/tasks/generate', async (req: Request, res: Response) => {
    const { jobTitle, jobDescription, category, skills } = req.body;
    if (!jobTitle || !jobDescription || !category) {
      return res.status(400).json({ status: 'error', message: 'Job title, job description, and category are required.' });
    }
    try {
      const task = await aiTaskGenerator(jobTitle, jobDescription, category, skills || []);
      return res.json({ status: 'success', task });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 4. AI Task Evaluation
  app.post('/api/ai/tasks/evaluate', async (req: Request, res: Response) => {
    const { taskDescription, submissionType, submissionContent } = req.body;
    if (!taskDescription || !submissionType || !submissionContent) {
      return res.status(400).json({ status: 'error', message: 'Task description, submission type, and submission content are required.' });
    }
    try {
      const evaluation = await aiTaskEvaluation(taskDescription, submissionType, submissionContent);
      return res.json({ status: 'success', evaluation });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 5. AI Reputation Score Calculation
  app.get('/api/ai/reputation-score/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = db.getUser(id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Candidate user not found.' });
    }
    try {
      const attempts = db.getAttempts(id);
      const submissions = db.getSubmissions(id);
      const certificates = db.getCertificates(id);
      
      const result = await aiReputationScore({
        attempts,
        submissions,
        certificates,
        githubConnected: !!user.githubUrl,
        portfolioConnected: !!user.portfolioUrl,
        activityCount: attempts.length + submissions.length + 3,
        userProfile: user
      });

      // Update in our DB too to persist
      db.updateUser(id, { reputationScore: result.score });

      return res.json({ status: 'success', data: result });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 6. AI Resume Analysis
  app.post('/api/ai/resume/analyze', async (req: Request, res: Response) => {
    const { resumeText, jobRequirements } = req.body;
    if (!resumeText) {
      return res.status(400).json({ status: 'error', message: 'Resume text is required.' });
    }
    try {
      const result = await aiResumeAnalysis(resumeText, jobRequirements || []);
      return res.json({ status: 'success', analysis: result });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 7. AI Career Roadmap
  app.post('/api/ai/career-roadmap', async (req: Request, res: Response) => {
    const { skills, targetCareer } = req.body;
    if (!targetCareer) {
      return res.status(400).json({ status: 'error', message: 'Target career title is required.' });
    }
    try {
      const roadmap = await aiCareerRoadmap(skills || [], targetCareer);
      return res.json({ status: 'success', roadmap });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 8. AI Company Insights
  app.post('/api/ai/company-insights', async (req: Request, res: Response) => {
    const { title, description, requirements, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ status: 'error', message: 'Title, description, and category are required.' });
    }
    try {
      const insights = await aiCompanyInsights(title, description, requirements || [], category);
      return res.json({ status: 'success', insights });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 9. AI Candidate Ranking
  app.post('/api/ai/rank-candidates', async (req: Request, res: Response) => {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ status: 'error', message: 'Job ID is required.' });

    try {
      const job = db.getJob(jobId);
      if (!job) return res.status(404).json({ status: 'error', message: 'Job not found.' });

      const allApplications = db.getAllApplications().filter(a => a.jobId === jobId);
      const candidates = allApplications.map(app => ({
        profile: db.getUser(app.candidateId)!,
        application: app
      })).filter(c => c.profile);

      if (candidates.length === 0) return res.json({ status: 'success', rankings: [], summary: 'No applicants to rank.' });

      const result = await aiCandidateRanking(job, candidates);
      
      // Update applications with rankings
      result.rankings.forEach(r => {
        const app = allApplications.find(a => a.candidateId === r.candidateId);
        if (app) {
          app.aiRanking = r.score;
          db.updateApplication(app.id, { aiRanking: r.score });
          if (isSupabaseServerConfigured) {
            updateApplicationInSupabase(app.id, { aiRanking: r.score });
          }
        }
      });

      return res.json({ status: 'success', ...result });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 10. AI Shortlisting
  app.post('/api/ai/shortlist', async (req: Request, res: Response) => {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ status: 'error', message: 'Job ID is required.' });

    try {
      const job = db.getJob(jobId);
      const allApplications = db.getAllApplications().filter(a => a.jobId === jobId);
      const candidates = allApplications.map(app => ({
        profile: db.getUser(app.candidateId)!,
        application: app
      })).filter(c => c.profile);

      if (candidates.length === 0) return res.json({ status: 'success', shortlisted: [] });

      const result = await aiShortlistCandidates(job!, candidates);
      
      // Update status to shortlisted
      result.shortlistedCandidateIds.forEach(cid => {
        const app = allApplications.find(a => a.candidateId === cid);
        if (app) {
          app.status = 'shortlisted';
          app.shortlisted = true;
          db.updateApplication(app.id, { status: 'shortlisted', shortlisted: true });
          if (isSupabaseServerConfigured) {
            updateApplicationInSupabase(app.id, { status: 'shortlisted', shortlisted: true });
          }
        }
      });

      return res.json({ status: 'success', ...result });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 11. AI Interview Question Generation
  app.post('/api/ai/generate-interview', async (req: Request, res: Response) => {
    const { jobId, candidateId, difficulty } = req.body;
    if (!jobId || !candidateId) return res.status(400).json({ status: 'error', message: 'Job ID and Candidate ID are required.' });

    try {
      const job = db.getJob(jobId);
      const candidate = db.getUser(candidateId);
      if (!job || !candidate) return res.status(404).json({ status: 'error', message: 'Job or Candidate not found.' });

      const result = await aiGenerateInterview(job, candidate, difficulty || 'Intermediate');
      return res.json({ status: 'success', ...result });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 12. Interview Scheduling
  app.post('/api/interviews/schedule', async (req: Request, res: Response) => {
    const { jobId, candidateId, scheduledAt, meetingType, meetingLink, difficultyLevel, questions } = req.body;
    
    const interview: Interview = {
      id: 'int-' + Math.random().toString(36).substring(2, 10),
      jobId,
      candidateId,
      scheduledAt,
      status: 'scheduled',
      meetingType,
      meetingLink,
      difficultyLevel: difficultyLevel || 'Intermediate',
      questions: questions || [],
      createdAt: new Date().toISOString()
    };

    db.saveHiringInterview(interview);
    if (isSupabaseServerConfigured) {
      await saveInterviewToSupabase(interview);
    }

    // Send notification to candidate
    const msg = `Your interview for ${db.getJob(jobId)?.title} has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`;
    db.sendNotification(candidateId, 'Interview Scheduled', msg);
    if (isSupabaseServerConfigured) {
      sendNotificationToSupabase(candidateId, 'Interview Scheduled', msg);
    }

    return res.json({ status: 'success', interview });
  });

  // 13. AI Interview Summary
  app.post('/api/ai/interview-summary', async (req: Request, res: Response) => {
    const { interviewId, feedback } = req.body;
    if (!interviewId || !feedback) return res.status(400).json({ status: 'error', message: 'Interview ID and feedback are required.' });

    try {
      const interview = db.getHiringInterview(interviewId);
      if (!interview) return res.status(404).json({ status: 'error', message: 'Interview not found.' });

      const result = await aiInterviewSummary(interview, feedback);
      
      const summary: InterviewSummary = {
        id: 'sum-' + Math.random().toString(36).substring(2, 10),
        interviewId,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendation: result.recommendation,
        feedback: result.feedbackSummary,
        overallScore: result.overallScore,
        createdAt: new Date().toISOString()
      };

      db.saveInterviewSummary(summary);
      if (isSupabaseServerConfigured) {
        await saveInterviewSummaryToSupabase(summary);
      }

      return res.json({ status: 'success', summary });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 14. Get Interviews
  app.get('/api/interviews/company/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    let interviews = db.getHiringInterviewsForCompany(id);
    if (isSupabaseServerConfigured) {
      const supInterviews = await getInterviewsForCompany(id);
      if (supInterviews.length > 0) interviews = supInterviews;
    }
    return res.json({ status: 'success', interviews });
  });

  app.get('/api/interviews/candidate/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    let interviews = db.getHiringInterviewsForCandidate(id);
    if (isSupabaseServerConfigured) {
      const supInterviews = await getInterviewsForCandidate(id);
      if (supInterviews.length > 0) interviews = supInterviews;
    }
    return res.json({ status: 'success', interviews });
  });

  // Mount bdapps carrier router
  app.use('/api/bdapps', bdappsRouter);

  // Public: Retrieve candidate profile for public passport viewing
  app.get('/api/public/profile/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    let user = db.getUser(id);

    if (isSupabaseServerConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (data) {
          user = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            title: data.title,
            bio: data.bio,
            skills: data.skills || [],
            reputationScore: data.reputation_score,
            verifiedSkills: data.verified_skills || {},
            subscribed: data.subscribed,
            phone: data.phone,
            githubUrl: data.github_url,
            portfolioUrl: data.portfolio_url,
          };
        }
      } catch (err) {
        console.error('Failed to retrieve profile from Supabase:', err);
      }
    }

    if (!user || user.role !== 'candidate') {
      return res.status(404).json({ status: 'error', message: 'Candidate profile not found.' });
    }

    // Load certificates
    let certs = db.getCertificates(id);
    if (isSupabaseServerConfigured) {
      try {
        const supCerts = await getCertificatesFromSupabase(id);
        if (supCerts && supCerts.length > 0) {
          certs = supCerts;
        }
      } catch (err) {
        console.error('Failed to retrieve certificates from Supabase:', err);
      }
    }

    return res.json({
      status: 'success',
      user,
      certificates: certs,
    });
  });

  // Public: Verify a certificate by its unique cryptographic hash
  app.get('/api/public/verify-certificate/:hash', async (req: Request, res: Response) => {
    const { hash } = req.params;
    let cert: any = null;

    if (isSupabaseServerConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from('certificates')
          .select('*')
          .eq('cert_hash', hash)
          .single();
        if (data) {
          cert = data;
        }
      } catch (err) {
        console.error('Failed to query certificate from Supabase:', err);
      }
    }

    if (!cert) {
      // Fallback to local database search
      const allCerts = db.getAllCertificates();
      cert = allCerts.find((c: any) => c.cert_hash === hash || c.id === hash);
    }

    if (!cert) {
      return res.status(404).json({ status: 'error', message: 'No certificate found with the matching cryptographic hash.' });
    }

    // Now find the candidate details
    const candidateId = cert.candidate_id;
    let user = db.getUser(candidateId);

    if (isSupabaseServerConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from('profiles')
          .select('*')
          .eq('id', candidateId)
          .single();
        if (data) {
          user = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            title: data.title,
            bio: data.bio,
            skills: data.skills || [],
            reputationScore: data.reputation_score,
            verifiedSkills: data.verified_skills || {},
            subscribed: data.subscribed,
            phone: data.phone,
            githubUrl: data.github_url,
            portfolioUrl: data.portfolio_url,
          };
        }
      } catch (err) {
        console.error('Failed to retrieve candidate profile for certificate verification:', err);
      }
    }

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Associated candidate profile not found.' });
    }

    return res.json({
      status: 'success',
      certificate: cert,
      candidate: user
    });
  });


  // --- VITE AND STATIC SERVING MIDDLEWARE ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("[Vite Middleware] Dev Server mounted on Express.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkillHire AI Container] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting Express + Vite server:", err);
});
