import { createClient } from '@supabase/supabase-js';
import { UserProfile, JobPost, SkillAssessment, AssessmentAttempt, MockInterviewSession, PracticalTask, TaskSubmission, JobApplication, Interview, InterviewSummary } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseServerConfigured = !!(supabaseUrl && supabaseKey);

export const supabaseServer = isSupabaseServerConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

if (!isSupabaseServerConfigured) {
  console.log('[Supabase Server] Environment variables not configured. Falling back to JSON database.');
} else {
  console.log('[Supabase Server] Connection established.');
}

// 1. Profiles & Companies
export async function saveProfileToSupabase(user: UserProfile) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        bio: user.bio || '',
        skills: user.skills || [],
        reputation_score: user.reputationScore || 500,
        verified_skills: user.verifiedSkills || {},
        subscribed: !!user.subscribed,
        phone: user.phone || null,
        github_url: user.githubUrl || null,
        portfolio_url: user.portfolioUrl || null,
        subscriber_id: user.subscriberId || null
      });

    if (error) throw error;

    // If company role, also ensure they exist in companies table
    if (user.role === 'company') {
      await supabaseServer
        .from('companies')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          company_name: user.companyName || 'Dynamic Startup',
          title: user.title || 'Hiring Manager',
          bio: user.bio || ''
        });
    }

    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save profile:', err);
    return null;
  }
}

export async function getProfileFromSupabase(id: string): Promise<UserProfile | null> {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
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
      githubUrl: data.github_url || undefined,
      portfolioUrl: data.portfolio_url || undefined,
      subscriberId: data.subscriber_id || undefined,
      companyName: data.role === 'company' ? 'Dynamic Startup' : undefined // will be fetched if needed
    };
  } catch (err) {
    console.error('[Supabase Server] Failed to get profile:', err);
    return null;
  }
}

// 2. Jobs
export async function saveJobToSupabase(job: JobPost) {
  if (!supabaseServer) return null;
  try {
    const payload: any = {
      id: job.id,
      company_id: job.companyId,
      company_name: job.companyName,
      title: job.title,
      department: job.department || 'Engineering',
      location: job.location || 'Remote',
      salary_range: job.salaryRange || 'Negotiable',
      description: job.description,
      requirements: job.requirements || [],
      skills_required: job.skillsRequired || [],
      tasks_count: job.tasksCount || 0,
      difficulty_level: job.difficultyLevel,
      required_skills_list: job.requiredSkillsList || [],
      optional_skills_list: job.optionalSkillsList || [],
      skill_matrix: job.skillMatrix || []
    };

    const { data, error } = await supabaseServer
      .from('jobs')
      .upsert(payload);

    if (error) {
      if (error.code === '42703') {
        console.warn('[Supabase Server] Custom AI columns missing in Supabase "jobs" table. Saving core fields only.');
        const { data: fallbackData, error: fallbackError } = await supabaseServer
          .from('jobs')
          .upsert({
            id: job.id,
            company_id: job.companyId,
            company_name: job.companyName,
            title: job.title,
            department: job.department || 'Engineering',
            location: job.location || 'Remote',
            salary_range: job.salaryRange || 'Negotiable',
            description: job.description,
            requirements: job.requirements || [],
            skills_required: job.skillsRequired || [],
            tasks_count: job.tasksCount || 0
          });
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save job:', err);
    return null;
  }
}

export async function deleteJobFromSupabase(id: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to delete job from Supabase:', err);
    return null;
  }
}

export async function getJobsFromSupabase(): Promise<JobPost[] | null> {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map(j => ({
      id: j.id,
      companyId: j.company_id,
      companyName: j.company_name,
      title: j.title,
      department: j.department,
      location: j.location,
      salaryRange: j.salary_range,
      description: j.description,
      requirements: j.requirements || [],
      skillsRequired: j.skills_required || [],
      tasksCount: j.tasks_count || 0,
      difficultyLevel: j.difficulty_level,
      requiredSkillsList: j.required_skills_list || [],
      optionalSkillsList: j.optional_skills_list || [],
      skillMatrix: j.skill_matrix || []
    }));
  } catch (err) {
    console.error('[Supabase Server] Failed to get jobs:', err);
    return null;
  }
}

// 3. Applications
export async function createApplicationInSupabase(appId: string, jobId: string, candidateId: string, resumeText: string, status: string = 'applied') {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('applications')
      .upsert({
        id: appId,
        job_id: jobId,
        candidate_id: candidateId,
        resume_text: resumeText,
        status: status,
        score: null,
        feedback: null,
        shortlisted: false
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save application:', err);
    return null;
  }
}

export async function updateApplicationInSupabase(id: string, updates: Partial<JobApplication>) {
  if (!supabaseServer) return null;
  try {
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.score !== undefined) payload.score = updates.score;
    if (updates.aiRanking !== undefined) payload.ai_ranking = updates.aiRanking;
    if (updates.shortlisted !== undefined) payload.shortlisted = updates.shortlisted;
    if (updates.matchScore !== undefined) payload.match_score = updates.matchScore;
    if (updates.feedback) payload.feedback = updates.feedback;

    const { data, error } = await supabaseServer
      .from('applications')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to update application:', err);
    return null;
  }
}

