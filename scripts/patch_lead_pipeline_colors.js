const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'leads', 'lead-workspace.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Horizontal Step labels in top tracker
const oldHorizontal = `<div className={\`grid \${isWonOrProject ? "grid-cols-8" : "grid-cols-7"} text-center text-[10px] font-semibold text-walnut pt-1 gap-1\`}>
                        <span className={isStep1Done ? "text-emerald-700 font-bold" : ""}>Created</span>
                        <span className={isStep2Done ? "text-emerald-700 font-bold" : isStep2Active ? "text-teal-700 font-bold" : ""}>Contacted</span>
                        <span className={isStep4Done ? "text-emerald-700 font-bold" : isStep4Active ? "text-purple-700 font-bold" : ""}>Visit Sched.</span>
                        <span className={isStep5Done ? "text-emerald-700 font-bold" : isStep5Active ? "text-cyan-700 font-bold" : ""}>Visit Done</span>
                        <span className={isStep6Done ? "text-emerald-700 font-bold" : isStep6Active ? "text-amber-700 font-bold" : ""}>Quote Prep</span>
                        <span className={isStep7Done ? "text-emerald-700 font-bold" : isStep7Active ? "text-emerald-700 font-bold" : ""}>Quote Sent</span>
                        <span className={isStep8Done ? "text-emerald-700 font-bold" : isStep8Active ? "text-indigo-700 font-bold" : ""}>Won / Close</span>
                        {isWonOrProject && (
                          <span className={isStep9Done ? "text-emerald-700 font-bold" : isStep9Active ? "text-emerald-600 font-bold" : ""}>Project</span>
                        )}
                      </div>`;

const newHorizontal = `<div className={\`grid \${isWonOrProject ? "grid-cols-8" : "grid-cols-7"} text-center text-[10px] font-semibold text-walnut pt-1 gap-1\`}>
                        <span className={isStep1Done ? "text-emerald-700 font-bold" : "text-walnut/60"}>Created</span>
                        <span className={isStep2Done ? "text-emerald-700 font-bold" : isStep2Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Contacted</span>
                        <span className={isStep4Done ? "text-emerald-700 font-bold" : isStep4Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Visit Sched.</span>
                        <span className={isStep5Done ? "text-emerald-700 font-bold" : isStep5Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Visit Done</span>
                        <span className={isStep6Done ? "text-emerald-700 font-bold" : isStep6Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Quote Prep</span>
                        <span className={isStep7Done ? "text-emerald-700 font-bold" : isStep7Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Quote Sent</span>
                        <span className={isStep8Done ? "text-emerald-700 font-bold" : isStep8Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Won / Close</span>
                        {isWonOrProject && (
                          <span className={isStep9Done ? "text-emerald-700 font-bold" : isStep9Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Project</span>
                        )}
                      </div>`;

if (content.includes(oldHorizontal)) {
  content = content.replace(oldHorizontal, newHorizontal);
  console.log('Replaced horizontal labels');
} else {
  console.log('Horizontal labels match failed');
}

