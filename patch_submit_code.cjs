const fs = require('fs');
let content = fs.readFileSync('src/components/CandidateDashboard.tsx', 'utf8');

const target = `      onSuccess: async (data) => {
        if (data.status === 'success') {
          setSandboxFeedback(data.submission);
          await syncProfile();
          await fetchCandidateCustomData();
        }
      },`;

const replacement = `      onSuccess: async (data) => {
        if (data.status === 'success') {
          setSandboxFeedback(data.submission);
          
          // Generate certificate if passed practical task (score >= 70)
          if (data.submission?.evaluation?.score >= 70) {
            generateCertificateMutation.mutate({
              candidateId: user.id,
              skillName: activeTask.title || 'Practical Task',
              score: data.submission.evaluation.score,
              difficultyLevel: 'Advanced' // Practical tasks are generally Advanced
            });
          }

          await syncProfile();
          await fetchCandidateCustomData();
        }
      },`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/CandidateDashboard.tsx', content);
