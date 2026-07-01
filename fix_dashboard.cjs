const fs = require('fs');
let content = fs.readFileSync('src/components/CompanyDashboard.tsx', 'utf8');

// The replacement was:
//               </div>
// 
//               {/* AI Evaluator Tools */}
//               <AICandidateReport candidate={selectedCandidate} />
//

const badBlock = `              </div>

              {/* AI Evaluator Tools */}
              <AICandidateReport candidate={selectedCandidate} />`;

// Replace all back to original except the one we want. First, replace all with original.
content = content.split(badBlock).join('              </div>');

// Now, insert the one we want correctly. We want it right before:
const specificBlock = `                  ) : (
                    <span className="text-xs text-slate-500 italic">No custom tags added.</span>
                  )}
                </div>
              </div>`;

const newSpecificBlock = `                  ) : (
                    <span className="text-xs text-slate-500 italic">No custom tags added.</span>
                  )}
                </div>
              </div>
              
              {/* AI Evaluator Tools */}
              <AICandidateReport candidate={selectedCandidate} />`;

content = content.replace(specificBlock, newSpecificBlock);

fs.writeFileSync('src/components/CompanyDashboard.tsx', content);
