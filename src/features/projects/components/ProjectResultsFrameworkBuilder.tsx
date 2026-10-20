import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Activity,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileCheck,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StaffMemberOption } from '@/services/staffService';

export interface DraftActivityItem {
  id: string;
  code: string;
  title: string;
  description: string;
  activityDate: string;
  wardLocation: string;
  targetParticipants: number;
  budgetEstimated: number;
  assignedStaffId: string;
  procurementRequired: boolean;
}

export interface DraftOutputItem {
  id: string;
  code: string;
  title: string;
  description: string;
  targetQuantity: number;
  targetUnit: string;
  activities: DraftActivityItem[];
}

export interface DraftOutcomeItem {
  id: string;
  code: string;
  title: string;
  description: string;
  targetIndicator: string;
  outputs: DraftOutputItem[];
}

interface ProjectResultsFrameworkBuilderProps {
  outcomes: DraftOutcomeItem[];
  onChange: (outcomes: DraftOutcomeItem[]) => void;
  staffList: StaffMemberOption[];
  currency?: string;
}

export const ProjectResultsFrameworkBuilder: React.FC<ProjectResultsFrameworkBuilderProps> = ({
  outcomes,
  onChange,
  staffList,
  currency = 'TZS',
}) => {
  const [expandedOutcomes, setExpandedOutcomes] = useState<Record<string, boolean>>({
    [outcomes[0]?.id || 'out-1']: true,
  });

  const toggleOutcome = (outcomeId: string) => {
    setExpandedOutcomes((prev) => ({ ...prev, [outcomeId]: !prev[outcomeId] }));
  };

  // Outcome CRUD
  const handleAddOutcome = () => {
    const outcomeNum = outcomes.length + 1;
    const newOutcomeId = `out-${Date.now()}`;
    const newOutcome: DraftOutcomeItem = {
      id: newOutcomeId,
      code: `OUT-${outcomeNum}`,
      title: `Strategic Outcome ${outcomeNum}`,
      description: '',
      targetIndicator: '',
      outputs: [
        {
          id: `outp-${Date.now()}-1`,
          code: `OUTP-${outcomeNum}.1`,
          title: `Direct Output ${outcomeNum}.1`,
          description: '',
          targetQuantity: 100,
          targetUnit: 'beneficiaries',
          activities: [
            {
              id: `act-${Date.now()}-1`,
              code: `ACT-${outcomeNum}.1.1`,
              title: `Community Implementation Activity`,
              description: '',
              activityDate: new Date().toISOString().slice(0, 10),
              wardLocation: 'Temeke',
              targetParticipants: 50,
              budgetEstimated: 2500000,
              assignedStaffId: staffList[0]?.id || '',
              procurementRequired: true,
            },
          ],
        },
      ],
    };

    onChange([...outcomes, newOutcome]);
    setExpandedOutcomes((prev) => ({ ...prev, [newOutcomeId]: true }));
  };

  const handleUpdateOutcome = (index: number, key: keyof DraftOutcomeItem, val: string) => {
    const updated = outcomes.map((o, i) => (i === index ? { ...o, [key]: val } : o));
    onChange(updated);
  };

  const handleRemoveOutcome = (index: number) => {
    onChange(outcomes.filter((_, i) => i !== index));
  };

  // Output CRUD
  const handleAddOutput = (outcomeIndex: number) => {
    const outcome = outcomes[outcomeIndex];
    const outputNum = outcome.outputs.length + 1;
    const newOutput: DraftOutputItem = {
      id: `outp-${Date.now()}`,
      code: `${outcome.code}.${outputNum}`,
      title: `Deliverable Output ${outputNum}`,
      description: '',
      targetQuantity: 50,
      targetUnit: 'deliverables',
      activities: [],
    };

    const updated = outcomes.map((o, i) =>
      i === outcomeIndex ? { ...o, outputs: [...o.outputs, newOutput] } : o
    );
    onChange(updated);
  };

  const handleUpdateOutput = (
    outcomeIndex: number,
    outputIndex: number,
    key: keyof DraftOutputItem,
    val: unknown
  ) => {
    const updated = outcomes.map((o, oIdx) => {
      if (oIdx !== outcomeIndex) return o;
      const newOutputs = o.outputs.map((outp, outIdx) =>
        outIdx === outputIndex ? { ...outp, [key]: val } : outp
      );
      return { ...o, outputs: newOutputs };
    });
    onChange(updated);
  };

  const handleRemoveOutput = (outcomeIndex: number, outputIndex: number) => {
    const updated = outcomes.map((o, oIdx) => {
      if (oIdx !== outcomeIndex) return o;
      return { ...o, outputs: o.outputs.filter((_, outIdx) => outIdx !== outputIndex) };
    });
    onChange(updated);
  };

  // Activity CRUD
  const handleAddActivity = (outcomeIndex: number, outputIndex: number) => {
    const outcome = outcomes[outcomeIndex];
    const output = outcome.outputs[outputIndex];
    const actNum = output.activities.length + 1;

    const newAct: DraftActivityItem = {
      id: `act-${Date.now()}`,
      code: `${output.code}.${actNum}`,
      title: `Field Session / Activity ${actNum}`,
      description: '',
      activityDate: new Date().toISOString().slice(0, 10),
      wardLocation: 'Kigamboni',
      targetParticipants: 30,
      budgetEstimated: 1500000,
      assignedStaffId: staffList[0]?.id || '',
      procurementRequired: false,
    };

    const updated = outcomes.map((o, oIdx) => {
      if (oIdx !== outcomeIndex) return o;
      const newOutputs = o.outputs.map((outp, outIdx) => {
        if (outIdx !== outputIndex) return outp;
        return { ...outp, activities: [...outp.activities, newAct] };
      });
      return { ...o, outputs: newOutputs };
    });
    onChange(updated);
  };

  const handleUpdateActivity = (
    outcomeIndex: number,
    outputIndex: number,
    actIndex: number,
    key: keyof DraftActivityItem,
    val: unknown
  ) => {
    const updated = outcomes.map((o, oIdx) => {
      if (oIdx !== outcomeIndex) return o;
      const newOutputs = o.outputs.map((outp, outIdx) => {
        if (outIdx !== outputIndex) return outp;
        const newActivities = outp.activities.map((act, aIdx) =>
          aIdx === actIndex ? { ...act, [key]: val } : act
        );
        return { ...outp, activities: newActivities };
      });
      return { ...o, outputs: newOutputs };
    });
    onChange(updated);
  };

  const handleRemoveActivity = (
    outcomeIndex: number,
    outputIndex: number,
    actIndex: number
  ) => {
    const updated = outcomes.map((o, oIdx) => {
      if (oIdx !== outcomeIndex) return o;
      const newOutputs = o.outputs.map((outp, outIdx) => {
        if (outIdx !== outputIndex) return outp;
        return { ...outp, activities: outp.activities.filter((_, aIdx) => aIdx !== actIndex) };
      });
      return { ...o, outputs: newOutputs };
    });
    onChange(updated);
  };

  const totalActivitiesCount = outcomes.reduce(
    (sum, o) => sum + o.outputs.reduce((s2, outp) => s2 + outp.activities.length, 0),
    0
  );

  const totalEstimatedActivityBudget = outcomes.reduce(
    (sum, o) =>
      sum +
      o.outputs.reduce(
        (s2, outp) => s2 + outp.activities.reduce((s3, a) => s3 + (Number(a.budgetEstimated) || 0), 0),
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-forest-50/50 border border-forest-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-forest-950 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-forest-700" />
            <span>Results Framework &amp; Activity Planning Hierarchy</span>
          </h2>
          <p className="text-xs text-charcoal-muted mt-1 max-w-2xl">
            Structure your project into measurable <strong>Outcomes</strong>, tangible <strong>Outputs</strong>,
            and operational <strong>Activities</strong>. Each activity will become the central operational record
            connecting requisitions, attendance, verified M&amp;E indicators, and financial retirement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-charcoal-muted block">Total Activities</span>
            <span className="font-bold text-sm text-forest-900">{totalActivitiesCount} Planned</span>
          </div>
          <div className="h-8 w-px bg-forest-200" />
          <div className="text-right">
            <span className="text-[11px] font-semibold text-charcoal-muted block">Allocated Budget</span>
            <span className="font-bold text-sm text-forest-900 font-mono">
              {currency} {totalEstimatedActivityBudget.toLocaleString()}
            </span>
          </div>
          <Button size="sm" onClick={handleAddOutcome} className="ml-2">
            <Plus className="w-4 h-4 mr-1" /> Add Outcome
          </Button>
        </div>
      </div>

      {/* Hierarchy Outcomes List */}
      <div className="space-y-6">
        {outcomes.length === 0 && (
          <Card className="p-8 text-center bg-slate-50 border-dashed border-slate-300">
            <FolderTree className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">No Results Hierarchy Configured</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Add at least one Strategic Outcome to begin structuring project activities and operational workflows.
            </p>
            <Button size="sm" onClick={handleAddOutcome}>
              <Plus className="w-4 h-4 mr-1" /> Add First Outcome
            </Button>
          </Card>
        )}

        {outcomes.map((outcome, oIdx) => {
          const isExpanded = !!expandedOutcomes[outcome.id];

          return (
            <div
              key={outcome.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition hover:border-forest-300"
            >
              {/* Level 1: OUTCOME HEADER */}
              <div
                className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                onClick={() => toggleOutcome(outcome.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-64">
                  <button type="button" className="text-slate-500 hover:text-slate-800 p-0.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-forest-100 text-forest-800 uppercase">
                    {outcome.code}
                  </span>
                  <input
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-forest-600 focus:bg-white focus:outline-none px-1.5 py-0.5 rounded flex-1"
                    value={outcome.title}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateOutcome(oIdx, 'title', e.target.value)}
                    placeholder="e.g. Outcome 1: Increased adolescent access to vocational livelihoods"
                  />
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant="default" className="text-[10px]">
                    {outcome.outputs.length} Outputs
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 py-0"
                    onClick={() => handleAddOutput(oIdx)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Output
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleRemoveOutcome(oIdx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Delete Outcome"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* LEVEL 2 & 3 BODY (Outputs & Activities) */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-5 bg-white">
                  {/* Outcome Description & Primary Indicator */}
                  <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-lg bg-slate-50/50 border border-slate-100 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Outcome Description &amp; Theory of Change
                      </label>
                      <input
                        className="w-full text-xs rounded-md border border-slate-300 p-1.5 bg-white"
                        value={outcome.description}
                        onChange={(e) => handleUpdateOutcome(oIdx, 'description', e.target.value)}
                        placeholder="Expected systemic or behavioral change resulting from this project"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Primary Strategic Indicator
                      </label>
                      <input
                        className="w-full text-xs rounded-md border border-slate-300 p-1.5 bg-white"
                        value={outcome.targetIndicator}
                        onChange={(e) => handleUpdateOutcome(oIdx, 'targetIndicator', e.target.value)}
                        placeholder="e.g. % of targeted youth actively employed 6 months post-training"
                      />
                    </div>
                  </div>

                  {/* Outputs List under this Outcome */}
                  <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-forest-200">
                    {outcome.outputs.map((output, outIdx) => (
                      <div
                        key={output.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 space-y-3"
                      >
                        {/* Output Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {output.code}
                            </span>
                            <input
                              className="font-semibold text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-forest-600 focus:bg-white focus:outline-none px-1 py-0.5 rounded flex-1"
                              value={output.title}
                              onChange={(e) => handleUpdateOutput(oIdx, outIdx, 'title', e.target.value)}
                              placeholder="e.g. Output 1.1: 500 vulnerable youth complete accredited courses"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-slate-400">Target:</span>
                              <input
                                type="number"
                                className="w-16 text-xs p-1 rounded border border-slate-300 font-mono"
                                value={output.targetQuantity}
                                onChange={(e) =>
                                  handleUpdateOutput(oIdx, outIdx, 'targetQuantity', Number(e.target.value))
                                }
                              />
                              <input
                                className="w-20 text-xs p-1 rounded border border-slate-300"
                                value={output.targetUnit}
                                onChange={(e) => handleUpdateOutput(oIdx, outIdx, 'targetUnit', e.target.value)}
                                placeholder="unit"
                              />
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6 px-2 py-0 text-forest-700"
                              onClick={() => handleAddActivity(oIdx, outIdx)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Activity
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleRemoveOutput(oIdx, outIdx)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Delete Output"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Level 3: Activities Nested under Output */}
                        <div className="space-y-2 pt-1">
                          {output.activities.length === 0 && (
                            <p className="text-[11px] text-slate-400 italic py-1">
                              No activities planned under this output yet. Click &quot;Add Activity&quot; to define operational work.
                            </p>
                          )}

                          {output.activities.map((act, aIdx) => (
                            <div
                              key={act.id}
                              className="p-3 rounded-lg border border-slate-200 bg-slate-50/30 grid gap-2.5 sm:grid-cols-6 items-center text-xs"
                            >
                              <div className="sm:col-span-2 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-bold text-forest-700 bg-forest-50 px-1 py-0.5 rounded">
                                    {act.code}
                                  </span>
                                  <input
                                    className="font-semibold text-xs text-slate-900 rounded border border-slate-300 p-1 flex-1"
                                    value={act.title}
                                    onChange={(e) =>
                                      handleUpdateActivity(oIdx, outIdx, aIdx, 'title', e.target.value)
                                    }
                                    placeholder="Activity Title"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" /> Date
                                </label>
                                <input
                                  type="date"
                                  className="w-full text-xs p-1 rounded border border-slate-300"
                                  value={act.activityDate}
                                  onChange={(e) =>
                                    handleUpdateActivity(oIdx, outIdx, aIdx, 'activityDate', e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" /> Ward / Venue
                                </label>
                                <input
                                  className="w-full text-xs p-1 rounded border border-slate-300"
                                  value={act.wardLocation}
                                  onChange={(e) =>
                                    handleUpdateActivity(oIdx, outIdx, aIdx, 'wardLocation', e.target.value)
                                  }
                                  placeholder="e.g. Temeke"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-slate-400" /> Target / Lead
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    className="w-12 text-xs p-1 rounded border border-slate-300 font-mono"
                                    value={act.targetParticipants}
                                    onChange={(e) =>
                                      handleUpdateActivity(
                                        oIdx,
                                        outIdx,
                                        aIdx,
                                        'targetParticipants',
                                        Number(e.target.value)
                                      )
                                    }
                                    title="Target participants"
                                  />
                                  <select
                                    className="flex-1 text-[11px] p-1 rounded border border-slate-300 bg-white"
                                    value={act.assignedStaffId}
                                    onChange={(e) =>
                                      handleUpdateActivity(oIdx, outIdx, aIdx, 'assignedStaffId', e.target.value)
                                    }
                                  >
                                    <option value="">Select Staff</option>
                                    {staffList.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.displayName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <div>
                                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-slate-400" /> Budget ({currency})
                                  </label>
                                  <input
                                    type="number"
                                    className="w-24 text-xs p-1 rounded border border-slate-300 font-mono"
                                    value={act.budgetEstimated}
                                    onChange={(e) =>
                                      handleUpdateActivity(
                                        oIdx,
                                        outIdx,
                                        aIdx,
                                        'budgetEstimated',
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveActivity(oIdx, outIdx, aIdx)}
                                  className="text-slate-400 hover:text-red-600 p-1 mt-4"
                                  title="Delete Activity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
