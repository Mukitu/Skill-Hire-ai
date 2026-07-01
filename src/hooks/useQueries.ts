import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, JobPost, SkillAssessment, AssessmentAttempt, PracticalTask, TaskSubmission, MockInterviewSession, Interview, InterviewSummary } from '../types';

// Fetchers
const fetchAssessments = async (): Promise<SkillAssessment[]> => {
  const res = await fetch('/api/assessments');
  const data = await res.json();
  return data.assessments || [];
};

const fetchTasks = async (): Promise<PracticalTask[]> => {
  const res = await fetch('/api/tasks');
  const data = await res.json();
  return data.tasks || [];
};

const fetchJobs = async (): Promise<JobPost[]> => {
  const res = await fetch('/api/jobs');
  const data = await res.json();
  return data.jobs || [];
};

// Queries
export function useAssessments() {
  return useQuery<SkillAssessment[]>({
    queryKey: ['assessments'],
    queryFn: fetchAssessments,
  });
}

export function useTasks() {
  return useQuery<PracticalTask[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });
}

export function useJobs() {
  return useQuery<JobPost[]>({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });
}

// Mutations
export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, Partial<JobPost>>({
    mutationFn: async (newJob) => {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      }
    },
  });
}

export function useGenerateJobTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { title: string; description: string; category: string; skills: string[] }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/tasks/generate-for-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    }
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, Partial<PracticalTask>>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

export function useGenerateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { skills: string[] }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
  });
}

export function useGenerateCustomQuizMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { skill: string; difficulty: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/assessments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
      }
    },
  });
}

export function useSubmitQuizMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { candidateId: string; assessmentId: string; answers: Record<string, number> }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });
}

export function useGenerateMockInterviewMutation() {
  return useMutation<any, Error, { candidateId: string; jobTitle: string; candidateProfile: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/interviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
  });
}

export function useEvaluateInterviewMutation() {
  return useMutation<any, Error, { id: string; answers: Record<number, string> }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/interviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
  });
}

export function useSubmitCodeMutation() {
  return useMutation<any, Error, { taskId: string; candidateId: string; code?: string; submissionType?: string; githubUrl?: string; portfolioUrl?: string; pdfDataUrl?: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
  });
}

export function useGenerateCertificateMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { candidateId: string; skillName: string; score: number; difficultyLevel: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
      }
    },
  });
}

export function useScanResumeMutation() {
  return useMutation<any, Error, { resumeText: string; jobRequirements: string[] }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
  });
}

export function useRankCandidatesMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { jobId: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/rank-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useShortlistCandidatesMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { jobId: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useGenerateInterviewMutation() {
  return useMutation<any, Error, { jobId: string; candidateId: string; difficulty: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/generate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
  });
}

export function useScheduleInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { 
    jobId: string; 
    candidateId: string; 
    scheduledAt: string; 
    meetingType: string; 
    meetingLink: string; 
    difficultyLevel: string;
    questions: string[];
  }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useSubmitInterviewSummaryMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { interviewId: string; feedback: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/interview-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useInterviewsQuery(role: 'company' | 'candidate', id: string) {
  return useQuery<Interview[]>({
    queryKey: ['interviews', role, id],
    queryFn: async () => {
      const res = await fetch(`/api/interviews/${role}/${id}`);
      const data = await res.json();
      return data.interviews || [];
    },
    enabled: !!id,
  });
}
