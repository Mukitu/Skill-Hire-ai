const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
  // AI Skill Passport: Generate Certificate
  app.post('/api/certificates/generate', async (req: Request, res: Response) => {
    try {
      const { candidateId, skillName, score, difficultyLevel } = req.body;
      
      const certificateId = 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const qrCodeUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://\${req.get('host')}/verify/\${certificateId}\`;
      
      const certificate = {
        id: certificateId,
        candidate_id: candidateId,
        skill_name: skillName,
        score: score,
        difficulty_level: difficultyLevel,
        issued_date: new Date().toISOString(),
        qr_code_url: qrCodeUrl
      };

      if (supabase) {
        const { error } = await supabase.from('certificates').insert([certificate]);
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
  app.get('/api/certificates/verify/:certificateId', async (req: Request, res: Response) => {
    try {
      const { certificateId } = req.params;
      
      if (supabase) {
        const { data, error } = await supabase.from('certificates').select('*').eq('id', certificateId).single();
        if (error) {
           return res.status(404).json({ error: 'Certificate not found' });
        }
        return res.json({ status: 'success', certificate: data });
      } else {
        return res.status(500).json({ error: 'Database not connected' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
`;

// Insert it right before "app.post('/api/jobs'," which is around line 362
const targetRoute = "  // Jobs: Create";
content = content.replace(targetRoute, newRoutes + "\n" + targetRoute);

fs.writeFileSync('server.ts', content);
