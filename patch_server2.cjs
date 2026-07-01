const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldVerify = `  // AI Skill Passport: Verify Certificate
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
  });`;

const newVerify = `  // AI Skill Passport: Verify Certificate
  app.get('/api/public/verify-certificate/:hash', async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (supabase) {
        // Find certificate
        const { data: certData, error: certError } = await supabase.from('certificates').select('*').eq('id', hash).single();
        if (certError) {
           return res.status(404).json({ status: 'error', message: 'Certificate not found' });
        }
        
        // Find candidate
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', certData.candidate_id).single();
        
        const candidate = {
          id: userData?.id,
          name: userData?.name || 'Unknown Candidate',
          email: userData?.email,
          title: userData?.title
        };

        const mappedCert = {
          id: certData.id,
          skill: certData.skill_name,
          score: certData.score,
          date: certData.issued_date,
          cert_hash: certData.id,
        };

        return res.json({ status: 'success', certificate: mappedCert, candidate: candidate });
      } else {
        return res.status(500).json({ status: 'error', message: 'Database not connected' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });`;

content = content.replace(oldVerify, newVerify);
fs.writeFileSync('server.ts', content);