// 7. Interviews
export async function saveInterviewToSupabase(interview: Interview) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('interviews')
      .upsert({
        id: interview.id,
        job_id: interview.jobId,
        candidate_id: interview.candidateId,
        scheduled_at: interview.scheduledAt,
        status: interview.status,
        meeting_link: interview.meetingLink,
        meeting_type: interview.meetingType,
        difficulty_level: interview.difficultyLevel,
        questions: interview.questions
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save interview:', err);
    return null;
  }
}

export async function getInterviewsForCompany(companyId: string) {
  if (!supabaseServer) return [];
  try {
    // Join interviews with jobs to filter by companyId
    const { data, error } = await supabaseServer
      .from('interviews')
      .select('*, jobs!inner(company_id)')
      .eq('jobs.company_id', companyId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase Server] Failed to fetch interviews for company:', err);
    return [];
  }
}

export async function getInterviewsForCandidate(candidateId: string) {
  if (!supabaseServer) return [];
  try {
    const { data, error } = await supabaseServer
      .from('interviews')
      .select('*')
      .eq('candidate_id', candidateId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase Server] Failed to fetch interviews for candidate:', err);
    return [];
  }
}

export async function saveInterviewSummaryToSupabase(summary: InterviewSummary) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('interview_summaries')
      .upsert({
        id: summary.id,
        interview_id: summary.interviewId,
        strengths: summary.strengths,
        weaknesses: summary.weaknesses,
        recommendation: summary.recommendation,
        feedback: summary.feedback,
        overall_score: summary.overallScore
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save interview summary:', err);
    return null;
  }
}

// 4. Subscriptions
export async function saveSubscriptionToSupabase(phone: string, status: string, userId?: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('subscriptions')
      .upsert({
        id: 'sub-' + Math.random().toString(36).substring(2, 10),
        phone: phone,
        status: status,
        date: new Date().toISOString().split('T')[0],
        user_id: userId || null
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save subscription:', err);
    return null;
  }
}

export async function saveSubscriptionHistoryToSupabase(log: any) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('subscription_history')
      .insert({
        id: log.id,
        phone: log.phone,
        action: log.action,
        amount: log.amount,
        status: log.status,
        date: log.date,
        user_id: log.user_id
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save subscription history:', err);
    return null;
  }
}

export async function getSubscriptionHistoryFromSupabase(phone: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('subscription_history')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to get subscription history:', err);
    return null;
  }
}

// 5. AI Scores & Certificates
export async function saveAIScoreToSupabase(candidateId: string, skill: string, score: number, details: any) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('ai_scores')
      .insert({
        id: 'score-' + Math.random().toString(36).substring(2, 10),
        candidate_id: candidateId,
        skill: skill,
        score: score,
        details: details
      });

    if (error) throw error;

    // If score is high, also create certificate
    if (score >= 80) {
      const certHash = 'cert-' + Math.random().toString(36).substring(2, 15);
      await supabaseServer
        .from('certificates')
        .insert({
          id: 'cert-' + Math.random().toString(36).substring(2, 10),
          candidate_id: candidateId,
          skill: skill,
          score: score,
          issue_date: new Date().toISOString().split('T')[0],
          cert_hash: certHash
        });
    }

    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save AI Score:', err);
    return null;
  }
}

// 6. Notifications
export async function sendNotificationToSupabase(userId: string, title: string, message: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('notifications')
      .insert({
        id: 'notif-' + Math.random().toString(36).substring(2, 10),
        user_id: userId,
        title: title,
        message: message,
        read: false
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to save notification:', err);
    return null;
  }
}

export async function getApplicationsFromSupabase(candidateId: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('applications')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to fetch applications:', err);
    return null;
  }
}

export async function getNotificationsFromSupabase(userId: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to fetch notifications:', err);
    return null;
  }
}

export async function getCertificatesFromSupabase(candidateId: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('certificates')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to fetch certificates:', err);
    return null;
  }
}

export async function markNotificationAsReadInSupabase(id: string) {
  if (!supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Supabase Server] Failed to mark notification as read:', err);
    return null;
  }
}

export async function insertTaskSubmission(submission: TaskSubmission): Promise<any> {
  if (!isSupabaseServerConfigured || !supabaseServer) return null;
  try {
    const { data, error } = await supabaseServer
      .from('task_submissions')
      .insert({
        id: submission.id,
        task_id: submission.taskId,
        candidate_id: submission.candidateId,
        code: submission.code,
        status: submission.status,
        score: submission.score,
        ai_review: submission.aiReview,
        submission_type: submission.submissionType,
        github_url: submission.githubUrl,
        portfolio_url: submission.portfolioUrl,
        pdf_data_url: submission.pdfDataUrl,
        evaluation: submission.evaluation
      });
    if (error) {
      console.error('Supabase task_submissions insert error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase task_submissions insert exception:', err);
    return null;
  }
}

