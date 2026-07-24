import React, { useState } from 'react';
import { Upload, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

// ============================================================================
// 12. PM MONITORING & EVALUATION (M&E) VIEW (Excel extraction uploader enabled)
// ============================================================================
export function PMMEView() {
  const [indicators, setIndicators] = useState([
    { id: '1', name: 'Children reached through feeding program', target: 500, actual: 420 },
    { id: '2', name: 'Youth trained in vocational tech skills', target: 150, actual: 162 },
    { id: '3', name: 'Indigenous trees planted in deforested areas', target: 2000, actual: 1850 },
    { id: '4', name: 'Outreach workshops conducted in rural Hubs', target: 20, actual: 18 }
  ]);

  const handleUpdateActual = (id, val) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, actual: parseInt(val, 10) || 0 } : ind));
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
          const parsed = lines.slice(1).map((row, idx) => {
            if (row.length < 3) return null;
            return {
              id: String(idx + 1),
              name: row[0].replace(/"/g, '').trim(),
              target: parseInt(row[1], 10) || 100,
              actual: parseInt(row[2], 10) || 0
            };
          }).filter(Boolean);

          if (parsed.length > 0) {
            setIndicators(parsed);
            Swal.fire('Data Imported!', `Successfully parsed ${parsed.length} indicators from CSV document.`, 'success');
          }
        } else {
          // XLSX/XLS Excel Parser
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 });

          const parsed = json.slice(1).map((row, idx) => {
            if (row.length < 3) return null;
            return {
              id: String(idx + 1),
              name: String(row[0]).trim(),
              target: parseInt(row[1], 10) || 100,
              actual: parseInt(row[2], 10) || 0
            };
          }).filter(Boolean);

          if (parsed.length > 0) {
            setIndicators(parsed);
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
    <div className="space-y-6 animate-fadeIn select-none font-normal text-xs text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-800">Monitoring & Evaluation (M&E) Trackers</h2>
          <p className="text-xs text-slate-400 font-normal">Extract indicators and target actual achievements from Excel spreadsheets.</p>
        </div>

        {/* Excel/CSV File dropzone input */}
        <div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs cursor-pointer font-normal">
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
        <h3 className="font-normal text-slate-855 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Activity size={16} className="text-slate-400" />
          <span>Active Program Performance Indicators</span>
        </h3>

        <div className="overflow-x-auto text-xs">
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
                const prog = Math.round((ind.actual / ind.target) * 100);
                const variance = ind.actual - ind.target;

                return (
                  <tr key={ind.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-normal text-slate-808">{ind.name}</td>
                    <td className="p-3 font-normal text-slate-500">{ind.target}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={ind.actual}
                        onChange={(e) => handleUpdateActual(ind.id, e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-xs font-normal"
                      />
                    </td>
                    <td className="p-3 font-normal text-slate-655">{prog}%</td>
                    <td className="p-3 font-normal text-slate-700">
                      {variance >= 0 ? `+${variance}` : variance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
