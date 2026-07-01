import { UserProfile, JobPost, SkillAssessment, PracticalTask, AIEvaluation } from '../types';

/**
 * 1. Prompt for AI Job Matching
 */
export function getJobMatchingPrompt(candidate: UserProfile, job: JobPost) {
  const candidateSkills = (candidate.skills || []).join(', ');
  const verifiedSkills = Object.entries(candidate.verifiedSkills || {})
    .map(([skill, info]) => `${skill} (verified score: ${info.score}%)`)
    .join(', ');

  const jobRequired = (job.skillsRequired || []).concat(job.requiredSkillsList || []).join(', ');
  const jobOptional = (job.optionalSkillsList || []).join(', ');

  return {
    system: `You are an elite, senior recruiting matching AI system. You calculate a precise, professional job compatibility match score (0 to 100%) and write a comprehensive, technical alignment overview explaining the exact reasons for the matching score, strengths, and missing requirements.
You MUST respond with a valid JSON object matching this exact schema:
{
  "matchPercentage": 85,
  "explanation": "A concise, technical summary (approx 200 words) describing why the candidate matches or where they fall short.",
  "strengths": ["Strong typescript core background", "Verified frontend rendering skills"],
  "gaps": ["No production experience with Docker containers", "Needs back-end database orchestration experience"],
  "actionableSteps": ["Take the Docker assessment on SkillHire AI", "Build a microservices portfolio task"]
}`,
    user: `Calculate compatibility for this candidate against this job post:

[CANDIDATE DETAILS]
- Name: ${candidate.name}
- Title: ${candidate.title || 'Software Developer'}
- Bio: ${candidate.bio || 'Not provided'}
- Skills: ${candidateSkills}
- Verified Skills: ${verifiedSkills || 'None'}
- Reputation Score: ${candidate.reputationScore} / 1000

[JOB DETAILS]
- Title: ${job.title}
- Company: ${job.companyName}
- Department: ${job.department}
- Location: ${job.location}
- Description: ${job.description}
- Required Skills: ${jobRequired}
- Nice-to-Have Skills: ${jobOptional}`
  };
}

/**
 * 2. Prompt for AI Skill Assessment
 */
export function getSkillAssessmentPrompt(skill: string, difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') {
  return {
    system: `You are a world-class technical assessment author. Generate a rigorous 3-question multiple-choice technical quiz about "${skill}" with a difficulty level of "${difficulty}".
Avoid shallow questions. Test deep, architectural, and production-level knowledge suitable for "${difficulty}" professionals.
You MUST respond with a valid JSON object matching this exact schema:
{
  "title": "Descriptive assessment title (e.g., Deep Dive into ${skill} Performance)",
  "skill": "${skill}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "question": "A detailed, technical question body...",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": 0
    },
    {
      "id": "q2",
      "question": "Another high-quality question...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2
    },
    {
      "id": "q3",
      "question": "A third scenario-based or optimization question...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 1
    }
  ]
}`,
    user: `Generate a multiple choice technical assessment for:
Skill: "${skill}"
Difficulty: "${difficulty}"`
  };
}

/**
 * 3. Prompt for AI Task Generator (real-world project tasks based on the job description)
 */
export function getTaskGeneratorPrompt(jobTitle: string, jobDescription: string, category: string, skills: string[]) {
  const skillsStr = skills.join(', ');
  return {
    system: `You are a Principal Engineering Lead and hiring partner. Generate a highly realistic, customized practical task (challenge) for candidates applying to the position of "${jobTitle}".
Tailor the challenge specifically to the "${category}" category.
Include a descriptive task title, comprehensive step-by-step instructions (describing problem, constraints, and success criteria), a suggested time limit, starter boilerplate code/templates, and at least 2 structured evaluation test cases.
You MUST respond with a valid JSON object matching this exact schema:
{
  "title": "A highly descriptive, realistic task title",
  "description": "Comprehensive step-by-step instructions. Explain the problem, the core constraints, and what the candidate must outline, build, or implement.",
  "skill": "${category}",
  "timeLimit": "30 minutes",
  "starterCode": "A multi-line boilerplate file, template structure, or coding skeleton that candidates edit.",
  "testCases": [
    { "input": "Scenario 1 / Evaluation criterion 1", "output": "Expected checklist element or outcome details" },
    { "input": "Scenario 2 / Evaluation criterion 2", "output": "Expected checklist element or outcome details" }
  ]
}`,
    user: `Generate a personalized practical assessment task for:
- Job Title: "${jobTitle}"
- Job Category: "${category}"
- Key Skills: "${skillsStr}"
- Job Overview:
"${jobDescription}"`
  };
}

