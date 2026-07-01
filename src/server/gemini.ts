import { callGroqAPI, cleanAndParseJSON } from './groqClient';
import { UserProfile, JobPost, SkillAssessment, MockInterviewSession, AIEvaluation } from '../types';
import { 
  aiJobMatching, 
  aiSkillAssessment, 
  aiTaskGenerator, 
  aiTaskEvaluation, 
  aiReputationScore, 
  aiResumeAnalysis, 
  aiCareerRoadmap, 
  aiCompanyInsights 
} from './aiService';

// Check if Groq API key is set
function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return !!key && key !== 'MY_GROQ_API_KEY' && key.trim() !== '';
}

// 1. AI Assessment Engine: Generate Multiple Choice Questions for a Skill
export async function aiGenerateAssessment(skill: string, difficulty: string): Promise<Partial<SkillAssessment>> {
  const diff = (difficulty === 'Expert' || difficulty === 'Advanced') ? 'Advanced' : (difficulty === 'Beginner' ? 'Beginner' : 'Intermediate');
  const result = await aiSkillAssessment(skill, diff as any);
  return result;
}

// 2. AI Resume Analysis & Match score
export async function aiAnalyzeResume(resumeText: string, jobRequirements: string[]): Promise<{
  matchScore: number;
  feedback: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestedImprovement: string;
}> {
  const result = await aiResumeAnalysis(resumeText, jobRequirements);
  return result;
}

// 3. AI Interview Generator: Generate interview questions based on user skills and target job description
export async function aiGenerateInterviewQuestions(jobTitle: string, candidateProfile: string): Promise<string[]> {
  const defaultFallback = [
    `Can you describe an architecture where you optimized a performance bottleneck in a project using ${jobTitle} or related libraries? What specific indicators guided your tuning?`,
    `How do you handle state synchronization and asynchronous latency in distributed frameworks or client-side applications?`,
    `Tell me about a time you had to deliver a complex software task under severe time constraints. How did you manage scope discipline?`
  ];

  if (!isGroqConfigured()) {
    console.warn('[Groq Gemini Wrapper] Groq not configured. Using local fallback for Interview Questions.');
    return defaultFallback;
  }

  try {
    const promptSystem = `You are an elite developer panelist. Generate exactly 3 tailored, highly technical and behavioral interview questions for a candidate practicing for the position of "${jobTitle}".
Candidate profile: "${candidateProfile}".
Respond with a valid JSON array of strings ONLY:
["Question 1", "Question 2", "Question 3"]`;

    const result = await callGroqAPI([
      { role: 'system', content: promptSystem },
      { role: 'user', content: `Generate 3 interview questions for ${jobTitle}` }
    ], { temperature: 0.6, jsonMode: true });

    return cleanAndParseJSON(result, defaultFallback);
  } catch (err: any) {
    console.error('[Groq Gemini Wrapper] Interview generation failed:', err);
    return defaultFallback;
  }
}

// 4. AI Interview Evaluation: Evaluate candidate's answers to the interview questions
export async function aiEvaluateInterview(questions: string[], answers: Record<number, string>): Promise<{
  overallScore: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}> {
  const QandA = questions.map((q, i) => `Question: ${q}\nAnswer: ${answers[i] || 'No answer provided.'}`).join("\n\n");
  
  const defaultFallback = {
    overallScore: 75,
    strengths: [
      "Direct structural answers emphasizing problem-solving methods",
      "Demonstrated practical familiarity with real-world project scenarios"
    ],
    improvements: [
      "Could elaborate more on low-level performance bottlenecks or complexity scales (Big-O)",
      "Provide specific system metrics to validate optimization claims"
    ],
    feedback: `The responses showcase solid engineering instincts. Highlighting architectural trade-offs in future interviews will set you apart.`
  };

  if (!isGroqConfigured()) {
    console.warn('[Groq Gemini Wrapper] Groq not configured. Using local fallback for Interview Evaluation.');
    return defaultFallback;
  }

  try {
    const promptSystem = `You are an AI Interview Panelist. Evaluate the candidate's responses to these interview questions.
Score their articulation, depth of tech knowledge, and structural response framework.
Respond with a valid JSON object matching this exact schema:
{
  "overallScore": 82,
  "strengths": ["Clear breakdown of concurrent state", "Good behavioral reflection"],
  "improvements": ["Could mention specific runtime metrics", "Add detail on memory profiling"],
  "feedback": "Comprehensive and encouraging technical summary of the candidate's performance."
}`;

    const result = await callGroqAPI([
      { role: 'system', content: promptSystem },
      { role: 'user', content: QandA }
    ], { temperature: 0.4, jsonMode: true });

    return cleanAndParseJSON(result, defaultFallback);
  } catch (err: any) {
    console.error('[Groq Gemini Wrapper] Interview evaluation failed:', err);
    return defaultFallback;
  }
}

