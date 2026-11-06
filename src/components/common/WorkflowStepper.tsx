import React from 'react';
import { Check, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { EventStatus } from '../../types';
import { workflowStages, getCurrentStageIndex, statusLabels } from '../../utils/helpers';

interface WorkflowStepperProps {
  status: EventStatus;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ status }) => {
  const currentStageIndex = getCurrentStageIndex(status);
  const isRejected = status.includes('REJECTED');
  const isRevision = status.includes('REVISION');
  const isConflict = status === 'FACILITY_CONFLICT';

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tiến trình Tiếp nhận và Phê duyệt
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Giai đoạn hiện tại: <span className="font-semibold text-slate-700">{workflowStages[currentStageIndex]?.name}</span>
          </p>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border self-start sm:self-auto ${statusLabels[status]?.bg} ${statusLabels[status]?.color} ${statusLabels[status]?.border}`}>
          {statusLabels[status]?.label}
        </div>
      </div>

      {/* Responsive Horizontal Stepper */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center min-w-[700px] justify-between relative px-2">
          {/* Background Connecting Line */}
          <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-slate-200 -z-0" />

          {workflowStages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            let circleClass = 'bg-slate-100 text-slate-400 border-2 border-slate-300';
            let icon = <span className="text-[11px] font-bold">{idx + 1}</span>;

            if (isCompleted) {
              circleClass = 'bg-[#009444] text-white border-2 border-[#009444]';
              icon = <Check className="w-3 h-3 stroke-[3]" />;
            } else if (isCurrent) {
              if (isRejected) {
                circleClass = 'bg-rose-600 text-white border-2 border-rose-600 ring-2 ring-rose-100';
                icon = <XCircle className="w-3 h-3" />;
              } else if (isRevision || isConflict) {
                circleClass = 'bg-[#F37021] text-white border-2 border-[#F37021] ring-2 ring-orange-100';
                icon = <AlertTriangle className="w-3 h-3" />;
              } else {
                circleClass = 'bg-[#005FAF] text-white border-2 border-[#005FAF] ring-2 ring-blue-100';
                icon = <Clock className="w-3 h-3 animate-pulse" />;
              }
            }

            return (
              <div key={stage.id} className="flex flex-col items-center relative z-10 text-center w-18">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${circleClass}`}>
                  {icon}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium leading-tight max-w-[75px] ${
                    isCurrent
                      ? isRejected
                        ? 'text-rose-600 font-bold'
                        : isRevision || isConflict
                        ? 'text-[#F37021] font-bold'
                        : 'text-[#005FAF] font-bold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
