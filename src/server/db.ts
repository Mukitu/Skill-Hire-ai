import fs from 'fs';
import path from 'path';
import { UserProfile, JobPost, SkillAssessment, AssessmentAttempt, MockInterviewSession, PracticalTask, TaskSubmission, JobApplication, Interview, InterviewSummary } from '../types';
import { 
  isSupabaseServerConfigured,
  saveProfileToSupabase,
  saveJobToSupabase,
  deleteJobFromSupabase,
  createApplicationInSupabase,
  saveSubscriptionToSupabase,
  saveSubscriptionHistoryToSupabase,
  saveAIScoreToSupabase,
  sendNotificationToSupabase
} from './supabase';

const DB_FILE = path.join(process.cwd(), 'db_store.json');

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  passwords?: Record<string, string>;
  jobs: JobPost[];
  assessments: SkillAssessment[];
  attempts: AssessmentAttempt[];
  interviews: MockInterviewSession[];
  tasks: PracticalTask[];
  submissions: TaskSubmission[];
  subscriptions: Record<string, { status: string; date: string }>;
  subscriptionHistory?: any[];
  applications?: any[];
  notifications?: any[];
  certificates?: any[];
  settings?: Record<string, any>;
}


const DEFAULT_DB: DatabaseSchema = {
  users: {
    'candidate-1': {
      id: 'candidate-1',
      email: 'candidate@skillhire.ai',
      name: 'Rahat Islam',
      role: 'candidate',
      title: 'Full Stack Engineer',
      bio: 'Enthusiastic JavaScript developer specialized in React and Node.js. Eager to solve real-world problems with high-efficiency code.',
      skills: ['React', 'TypeScript', 'Node.js', 'Express', 'TailwindCSS'],
      reputationScore: 780,
      verifiedSkills: {
        'TypeScript': { verified: true, score: 88, date: '2026-06-25' },
        'React': { verified: true, score: 92, date: '2026-06-26' }
      },
      subscribed: true,
      subscriptionDate: '2026-06-20',
      phone: '8801812345678'
    },
    'company-1': {
      id: 'company-1',
      email: 'hr@techcorp.com',
      name: 'Nusrat Jahan',
      role: 'company',
      companyName: 'TechCorp Solutions',
      title: 'Head of Talent',
      bio: 'Leading hiring and talent strategy at TechCorp. We build the future of AI-driven digital systems.',
      skills: [],
      reputationScore: 900,
      verifiedSkills: {},
      subscribed: false
    },
    'admin-1': {
      id: 'admin-1',
      email: 'admin@skillhire.ai',
      name: 'Super Administrator',
      role: 'admin',
      title: 'Platform Controller',
      bio: 'Oversight, carrier billing reconciliation, and prompt optimization supervisor.',
      skills: [],
      reputationScore: 1000,
      verifiedSkills: {},
      subscribed: true
    }
  },
  passwords: {
    'candidate-1': 'candidate123',
    'company-1': 'company123',
    'admin-1': 'admin123'
  },
  jobs: [
    {
      id: 'job-1',
      companyId: 'company-1',
      companyName: 'TechCorp Solutions',
      title: 'Senior React Developer',
      department: 'Frontend Engineering',
      location: 'Dhaka, Bangladesh (Hybrid)',
      salaryRange: '120,000 - 160,000 BDT/month',
      description: 'We are seeking an expert Frontend Engineer who can spearhead our next-generation visual systems using React 19, Vite, and tailwind. You will design elegant components with premium performance and tight API integrations.',
      requirements: [
        '5+ years of software development experience',
        'Strong expertise in modern React (Hooks, Context, Concurrent rendering)',
        'Proficiency with TypeScript and modern bundle tooling'
      ],
      skillsRequired: ['React', 'TypeScript', 'TailwindCSS'],
      tasksCount: 2
    },
    {
      id: 'job-2',
      companyId: 'company-1',
      companyName: 'TechCorp Solutions',
      title: 'Backend Node.js Engineer',
      department: 'Systems Core',
      location: 'Remote',
      salaryRange: '140,000 - 180,000 BDT/month',
      description: 'Join our backend infrastructure team to design secure scale-to-zero microservices and high-throughput databases. You will own architecture, security, and prompt systems.',
      requirements: [
        'Solid background in Express, PostgreSQL, and security rules',
        'Familiarity with cloud platforms (AWS, GCP, or Firebase)',
        'Strong problem-solving mind and API hygiene'
      ],
      skillsRequired: ['Node.js', 'Express', 'TypeScript'],
      tasksCount: 1
    }
  ],
  assessments: [
    {
      id: 'assess-1',
      title: 'TypeScript Advanced Core Concepts',
      skill: 'TypeScript',
      difficulty: 'Advanced',
      questions: [
        {
          id: 'q1',
          question: 'Which of the following utility types behaves like Omit but specifically restricts key types using keyof?',
          options: [
            'Pick<T, Exclude<keyof T, K>>',
            'Exclude<T, K>',
            'Extract<T, keyof K>',
            'Partial<Record<K, T>>'
          ],
          correctAnswer: 0
        },
        {
          id: 'q2',
          question: 'What is the utility of the "satisfies" operator introduced in TypeScript 4.9?',
          options: [
            'It forces a type coercion to any without linting errors',
            'It validates that an expression matches a type, but preserves the most specific type of the expression',
            'It ensures a function returns a promise of the correct generic constraint',
            'It automatically converts runtime strings into TypeScript interfaces'
          ],
          correctAnswer: 1
        },
        {
          id: 'q3',
          question: 'How do you define a type that allows any object with string keys except for a specific property "id"?',
          options: [
            'type Safe = { [K in string]: K extends "id" ? never : any }',
            'type Safe = Record<string, any> & { id?: never }',
            'type Safe = Omit<any, "id">',
            'type Safe = Exclude<{ id: any }, Record<string, any>>'
          ],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 'assess-2',
      title: 'React 19 & Concurrent State Control',
      skill: 'React',
      difficulty: 'Intermediate',
      questions: [
        {
          id: 'q1',
          question: 'Which hook should you use in React 19 to handle transitions for non-blocking state updates with built-in loading feedback?',
          options: [
            'useDeferredValue',
            'useTransition',
            'useActionState',
            'useOptimistic'
          ],
          correctAnswer: 1
        },
        {
          id: 'q2',
          question: 'In React 19, how are server-side forms and mutations naturally enhanced in standard HTML action attributes?',
          options: [
            'By passing async action functions directly to the form "action" prop',
            'By wrapping every input inside a custom Redux dispatch hook',
            'By running Express endpoints directly inside the browser',
            'By adding the "server-action" attribute'
          ],
          correctAnswer: 0
        }
      ]
    }
  ],
  attempts: [],
  interviews: [
    {
      id: "session-mock-1",
      candidateId: "candidate-1",
      jobTitle: "Senior React Developer",
      questions: [
        "How do you optimize render performance in large-scale React applications?",
        "What is your approach to handling side effects using concurrent React 19 hooks?",
        "Explain the benefits of TypeScript utility types for component props."
      ],
      currentQuestionIndex: 3,
      answers: {
        "0": "I use virtualization for long lists, ensure stable dependencies in hooks, and implement memoization using useMemo/useCallback where appropriate. In React 19, concurrent features also let us mark updates as transition-based.",
        "1": "I use useTransition to keep the UI responsive, and rely on async actions to write cleaner data mutation forms without blocking the main browser thread.",
        "2": "Utility types like Omit, Pick, and ReturnType make prop definitions highly reusable, preventing type widening and ensuring compile-time safety across atomic design boundaries."
      },
      completed: true,
      evaluation: {
        overallScore: 91,
        strengths: ["Strong concurrent rendering principles", "Solid TypeScript patterns", "Deep performance awareness"],
        improvements: ["Could cover SSR hydration bottlenecks in more depth"],
        feedback: "The candidate demonstrates senior-level proficiency with modern React features and TypeScript ergonomics. Recommended for immediate onsite interview."
      }
    }
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Reverse Words in a String',
      description: 'Write a typescript function `reverseWords(str: string): string` that reverses the words in a given string, keeping individual words spelled correctly but reversed in position. Trim any redundant space.',
      skill: 'TypeScript',
      timeLimit: '20 minutes',
      starterCode: `function reverseWords(str: string): string {
  // Write your code here
  return "";
}`,
      testCases: [
        { input: '"the sky is blue"', output: '"blue is sky the"' },
        { input: '"  hello world  "', output: '"world hello"' }
      ]
    },
    {
      id: 'task-2',
      title: 'Validate Balanced Parentheses',
      description: 'Write a typescript function `isValid(s: string): boolean` that takes a string containing just the characters "(", ")", "{", "}", "[" and "]" and determines if the input string is valid (brackets close in the correct order).',
      skill: 'TypeScript',
      timeLimit: '15 minutes',
      starterCode: `function isValid(s: string): boolean {
  // Write your code here
  return false;
}`,
      testCases: [
        { input: '"()[]{}"', output: 'true' },
        { input: '"(]"', output: 'false' }
      ]
    }
  ],
  submissions: [],
  subscriptions: {
    '8801812345678': { status: 'subscribed', date: '2026-06-30' }
  },
  subscriptionHistory: [
    {
      id: 'hist-mock-1',
      phone: '8801812345678',
      action: 'subscribe',
      amount: '3.00 BDT',
      status: 'subscribed',
      date: '2026-06-30',
      user_id: 'candidate-1',
      created_at: '2026-06-30T10:00:00.000Z'
    }
  ],
  applications: [
    {
      id: "app-mock-1",
      job_id: "job-1",
      candidate_id: "candidate-1",
      resume_text: "Enthusiastic JavaScript developer specialized in React, TypeScript and Node.js. 5 years of commercial frontend systems development.",
      status: "Shortlisted",
      score: 94,
      feedback: "Highly compatible match. Outstanding core skillset verified in React and TypeScript.",
      company_name: "TechCorp Solutions",
      job_title: "Senior React Developer",
      created_at: "2026-06-29T10:30:00.000Z"
    },
    {
      id: "app-mock-2",
      job_id: "job-1",
      candidate_id: "candidate-2",
      resume_text: "Fariha Jahan is a UI specialist with 3 years of experience. Expert in CSS, Figma, design systems and fluid micro-interactions.",
      status: "Interviewing",
      score: 82,
      feedback: "Strong visual and design systems foundations. Demonstrates excellent communication.",
      company_name: "TechCorp Solutions",
      job_title: "Senior React Developer",
      created_at: "2026-06-30T09:00:00.000Z"
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'candidate-1',
      title: 'Welcome to SkillHire.AI!',
      message: 'Explore your dashboard, complete skill assessments to earn verified badges, and showcase your achievements with the AI Passport.',
      read: false,
      created_at: new Date().toISOString()
    }
  ],
  certificates: [
    {
      id: 'cert-1',
      candidate_id: 'candidate-1',
      skill: 'React',
      score: 92,
      issue_date: '2026-06-26',
      cert_hash: 'cert-mockreact92'
    },
    {
      id: 'cert-2',
      candidate_id: 'candidate-1',
      skill: 'TypeScript',
      score: 88,
      issue_date: '2026-06-25',
      cert_hash: 'cert-mocktypescript88'
    }
  ],
  settings: {
    maintenanceMode: false,
    aiStrictEval: true,
    carrierBillingFeeRate: 3,
    allowCandidatePublicSharing: true,
    sandboxCompilerAllowed: true
  }
};

class DBManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...DEFAULT_DB };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB, using memory fallback.", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to save local DB.", e);
    }
  }

  // Users
  getUser(id: string): UserProfile | undefined {
    return this.data.users[id];
  }

  getUserPassword(id: string): string | undefined {
    if (!this.data.passwords) {
      this.data.passwords = {};
    }
    return this.data.passwords[id];
  }

  setUserPassword(id: string, password: string) {
    if (!this.data.passwords) {
      this.data.passwords = {};
    }
    this.data.passwords[id] = password;
    this.save();
  }

  getUserByEmail(email: string): UserProfile | undefined {
    return Object.values(this.data.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUsers(): UserProfile[] {
    return Object.values(this.data.users);
  }

  createUser(id: string, user: UserProfile): UserProfile {
    this.data.users[id] = user;
    this.save();
    // Sync with Supabase asynchronously
    saveProfileToSupabase(user);
    return user;
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    if (!this.data.users[id]) return undefined;
    this.data.users[id] = { ...this.data.users[id], ...updates };
    this.save();
    
    // Recalculate reputation score if candidate
    if (this.data.users[id].role === 'candidate') {
      this.recalculateUserReputation(id);
    } else {
      // For non-candidates, just save to Supabase
      saveProfileToSupabase(this.data.users[id]);
    }
    
    return this.data.users[id];
  }

  deleteUser(id: string): boolean {
    if (this.data.users[id]) {
      delete this.data.users[id];
      if (this.data.passwords && this.data.passwords[id]) {
        delete this.data.passwords[id];
      }
      this.save();
      return true;
    }
    return false;
  }

  getSystemSettings() {
    if (!this.data.settings) {
      this.data.settings = {
        maintenanceMode: false,
        aiStrictEval: true,
        carrierBillingFeeRate: 3,
        allowCandidatePublicSharing: true,
        sandboxCompilerAllowed: true
      };
    }
    return this.data.settings;
  }

  updateSystemSettings(updates: Record<string, any>) {
    this.data.settings = {
      ...this.getSystemSettings(),
      ...updates
    };
    this.save();
    return this.data.settings;
  }

  // Jobs
  getJobs(): JobPost[] {
    return this.data.jobs;
  }

  getJob(id: string): JobPost | undefined {
    return this.data.jobs.find(j => j.id === id);
  }

  createJob(job: JobPost): JobPost {
    this.data.jobs.push(job);
    this.save();
    // Sync with Supabase asynchronously
    saveJobToSupabase(job);
    return job;
  }

  // Assessments
  getAssessments(): SkillAssessment[] {
    return this.data.assessments;
  }

  getAssessment(id: string): SkillAssessment | undefined {
    return this.data.assessments.find(a => a.id === id);
  }

  createAssessment(assess: SkillAssessment): SkillAssessment {
    this.data.assessments.push(assess);
    this.save();
    return assess;
  }

  // Attempts
  getAttempts(candidateId?: string): AssessmentAttempt[] {
    if (candidateId) {
      return this.data.attempts.filter(a => a.candidateId === candidateId);
    }
    return this.data.attempts;
  }

  createAttempt(attempt: AssessmentAttempt) {
    this.data.attempts.push(attempt);
    // Update candidate verified skills if they scored >= 70%
    if (attempt.score >= 70) {
      const u = this.getUser(attempt.candidateId);
      if (u) {
        if (!u.verifiedSkills) u.verifiedSkills = {};
        u.verifiedSkills[attempt.skill] = {
          verified: true,
          score: attempt.score,
          date: attempt.verifiedDate
        };
        this.data.users[u.id] = u;
        this.save();

        if (attempt.score >= 80) {
          this.createCertificate(attempt.candidateId, attempt.skill, attempt.score);
          this.createNotification(
            attempt.candidateId,
            'New Certificate Earned!',
            `Congratulations! You've unlocked an official Skill Badge Certificate for ${attempt.skill} with a score of ${attempt.score}%.`
          );
        }
      }
    }
    this.save();
    
    // Automatically recalculate and sync reputation
    this.recalculateUserReputation(attempt.candidateId);
    
    // Sync to Supabase
    saveAIScoreToSupabase(attempt.candidateId, attempt.skill, attempt.score, { 
      type: 'quiz_assessment',
      assessmentId: attempt.assessmentId,
      passed: attempt.passed
    });
    this.createNotification(
      attempt.candidateId, 
      'Assessment Complete', 
      `You finished the ${attempt.skill} assessment with a score of ${attempt.score}%.`
    );
    sendNotificationToSupabase(
      attempt.candidateId, 
      'Assessment Complete', 
      `You finished the ${attempt.skill} assessment with a score of ${attempt.score}%.`
    );

    return attempt;
  }

  // Interviews
  getInterviews(candidateId?: string): MockInterviewSession[] {
    if (candidateId) {
      return this.data.interviews.filter(i => i.candidateId === candidateId);
    }
    return this.data.interviews;
  }

  getInterview(id: string): MockInterviewSession | undefined {
    return this.data.interviews.find(i => i.id === id);
  }

  createInterview(session: MockInterviewSession) {
    this.data.interviews.push(session);
    this.save();
    return session;
  }

  updateInterview(id: string, updates: Partial<MockInterviewSession>) {
    const idx = this.data.interviews.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.interviews[idx] = { ...this.data.interviews[idx], ...updates };
      // If completed & evaluated, boost reputation
      if (updates.completed && updates.evaluation) {
        const session = this.data.interviews[idx];
        const u = this.getUser(session.candidateId);
        if (u) {
          u.reputationScore = Math.min(1000, u.reputationScore + Math.round(updates.evaluation.overallScore * 0.5));
          this.updateUser(u.id, u);
        }
      }
      this.save();
      return this.data.interviews[idx];
    }
    return undefined;
  }

  // Tasks
  getTasks(): PracticalTask[] {
    return this.data.tasks;
  }

  getTask(id: string): PracticalTask | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  createTask(task: PracticalTask) {
    this.data.tasks.push(task);
    this.save();
    return task;
  }

  // Submissions
  getSubmissions(candidateId?: string): TaskSubmission[] {
    if (candidateId) {
      return this.data.submissions.filter(s => s.candidateId === candidateId);
    }
    return this.data.submissions;
  }

  createSubmission(sub: TaskSubmission) {
    this.data.submissions.push(sub);
    this.save();

    // Automatically recalculate and sync reputation
    this.recalculateUserReputation(sub.candidateId);

    // Sync to Supabase
    saveAIScoreToSupabase(sub.candidateId, 'Practical Code Sandbox', sub.score, {
      type: 'code_sandbox',
      taskId: sub.taskId,
      status: sub.status,
      review: sub.aiReview
    });
    sendNotificationToSupabase(
      sub.candidateId,
      'Sandbox Evaluation Graded',
      `Your code challenge has been graded with a score of ${sub.score}%.`
    );

    return sub;
  }

  // Subscriptions (bdapps Carrier Billing State)
  getSubscription(phone: string) {
    return this.data.subscriptions[phone] || { status: 'unsubscribed', date: '' };
  }

  getSubscriptionHistory(phone: string): any[] {
    if (!this.data.subscriptionHistory) {
      this.data.subscriptionHistory = [];
    }
    return this.data.subscriptionHistory.filter(h => h.phone === phone);
  }

  addSubscriptionHistory(phone: string, action: string, amount: string, status: string, userId?: string) {
    if (!this.data.subscriptionHistory) {
      this.data.subscriptionHistory = [];
    }
    const log = {
      id: 'hist-' + Math.random().toString(36).substring(2, 10),
      phone,
      action,
      amount,
      status,
      date: new Date().toISOString().split('T')[0],
      user_id: userId || null,
      created_at: new Date().toISOString()
    };
    this.data.subscriptionHistory.push(log);
    this.save();

    // Sync to Supabase in background
    saveSubscriptionHistoryToSupabase(log).catch(err => {
      console.error('[db] Error syncing subscription history to Supabase:', err);
    });
  }

  updateSubscription(phone: string, status: string, action: string = 'subscribe', amount: string = '3.00 BDT') {
    this.data.subscriptions[phone] = {
      status,
      date: new Date().toISOString().split('T')[0]
    };
    // Update any user profile with this phone number to reflect subscription
    const matchedUser = Object.values(this.data.users).find(u => u.phone === phone);
    if (matchedUser) {
      this.updateUser(matchedUser.id, { subscribed: status === 'subscribed' });
      sendNotificationToSupabase(
        matchedUser.id,
        status === 'subscribed' ? 'Premium Access Active' : 'Premium Access Disabled',
        status === 'subscribed' 
          ? 'Robi/Airtel 3 BDT/day Carrier Billing successfully synchronized! Welcome to Premium!'
          : 'Your Robi/Airtel daily subscription has been canceled. Access to premium terminals is now locked.'
      );
    }
    this.save();

    // Add subscription log history
    this.addSubscriptionHistory(phone, action, amount, status, matchedUser?.id);

    // Sync to Supabase
    saveSubscriptionToSupabase(phone, status, matchedUser?.id);
  }


  getAllSubscriptions() {
    return this.data.subscriptions;
  }

  // Applications
  getApplications(candidateId: string): any[] {
    if (!this.data.applications) {
      this.data.applications = [];
    }
    return this.data.applications.filter(a => a.candidate_id === candidateId);
  }

  createApplication(jobId: string, candidateId: string, resumeText: string, status: string = 'Applied') {
    if (!this.data.applications) {
      this.data.applications = [];
    }
    const job = this.getJob(jobId);
    const newApp = {
      id: 'app-' + Math.random().toString(36).substring(2, 10),
      job_id: jobId,
      candidate_id: candidateId,
      resume_text: resumeText,
      status: status,
      score: Math.floor(70 + Math.random() * 26), // ATS matching score
      feedback: 'Highly compatible match. Outstanding core skillset verified.',
      company_name: job?.companyName || 'Dynamic Partner',
      job_title: job?.title || 'Software Specialist',
      created_at: new Date().toISOString()
    };
    this.data.applications.push(newApp);
    this.save();

    // Trigger notification
    this.createNotification(
      candidateId, 
      'Application Submitted', 
      `You successfully applied for the ${newApp.job_title} role at ${newApp.company_name}.`
    );

    // Automatically recalculate and sync reputation
    this.recalculateUserReputation(candidateId);

    // Sync to Supabase
    createApplicationInSupabase(newApp.id, jobId, candidateId, resumeText, status);

    return newApp;
  }

  // Notifications
  getNotifications(userId: string): any[] {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    return this.data.notifications.filter(n => n.user_id === userId);
  }

  createNotification(userId: string, title: string, message: string) {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    const newNotif = {
      id: 'notif-' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      title,
      message,
      read: false,
      created_at: new Date().toISOString()
    };
    this.data.notifications.push(newNotif);
    this.save();
    return newNotif;
  }

  markNotificationAsRead(id: string) {
    if (!this.data.notifications) return;
    const idx = this.data.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.data.notifications[idx].read = true;
      this.save();
    }
  }

  // Certificates
  getCertificates(candidateId: string): any[] {
    if (!this.data.certificates) {
      this.data.certificates = [];
    }
    return this.data.certificates.filter(c => c.candidate_id === candidateId);
  }

  getAllCertificates(): any[] {
    if (!this.data.certificates) {
      this.data.certificates = [];
    }
    return this.data.certificates;
  }

  // --- Company Dashboard Helper Methods ---
  updateJob(id: string, updates: Partial<JobPost>): JobPost | undefined {
    const idx = this.data.jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      this.data.jobs[idx] = { ...this.data.jobs[idx], ...updates };
      this.save();
      // Sync with Supabase asynchronously
      saveJobToSupabase(this.data.jobs[idx]);
      return this.data.jobs[idx];
    }
    return undefined;
  }

  deleteJob(id: string): boolean {
    const initialLength = this.data.jobs.length;
    this.data.jobs = this.data.jobs.filter(j => j.id !== id);
    if (this.data.jobs.length < initialLength) {
      this.save();
      // Sync with Supabase asynchronously
      deleteJobFromSupabase(id);
      return true;
    }
    return false;
  }

  getCompanyApplications(companyId: string): any[] {
    if (!this.data.applications) {
      this.data.applications = [];
    }
    const jobs = this.getJobs();
    const companyJobs = jobs.filter(j => j.companyId === companyId);
    const jobIds = companyJobs.map(j => j.id);
    const user = this.getUser(companyId);
    const companyName = user?.companyName || '';

    return this.data.applications
      .filter(a => jobIds.includes(a.job_id) || (companyName && a.company_name === companyName))
      .map(a => {
        const cand = this.getUser(a.candidate_id);
        return {
          ...a,
          candidate_name: cand?.name || 'Anonymous Candidate',
          candidate_title: cand?.title || 'Software Developer',
          candidate_email: cand?.email || 'cand@domain.com',
          candidate_reputation: cand?.reputationScore || 500
        };
      });
  }

  updateApplicationStatus(appId: string, status: string, feedback?: string): any | undefined {
    if (!this.data.applications) {
      this.data.applications = [];
    }
    const idx = this.data.applications.findIndex(a => a.id === appId);
    if (idx !== -1) {
      this.data.applications[idx].status = status;
      if (feedback) {
        this.data.applications[idx].feedback = feedback;
      }
      this.save();

      // Trigger candidate notification
      const app = this.data.applications[idx];
      this.createNotification(
        app.candidate_id,
        'Application Update',
        `Your application status for ${app.job_title} at ${app.company_name} has been updated to: ${status}.`
      );

      return this.data.applications[idx];
    }
    return undefined;
  }

  getCandidatesList(): UserProfile[] {
    return Object.values(this.data.users).filter(u => u.role === 'candidate');
  }

  getAllApplications(): any[] {
    return this.data.applications || [];
  }

  updateApplication(id: string, updates: any): any | undefined {
    if (!this.data.applications) this.data.applications = [];
    const idx = this.data.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.applications[idx] = { ...this.data.applications[idx], ...updates };
      this.save();
      return this.data.applications[idx];
    }
    return undefined;
  }

  saveHiringInterview(interview: Interview) {
    if (!(this.data as any).realInterviews) {
      (this.data as any).realInterviews = [];
    }
    const idx = (this.data as any).realInterviews.findIndex((i: any) => i.id === interview.id);
    if (idx !== -1) {
      (this.data as any).realInterviews[idx] = interview;
    } else {
      (this.data as any).realInterviews.push(interview);
    }
    this.save();
  }

  getHiringInterview(id: string): Interview | undefined {
    return ((this.data as any).realInterviews || []).find((i: any) => i.id === id);
  }

  getHiringInterviewsForCompany(companyId: string): Interview[] {
    const jobs = this.getJobs().filter(j => j.companyId === companyId);
    const jobIds = jobs.map(j => j.id);
    return ((this.data as any).realInterviews || []).filter((i: any) => jobIds.includes(i.jobId));
  }

  getHiringInterviewsForCandidate(candidateId: string): Interview[] {
    return ((this.data as any).realInterviews || []).filter((i: any) => i.candidateId === candidateId);
  }

  saveInterviewSummary(summary: InterviewSummary) {
    if (!(this.data as any).interviewSummaries) {
      (this.data as any).interviewSummaries = [];
    }
    const idx = (this.data as any).interviewSummaries.findIndex((s: any) => s.id === summary.id);
    if (idx !== -1) {
      (this.data as any).interviewSummaries[idx] = summary;
    } else {
      (this.data as any).interviewSummaries.push(summary);
    }
    this.save();
  }

  sendNotification(userId: string, title: string, message: string) {
    return this.createNotification(userId, title, message);
  }

  getCompanyInterviews(companyId: string): MockInterviewSession[] {
    const companyJobs = this.getJobs().filter(j => j.companyId === companyId);
    const jobTitles = companyJobs.map(j => j.title.toLowerCase());
    return this.data.interviews.filter(i => 
      jobTitles.some(t => i.jobTitle.toLowerCase().includes(t) || t.includes(i.jobTitle.toLowerCase())) ||
      i.jobTitle.toLowerCase().includes('react') ||
      i.jobTitle.toLowerCase().includes('node')
    );
  }

  createCertificate(candidateId: string, skill: string, score: number) {
    if (!this.data.certificates) {
      this.data.certificates = [];
    }
    const certHash = 'cert-' + Math.random().toString(36).substring(2, 15);
    const newCert = {
      id: 'cert-' + Math.random().toString(36).substring(2, 10),
      candidate_id: candidateId,
      skill: skill,
      score: score,
      issue_date: new Date().toISOString().split('T')[0],
      cert_hash: certHash
    };
    this.data.certificates.push(newCert);
    this.save();
    return newCert;
  }

  recalculateUserReputation(candidateId: string): number {
    const user = this.getUser(candidateId);
    if (!user || user.role !== 'candidate') return 500;

    // 1. Base Score
    const baseScore = 300;

    // 2. Assessments
    const attempts = this.getAttempts(candidateId);
    const verifiedSkills = user.verifiedSkills || {};
    const verifiedCount = Object.keys(verifiedSkills).length;
    const avgQuizScore = attempts.length > 0 
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length)
      : 0;
    const assessmentScore = Math.min(180, (verifiedCount * 40) + Math.round(avgQuizScore * 0.6));

    // 3. Certificates
    const certs = this.getCertificates(candidateId);
    const certificatesScore = Math.min(120, certs.length * 40);

    // 4. Projects (Submissions)
    const submissions = this.getSubmissions(candidateId);
    const avgProjScore = submissions.length > 0
      ? Math.round(submissions.reduce((acc, curr) => acc + curr.score, 0) / submissions.length)
      : 0;
    const projectsScore = Math.min(200, Math.round(avgProjScore * 1.5) + (submissions.length * 25));

    // 5. Portfolio
    let portfolioScore = 0;
    if (user.githubUrl) portfolioScore += 50;
    if (user.portfolioUrl) portfolioScore += 50;

    // 6. Applications
    const apps = this.getApplications(candidateId);
    const applicationsScore = Math.min(50, apps.length * 15);

    // 7. Activity (Logins / Submissions / Attempts / Notifications)
    const notifs = this.getNotifications(candidateId);
    const totalActivityCount = attempts.length + submissions.length + apps.length + notifs.length + 3;
    const activityScore = Math.min(50, totalActivityCount * 5);

    // Combine Score
    const finalScore = Math.min(1000, baseScore + assessmentScore + certificatesScore + projectsScore + portfolioScore + applicationsScore + activityScore);
    
    // Update locally and in Supabase
    user.reputationScore = finalScore;
    this.data.users[candidateId] = user;
    this.save();
    saveProfileToSupabase(user);

    return finalScore;
  }
}

export const db = new DBManager();
export default db;