/**
 * 4. Prompt for AI Task Evaluation
 */
export function getTaskEvaluationPrompt(
  taskDescription: string,
  submissionType: 'code' | 'github' | 'portfolio' | 'pdf',
  submissionContent: string
) {
  return {
    system: `You are an elite automated technical code evaluator and hiring manager.
Analyze the candidate's submission against the requested task.
Check for completeness, correctness, code hygiene, and technical depth.
Detect incomplete, shallow, or empty submissions and score them accordingly.
You MUST respond with a valid JSON object matching this exact schema:
{
  "requirementCoverage": 85,
  "problemSolving": 90,
  "quality": 88,
  "creativity": 75,
  "accuracy": 92,
  "overallScore": 86,
  "feedback": "A comprehensive summary review of the submission...",
  "strengths": ["Excellent usage of standard data structures", "Robust error boundaries"],
  "weaknesses": ["Lack of performance metrics under iteration", "Unoptimized recursive loop"],
  "learningSuggestions": ["Study algorithmic optimization techniques", "Investigate memory boundaries in deep structures"]
}`,
    user: `Evaluate this candidate's submission:

[TASK COMPLETED]
"${taskDescription}"

[SUBMISSION TYPE]
"${submissionType}"

[SUBMISSION CONTENT]
${submissionContent}`
  };
}

/**
 * 5. Prompt for AI Reputation Score Calculator
 */
export function getReputationScorePrompt(data: {
  attempts: any[];
  submissions: any[];
  certificates: any[];
  portfolioConnected: boolean;
  githubConnected: boolean;
  activityCount: number;
  userProfile: UserProfile;
}) {
  return {
    system: `You are an advanced talent reputation scoring algorithm. Your goal is to analyze a candidate's complete platform history and determine an objective, dynamic Skill Reputation Score (from 0 to 1000) and provide a professional breakdown of their career reputation standing.
Start with a base score of 300.
Weight the elements as follows:
- Assessment/Quiz attempts (up to +200 points based on scores and passing rate)
- Practical tasks submitted (up to +250 points based on evaluation scores)
- Certificates earned (up to +150 points)
- Professional portfolio linkages (up to +50 points for GitHub, +50 points for personal website)
- Platform activity and applications (up to +100 points)
Ensure scores are non-arbitrary and mathematically robust based on inputs.
You MUST respond with a valid JSON object matching this exact schema:
{
  "score": 680,
  "breakdown": {
    "base": 300,
    "assessments": 140,
    "tasks": 120,
    "certificates": 40,
    "portfolio": 50,
    "activity": 30
  },
  "badge": "Rising Specialist",
  "summary": "Detailed professional resume reputation summary explaining why the candidate reached this tier."
}`,
    user: `Calculate the dynamic reputation score for candidate:

[CANDIDATE BIOGRAPHY]
- Name: ${data.userProfile.name}
- Title: ${data.userProfile.title || 'Software Developer'}
- Skills: ${(data.userProfile.skills || []).join(', ')}

[PLATFORM HISTORY DATA]
- Total Skill Assessments (Quizzes) Attempted: ${data.attempts.length}
- Assessment Attempts: ${JSON.stringify(data.attempts.map(a => ({ skill: a.skill, score: a.score, passed: a.passed })))}
- Practical Tasks Submitted: ${data.submissions.length}
- Task Submissions: ${JSON.stringify(data.submissions.map(s => ({ status: s.status, score: s.score })))}
- Verified Certificates: ${JSON.stringify(data.certificates.map(c => ({ title: c.title, skill: c.skill })))}
- GitHub Connected: ${data.githubConnected}
- Portfolio Link Connected: ${data.portfolioConnected}
- Platform Activity Interactivity Count: ${data.activityCount}`
  };
}

/**
 * 6. Prompt for AI Resume Analysis
 */
