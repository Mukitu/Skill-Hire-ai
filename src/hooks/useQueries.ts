import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, JobPost, SkillAssessment, AssessmentAttempt, PracticalTask, TaskSubmission, MockInterviewSession } from '../types';

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

export function useGenerateInterviewMutation() {
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
