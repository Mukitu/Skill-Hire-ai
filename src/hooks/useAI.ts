import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, JobPost, SkillAssessment, PracticalTask, AIEvaluation, ResumeScanResult } from '../types';

/**
 * Hook 1: AI Job Matching
 */
export function useAIJobMatching() {
  return useMutation<{
    status: string;
    match: {
      matchPercentage: number;
      explanation: string;
      strengths: string[];
      gaps: string[];
      actionableSteps: string[];
    };
  }, Error, { candidateId: string; jobId: string }>({
    mutationFn: async ({ candidateId, jobId }) => {
      const res = await fetch('/api/ai/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId })
      });
      if (!res.ok) {
        throw new Error('Failed to generate AI job match calculation.');
      }
      return res.json();
    }
  });
}

/**
 * Hook 2: AI Skill Assessment Generation
 */
export function useAISkillAssessmentMutation() {
  const queryClient = useQueryClient();
  return useMutation<{
    status: string;
    assessment: SkillAssessment;
  }, Error, { skill: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' }>({
    mutationFn: async ({ skill, difficulty }) => {
      const res = await fetch('/api/ai/assessments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, difficulty })
      });
      if (!res.ok) {
        throw new Error('Failed to generate customized AI assessment questions.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    }
  });
}

/**
 * Hook 3: AI Task Generator
 */
export function useAITaskGeneratorMutation() {
  return useMutation<{
    status: string;
    task: PracticalTask;
  }, Error, { jobTitle: string; jobDescription: string; category: string; skills: string[] }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to generate personalized practical task.');
      }
      return res.json();
    }
  });
}

/**
 * Hook 4: AI Task Evaluation
 */
export function useAITaskEvaluationMutation() {
  return useMutation<{
    status: string;
    evaluation: AIEvaluation;
  }, Error, { taskDescription: string; submissionType: 'code' | 'github' | 'portfolio' | 'pdf'; submissionContent: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/tasks/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to perform automated AI evaluation of submission.');
      }
      return res.json();
    }
  });
}

/**
 * Hook 5: AI Reputation Score
 */
export function useAIReputationScore(candidateId?: string) {
  return useQuery<{
    status: string;
    data: {
      score: number;
      breakdown: {
        base: number;
        assessments: number;
        tasks: number;
        certificates: number;
        portfolio: number;
        activity: number;
      };
      badge: string;
      summary: string;
      githubConnected: boolean;
      portfolioConnected: boolean;
      verifiedCount: number;
      submissionCount: number;
    };
  }, Error>({
    queryKey: ['ai-reputation', candidateId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/reputation-score/${candidateId}`);
      if (!res.ok) {
        throw new Error('Failed to query dynamic AI reputation review.');
      }
      return res.json();
    },
    enabled: !!candidateId
  });
}

/**
 * Hook 6: AI Resume Analysis
 */
export function useAIResumeAnalysisMutation() {
  return useMutation<{
    status: string;
    analysis: ResumeScanResult;
  }, Error, { resumeText: string; jobRequirements?: string[] }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to parse and analyze CV.');
      }
      return res.json();
    }
  });
}

/**
 * Hook 7: AI Career Roadmap
 */
export function useAICareerRoadmapMutation() {
  return useMutation<{
    status: string;
    roadmap: {
      targetCareer: string;
      estimatedTimeframe: string;
      phases: Array<{
        phaseName: string;
        objective: string;
        skillsToAcquire: string[];
        projectMilestone: string;
        suggestedQuizzes: string[];
      }>;
      counselorAdvice: string;
    };
  }, Error, { skills: string[]; targetCareer: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to generate career intelligence roadmap.');
      }
      return res.json();
    }
  });
}

/**
 * Hook 8: AI Company Insights
 */
export function useAICompanyInsightsMutation() {
  return useMutation<{
    status: string;
    insights: {
      healthIndex: number;
      marketCompetitiveness: string;
      shortcomings: string[];
      improvedRequirements: string[];
      suggestedAssessmentTask: string;
      adviceForAttraction: string;
    };
  }, Error, { title: string; description: string; requirements: string[]; category: string }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/ai/company-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to extract recruiter company intelligence.');
      }
      return res.json();
    }
  });
}

export function useAIAuthenticityDetectionMutation() {
  return useMutation({
    mutationFn: async (payload: { submissionContent: string; previousSubmissionsContent?: string[] }) => {
      const res = await fetch('/api/submissions/auth/authenticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  });
}

export function useAICompanyReportMutation() {
  return useMutation({
    mutationFn: async (payload: { candidateData: any; assessmentData: any; submissionData: any }) => {
      const res = await fetch('/api/assessments/report/company-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  });
}

export function useGenerateCertificateMutation() {
  return useMutation({
    mutationFn: async (payload: { candidateId: string; skillName: string; score: number; difficultyLevel: string }) => {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  });
}

export function useVerifyCertificate(certificateId: string) {
  return useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: async () => {
      const res = await fetch(`/api/certificates/verify/${certificateId}`);
      if (!res.ok) throw new Error('Failed to verify certificate');
      return res.json();
    },
    enabled: !!certificateId
  });
}
