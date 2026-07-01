const fs = require('fs');
let content = fs.readFileSync('src/components/CompanyDashboard.tsx', 'utf8');

const target = `                  ) : (
                    <span className="text-xs text-slate-500 italic">No custom tags added.</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>`;

const replacement = `                  ) : (
                    <span className="text-xs text-slate-500 italic">No custom tags added.</span>
                  )}
                </div>
              </div>

              {/* AI Evaluator Tools */}
              <AICandidateReport candidate={selectedCandidate} />

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/CompanyDashboard.tsx', content);
