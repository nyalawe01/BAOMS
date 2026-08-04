import React, { useState } from 'react';
import { Upload, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useProject } from '../../context/ProjectContext';

// ============================================================================
// 12. PM MONITORING & EVALUATION (M&E) VIEW (Excel extraction uploader enabled)
// ============================================================================
export function PMMEView() {
  const { indicators, addIndicator, updateIndicator } = useProject();
  const [achievedDrafts, setAchievedDrafts] = useState({});

  const handleAchievedChange = (id, value) => {
    setAchievedDrafts(prev => ({ ...prev, [id]: value }));
  };

  const handleAchievedCommit = (ind) => {
    if (achievedDrafts[ind.id] === undefined) return;
    const parsed = parseInt(achievedDrafts[ind.id], 10) || 0;
    setAchievedDrafts(prev => {
      const next = { ...prev };
      delete next[ind.id];
      return next;
    });
    if (parsed !== (ind.achieved || 0)) {
      updateIndicator(ind.id, { achieved: parsed });
    }
  };

  // Persist parsed spreadsheet rows: update the matching indicator by name, or create a new one
  const persistParsedIndicators = (parsed) => {
    parsed.forEach((row) => {
      const existing = indicators.find(
        (ind) => (ind.name || '').trim().toLowerCase() === row.name.trim().toLowerCase()
      );
      if (existing) {
        updateIndicator(existing.id, { target: row.target, achieved: row.actual });
      } else {
        addIndicator({
          name: row.name,
          description: '',
          target: row.target,
          achieved: row.actual,
          unit: '',
          projectId: ''
        });
      }
    });
  };

  // Excel/CSV Document parser & data extraction
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isCsv = file.name.endsWith('.csv');

    reader.onload = (evt) => {
      try {
        if (isCsv) {
          // CSV Parser
          const text = evt.target.result;
          const lines = text.split('\n').map(l => l.split(','));
          const parsed = lines.slice(1).map((row) => {
            if (row.length < 3) return null;
            return {
              name: row[0].replace(/"/g, '').trim(),
              target: parseInt(row[1], 10) || 100,
              actual: parseInt(row[2], 10) || 0
            };
          }).filter(Boolean);

          if (parsed.length > 0) {
            persistParsedIndicators(parsed);
            Swal.fire('Data Imported!', `Successfully parsed ${parsed.length} indicators from CSV document.`, 'success');
          }
        } else {
          // XLSX/XLS Excel Parser
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 });

          const parsed = json.slice(1).map((row) => {
            if (row.length < 3) return null;
            return {
              name: String(row[0]).trim(),
              target: parseInt(row[1], 10) || 100,
              actual: parseInt(row[2], 10) || 0
            };
          }).filter(Boolean);

          if (parsed.length > 0) {
            persistParsedIndicators(parsed);
            Swal.fire('Excel Data Extracted!', `Successfully parsed ${parsed.length} indicators from sheet.`, 'success');
          }
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Extraction Failure', 'Failed to extract M&E data. Check structure (Header: Indicator, Target, Actual).', 'error');
      }
    };

    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none font-normal text-sm text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-normal text-slate-800">Monitoring & Evaluation (M&E) Trackers</h2>
          <p className="text-sm text-slate-400 font-normal">Extract indicators and target actual achievements from Excel spreadsheets.</p>
        </div>

        {/* Excel/CSV File dropzone input */}
        <div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm cursor-pointer font-normal">
            <Upload size={12} />
            <span>Upload Indicator Sheet (.xlsx/.csv)</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelUpload}
            />
          </label>
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-normal text-slate-855 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
          <Activity size={16} className="text-slate-400" />
          <span>Active Program Performance Indicators</span>
        </h3>

        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Performance Indicator</th>
                <th className="p-3">Target</th>
                <th className="p-3">Actual Achieved</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal text-slate-700">
              {indicators.map(ind => {
                const target = ind.target || 0;
                const achieved = ind.achieved || 0;
                const prog = target > 0 ? Math.round((achieved / target) * 100) : 0;
                const variance = achieved - target;
                const draftValue = achievedDrafts[ind.id] !== undefined ? achievedDrafts[ind.id] : achieved;

                return (
                  <tr key={ind.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-normal text-slate-808">{ind.name}</td>
                    <td className="p-3 font-normal text-slate-500">{target}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={draftValue}
                        onChange={(e) => handleAchievedChange(ind.id, e.target.value)}
                        onBlur={() => handleAchievedCommit(ind)}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm font-normal"
                      />
                    </td>
                    <td className="p-3 font-normal text-slate-655">{prog}%</td>
                    <td className="p-3 font-normal text-slate-700">
                      {variance >= 0 ? `+${variance}` : variance}
                    </td>
                  </tr>
                );
              })}
              {indicators.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 italic font-normal">No indicators registered yet. Upload a spreadsheet to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
