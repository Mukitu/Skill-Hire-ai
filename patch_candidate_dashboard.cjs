const fs = require('fs');
let content = fs.readFileSync('src/components/CandidateDashboard.tsx', 'utf8');

// 1. Add import for useGenerateCertificateMutation
content = content.replace(
  "import { useJobs, useCandidateApplications, useApplyJobMutation } from '../hooks/useQueries';",
  "import { useJobs, useCandidateApplications, useApplyJobMutation } from '../hooks/useQueries';\nimport { useGenerateCertificateMutation } from '../hooks/useAI';"
);

// 2. Add mutation initialization
const mutationInit = `  const submitQuizMutation = useSubmitQuizMutation();
  const submittingQuiz = submitQuizMutation.isPending;`;
  
const newMutationInit = `  const submitQuizMutation = useSubmitQuizMutation();
  const submittingQuiz = submitQuizMutation.isPending;
  const generateCertificateMutation = useGenerateCertificateMutation();`;

content = content.replace(mutationInit, newMutationInit);

// 3. Modify success handler
const successHandler = `      onSuccess: async (data) => {
        if (data.status === 'success') {
          setQuizResult(data.attempt);
          setCompletedAttempts(prev => [...prev, data.attempt]);
          // Re-sync with backend profile & custom data
          await syncProfile();
          await fetchCandidateCustomData();
        }
      },`;

const newSuccessHandler = `      onSuccess: async (data) => {
        if (data.status === 'success') {
          setQuizResult(data.attempt);
          setCompletedAttempts(prev => [...prev, data.attempt]);
          
          // Generate certificate if passed (score >= 70)
          if (data.attempt.score >= 70) {
            generateCertificateMutation.mutate({
              candidateId: user.id,
              skillName: activeQuiz.title || 'Skill Assessment',
              score: data.attempt.score,
              difficultyLevel: 'Intermediate' // Or map from assessment
            });
          }

          // Re-sync with backend profile & custom data
          await syncProfile();
          await fetchCandidateCustomData();
        }
      },`;

content = content.replace(successHandler, newSuccessHandler);

fs.writeFileSync('src/components/CandidateDashboard.tsx', content);