// 5. AI Skill Code Evaluation (Scores Requirement Coverage, Problem Solving, Quality, Creativity, Accuracy)
export async function aiEvaluateSubmission(
  taskDescription: string,
  submissionType: 'code' | 'github' | 'portfolio' | 'pdf',
  submissionData: {
    code?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    pdfDataUrl?: string;
  }
): Promise<{
  status: 'success' | 'failed';
  score: number;
  aiReview: string;
  evaluation: AIEvaluation;
}> {
  let submissionContent = "";
  if (submissionType === 'code') {
    submissionContent = submissionData.code || "";
  } else if (submissionType === 'github') {
    submissionContent = `GitHub Repository: ${submissionData.githubUrl || ""}`;
  } else if (submissionType === 'portfolio') {
    submissionContent = `Portfolio URL: ${submissionData.portfolioUrl || ""}`;
  } else if (submissionType === 'pdf') {
    submissionContent = `PDF Data Attachment (truncated): ${(submissionData.pdfDataUrl || "").substring(0, 500)}`;
  }

  const evaluation = await aiTaskEvaluation(taskDescription, submissionType, submissionContent);
  return {
    status: evaluation.overallScore >= 60 ? 'success' : 'failed',
    score: evaluation.overallScore,
    aiReview: evaluation.feedback,
    evaluation
  };
}

export async function aiVerifyCodeSubmission(taskDescription: string, code: string): Promise<{
  status: 'success' | 'failed';
  score: number;
  aiReview: string;
}> {
  const evaluation = await aiEvaluateSubmission(taskDescription, 'code', { code });
  return {
    status: evaluation.status,
    score: evaluation.score,
    aiReview: evaluation.aiReview
  };
}

// 6. AI Task Generator: Creates a practical task based on company's desired skills
export async function aiGeneratePracticalTask(skills: string[]): Promise<{
  title: string;
  description: string;
  skill: string;
  timeLimit: string;
  starterCode: string;
}> {
  const primarySkill = skills[0] || 'TypeScript';
  const task = await aiTaskGenerator(
    `Skill Practice: ${primarySkill}`,
    `Solve a practical challenge focusing on ${skills.join(', ')}`,
    primarySkill,
    skills
  );

  return {
    title: task.title,
    description: task.description,
    skill: task.skill,
    timeLimit: task.timeLimit,
    starterCode: task.starterCode
  };
}

// 7. AI Job Posting Analyzer: Extract and build Skill Matrix, Difficulty, Required & Optional Skills
export async function aiAnalyzeJobPosting(
  title: string,
  description: string,
  skills: string[],
  salary: string,
  category: string
): Promise<{
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  requiredSkillsList: string[];
  optionalSkillsList: string[];
  skillMatrix: Array<{
    skill: string;
    importance: 'High' | 'Medium' | 'Low';
    category: string;
    proficiency: string;
  }>;
}> {
  const insights = await aiCompanyInsights(title, description, skills, category);
  
  // Format into required shape
  const diffLevel = insights.healthIndex > 85 ? 'Advanced' : insights.healthIndex > 65 ? 'Intermediate' : 'Beginner';
  
  const requiredSkillsList = insights.improvedRequirements.length > 0 
    ? insights.improvedRequirements.map(r => r.split(' ')[0] || r) 
    : skills;

  const skillMatrix = requiredSkillsList.map((sk, idx) => ({
    skill: sk,
    importance: idx === 0 ? 'High' : (idx === 1 ? 'Medium' : 'Low') as any,
    category,
    proficiency: diffLevel === 'Advanced' ? 'Expert' : 'Hands-on'
  }));

  return {
    difficultyLevel: diffLevel as any,
    requiredSkillsList,
    optionalSkillsList: insights.shortcomings,
    skillMatrix
  };
}

// 8. AI Custom Job Practical Task Generator (Supporting 10 specified categories)
export async function aiGenerateJobTask(
  title: string,
  description: string,
  category: string,
  skills: string[]
): Promise<{
  title: string;
  description: string;
  skill: string;
  timeLimit: string;
  starterCode: string;
  testCases: Array<{ input: string; output: string }>;
}> {
  const task = await aiTaskGenerator(title, description, category, skills);
  return {
    title: task.title,
    description: task.description,
    skill: task.skill,
    timeLimit: task.timeLimit,
    starterCode: task.starterCode,
    testCases: task.testCases
  };
}