// 2. Step 2 (Contacted)
const oldStep2 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-2 \${isStep2Done ? "bg-white border-emerald-200" : isStep2Active ? "bg-teal-50/40 border-teal-300 ring-1 ring-teal-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep3Done || isStep3Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep2Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep2Active ? "bg-teal-600 text-white ring-4 ring-teal-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep2Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep2Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-teal-50 text-teal-700 border-teal-200"}\`}>
                              {isStep2Done ? "✓ " : ""}2. CONTACTED
                            </span>
                            <span className="text-xs font-bold text-charcoal">Initial Outreach & Qualification</span>
                          </div>
                          {!isStep2Done ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStageChange("CONTACTED")}
                              className="text-xs py-1 h-6 border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100"
                            >
                              Mark Contacted
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </div>
                      </div>`;

const newStep2 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-2 \${isStep2Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep2Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep3Done || isStep3Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep2Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep2Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep2Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep2Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep2Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                              {isStep2Done ? "✓ " : ""}2. CONTACTED
                            </span>
                            <span className="text-xs font-bold text-charcoal">Initial Outreach &amp; Qualification</span>
                          </div>
                          {!isStep2Done ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStageChange("CONTACTED")}
                              className="text-xs py-1 h-6 border-amber-400 text-amber-900 bg-amber-100 hover:bg-amber-200 font-bold"
                            >
                              Mark Contacted
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </div>
                      </div>`;

if (content.includes(oldStep2)) {
  content = content.replace(oldStep2, newStep2);
  console.log('Replaced Step 2');
} else {
  console.log('Step 2 match failed');
}

// 3. Step 3 (Follow-up)
const oldStep3 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep3Done ? "bg-white border-emerald-200" : isStep3Active ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep4Done || isStep4Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep3Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep3Active ? "bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep3Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "3"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep3Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}\`}>
                              {isStep3Done ? "✓ " : ""}3. FOLLOW-UP SCHEDULED
                            </span>
                          </div>`;

const newStep3 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep3Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep3Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep4Done || isStep4Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep3Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep3Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep3Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "3"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep3Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep3Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                              {isStep3Done ? "✓ " : ""}3. FOLLOW-UP SCHEDULED
                            </span>
                          </div>`;

if (content.includes(oldStep3)) {
  content = content.replace(oldStep3, newStep3);
  console.log('Replaced Step 3');
} else {
  console.log('Step 3 match failed');
}

// 4. Step 4 (Site Visit Scheduled)
const oldStep4 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep4Done ? "bg-white border-emerald-200" : isStep4Active ? "bg-purple-50/40 border-purple-300 ring-1 ring-purple-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep5Done || isStep5Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep4Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep4Active ? "bg-purple-600 text-white ring-4 ring-purple-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep4Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "4"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep4Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-purple-50 text-purple-700 border-purple-200"}\`}>
                              {isStep4Done ? "✓ " : ""}4. SITE VISIT SCHEDULED
                            </span>
                          </div>`;

const newStep4 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep4Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep4Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep5Done || isStep5Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep4Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep4Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep4Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "4"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep4Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep4Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                              {isStep4Done ? "✓ " : ""}4. SITE VISIT SCHEDULED
                            </span>
                          </div>`;

if (content.includes(oldStep4)) {
  content = content.replace(oldStep4, newStep4);
  console.log('Replaced Step 4');
} else {
  console.log('Step 4 match failed');
}

// 5. Step 5 (Site Visit Completed)
const oldStep5 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep5Done ? "bg-white border-emerald-200" : isStep5Active ? "bg-cyan-50/40 border-cyan-300 ring-1 ring-cyan-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep6Done || isStep6Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep5Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep5Active ? "bg-cyan-600 text-white ring-4 ring-cyan-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep5Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "5"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep5Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-cyan-50 text-cyan-700 border-cyan-200"}\`}>
                              {isStep5Done ? "✓ " : ""}5. SITE VISIT COMPLETED
                            </span>
                            <span className="text-xs font-bold text-charcoal">On-Site Inspection & Measurement</span>
                          </div>`;

const newStep5 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep5Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep5Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep6Done || isStep6Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep5Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep5Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep5Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "5"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep5Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep5Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                              {isStep5Done ? "✓ " : ""}5. SITE VISIT COMPLETED
                            </span>
                            <span className="text-xs font-bold text-charcoal">On-Site Inspection &amp; Measurement</span>
                          </div>`;

if (content.includes(oldStep5)) {
  content = content.replace(oldStep5, newStep5);
  console.log('Replaced Step 5');
} else {
  console.log('Step 5 match failed');
}

// 6. Step 6 (Quotation In Progress)
const oldStep6 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep6Done ? "bg-white border-emerald-200" : isStep6Active ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep7Done || isStep7Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep6Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep6Active ? "bg-amber-600 text-white ring-4 ring-amber-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep6Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "6"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep6Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}\`}>
                              {isStep6Done ? "✓ " : ""}6. QUOTATION IN PROGRESS
                            </span>
                            <span className="text-xs font-bold text-charcoal">Cost Estimation & BOQ Drafting</span>
                          </div>`;

const newStep6 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep6Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep6Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep7Done || isStep7Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep6Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep6Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep6Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "6"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep6Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep6Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                              {isStep6Done ? "✓ " : ""}6. QUOTATION IN PROGRESS
                            </span>
                            <span className="text-xs font-bold text-charcoal">Cost Estimation &amp; BOQ Drafting</span>
                          </div>`;

if (content.includes(oldStep6)) {
  content = content.replace(oldStep6, newStep6);
  console.log('Replaced Step 6');
} else {
  console.log('Step 6 match failed');
}

// 7. Step 7 (Quotation Sent)
const oldStep7 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep7Done ? "bg-white border-emerald-200" : isStep7Active ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep8Done || isStep8Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep7Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep7Active ? "bg-emerald-600 text-white ring-4 ring-emerald-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep7Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "7"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep7Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}\`}>
                              {isStep7Done ? "✓ " : ""}7. QUOTATION SENT
                            </span>
                          </div>`;

const newStep7 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep7Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep7Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep8Done || isStep8Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep7Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep7Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep7Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "7"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep7Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep7Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                              {isStep7Done ? "✓ " : ""}7. QUOTATION SENT
                            </span>
                          </div>`;

if (content.includes(oldStep7)) {
  content = content.replace(oldStep7, newStep7);
  console.log('Replaced Step 7');
} else {
  console.log('Step 7 match failed');
}

// 8. Step 8 (Negotiation & Decision)
const oldStep8 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep8Done ? "bg-white border-emerald-200" : isStep8Active ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep9Done || isStep9Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep8Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep8Active ? "bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep8Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "8"}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep8Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}\`}>
                            {isStep8Done ? "✓ " : ""}8. NEGOTIATION & DECISION
                          </span>`;

const newStep8 = `<div className={\`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 \${isStep8Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep8Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}\`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={\`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 \${isStep9Done || isStep9Active ? "bg-emerald-500" : "bg-slate-200"}\`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep8Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep8Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}\`}>
                          {isStep8Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "8"}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${isStep8Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep8Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}\`}>
                            {isStep8Done ? "✓ " : ""}8. NEGOTIATION &amp; DECISION
                          </span>`;

if (content.includes(oldStep8)) {
  content = content.replace(oldStep8, newStep8);
  console.log('Replaced Step 8');
} else {
  console.log('Step 8 match failed');
}

// 9. Step 9 (Confirmation Fee & Project Creation)
const oldStep9 = `return (
                          <div
                            ref={step9Ref}
                            className={\`relative p-5 rounded-xl border transition-all shadow-2xs space-y-4 \${isStep9Done ? "bg-emerald-50/90 border-emerald-400" : "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200"}\`}
                          >
                            {/* Step Node Dot */}
                            <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-emerald-200 shadow-sm z-10">
                              {isStep9Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "9"}
                            </div>

                            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                <h4 className="text-xs font-bold text-emerald-900 uppercase">
                                  9. CONFIRMATION FEE &amp; PAYMENT INVOICES
                                </h4>
                              </div>`;

const newStep9 = `return (
                          <div
                            ref={step9Ref}
                            className={\`relative p-5 rounded-xl border transition-all shadow-2xs space-y-4 \${isStep9Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs"}\`}
                          >
                            {/* Step Node Dot */}
                            <div className={\`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 \${isStep9Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold"}\`}>
                              {isStep9Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "9"}
                            </div>

                            <div className={\`flex items-center justify-between border-b pb-2 \${isStep9Done ? "border-emerald-200" : "border-amber-300"}\`}>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className={\`w-4 h-4 \${isStep9Done ? "text-emerald-700" : "text-amber-700"}\`} />
                                <h4 className={\`text-xs font-bold uppercase \${isStep9Done ? "text-emerald-900" : "text-amber-950"}\`}>
                                  9. CONFIRMATION FEE &amp; PAYMENT INVOICES
                                </h4>
                              </div>`;

if (content.includes(oldStep9)) {
  content = content.replace(oldStep9, newStep9);
  console.log('Replaced Step 9');
} else {
  console.log('Step 9 match failed');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated lead-workspace.tsx');