export function getResumeAnalysisPrompt(resumeText: string, jobRequirements: string[]) {
  const reqStr = jobRequirements.join(', ');
  return {
    system: `You are a senior ATS (Applicant Tracking System) engineer and expert resume optimiser.
Analyze the candidate's CV text and evaluate how closely it aligns with the specified target job requirements.
Provide a clear compatibility score (0 to 100), detailed positive highlights, weak spots/missing keywords, and actionable enhancement recommendations.
You MUST respond with a valid JSON object matching this exact schema:
{
  "matchScore": 72,
  "feedback": "Comprehensive, technical resume feedback details.",
  "matchedSkills": ["TypeScript", "React"],
  "missingSkills": ["Redis", "AWS Lambda"],
  "suggestedImprovement": "Explicit, actionable steps to enhance formatting, showcase technical impact, and add core missing technologies."
}`,
    user: `Analyze this resume text against the target requirements:

[TARGET JOB REQUIREMENTS]
${reqStr || 'General software engineer requirements: TypeScript, Web standards, API communication.'}

[CV TEXT]
${resumeText}`
  };
}

/**
 * 7. Prompt for AI Career Roadmap
 */
export function getCareerRoadmapPrompt(skills: string[], targetCareer: string) {
  const userSkills = skills.join(', ') || 'General basics';
  return {
    system: `You are a professional technical career counselor and engineering architect.
Create a highly personalized, structured career roadmap showing how a candidate with the listed skills can achieve their target career goals.
You MUST generate 4 progressive phases: "Immediate Foundations", "Skill Acceleration", "Portfolio Building", and "Advanced Certification/Market Readiness".
Each phase should contain an objective, specific technical skills to learn, practical project milestones, and suggested platform assessment focuses.
You MUST respond with a valid JSON object matching this exact schema:
{
  "targetCareer": "${targetCareer}",
  "estimatedTimeframe": "6 to 9 Months",
  "phases": [
    {
      "phaseName": "Phase 1: Immediate Foundations",
      "objective": "Fill core syntax and basic architectural gaps",
      "skillsToAcquire": ["TypeScript Generics", "RESTful Routing"],
      "projectMilestone": "Build a secure REST mock client with validation parameters",
      "suggestedQuizzes": ["TypeScript Essential Assessment"]
    },
    {
      "phaseName": "Phase 2: Skill Acceleration",
      "objective": "Adopt frameworks and professional workflows",
      "skillsToAcquire": ["React Hooks", "State Synchronizers"],
      "projectMilestone": "Refactor a synchronous dashboard into concurrent streams",
      "suggestedQuizzes": ["React Architecture Quiz"]
    },
    {
      "phaseName": "Phase 3: Portfolio Building",
      "objective": "Validate skills on real tasks with proof of work",
      "skillsToAcquire": ["PostgreSQL", "Docker Containerization"],
      "projectMilestone": "Deploy a containerized Express fullstack server verified on GitHub",
      "suggestedQuizzes": ["Docker & Cloud Deployment Challenges"]
    },
    {
      "phaseName": "Phase 4: Advanced Certification/Market Readiness",
      "objective": "Certify reputation scores and prepare for interviews",
      "skillsToAcquire": ["System Design", "Rate Limiting Concepts"],
      "projectMilestone": "Complete mock technical simulators with score > 85%",
      "suggestedQuizzes": ["Elite Engineering System Design Assessment"]
    }
  ],
  "counselorAdvice": "A professional, encouraging final career tip to help them stand out in competitive markets."
}`,
    user: `Generate a personalized technical career roadmap:
- Current Candidate Skills: ${userSkills}
- Target Career Destination: ${targetCareer}`
  };
}

/**
 * 8. Prompt for AI Company Insights
 */
export function getCompanyInsightsPrompt(title: string, description: string, requirements: string[], category: string) {
  const reqsStr = requirements.join(', ') || 'Not explicitly provided';
  return {
    system: `You are an elite, technical talent acquisition advisor. You analyze a company's job posting (title, description, and requirements) and provide structural improvements to attract elite engineering talent.
Generate a job health index (0 to 100), keyword quality suggestions, a talent attraction recommendation, and advice to make their coding assessments highly relevant.
You MUST respond with a valid JSON object matching this exact schema:
{
  "healthIndex": 82,
  "marketCompetitiveness": "Medium-High",
  "shortcomings": ["Lack of clear performance expectations", "Ambiguous tech stack libraries specified"],
  "improvedRequirements": ["Specify experience with React Concurrent rendering", "Explicit Docker & PostgreSQL database structure knowledge"],
  "suggestedAssessmentTask": "Build a simple robust debounce controller with cancellation support in TS.",
  "adviceForAttraction": "A detailed strategy guide on how to frame the description, career growth paths, and workspace flexibility to attract top-tier professionals."
}`,
    user: `Analyze this company job posting to provide optimization insights:
- Category: ${category}
- Job Title: ${title}
- Original Job Description:
"${description}"
- Requirements List: ${reqsStr}`
  };
}
