import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  MapPin, Radio, Wifi, WifiOff
} from 'lucide-react';

export function FieldOfficerView() {
  const { offlineSubmissions, submitOfflineForm } = useProject();
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Form details
  const [activityNotes, setActivityNotes] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [gpsSimulated, setGpsSimulated] = useState({ latitude: -1.2921, longitude: 36.8219 });
  const [cachedSubmissions, setCachedSubmissions] = useState([]);

  // Generate simulated random GPS coords
  const handleRandomizeGPS = () => {
    setGpsSimulated({
      latitude: -1.2921 + (Math.random() - 0.5) * 0.05,
      longitude: 36.8219 + (Math.random() - 0.5) * 0.05
    });
  };

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    if (!activityNotes) return;

    const payload = {
      id: 'sub_' + Date.now(),
      userName: 'Fred Tracker',
      gpsLocation: gpsSimulated,
      photoUrl: photoName || 'captured_kajiado_well.jpg',
      activityNotes,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    if (offlineMode) {
      // Offline: Cache in local component/localStorage array
      const updatedCache = [payload, ...cachedSubmissions];
      setCachedSubmissions(updatedCache);
      localStorage.setItem('oms_field_cache', JSON.stringify(updatedCache));
      alert('Network Offline: Report successfully cached in LocalStorage. It will sync automatically when network connectivity is restored.');
    } else {
      // Online: Submit directly to the Project Context Database
      submitOfflineForm(gpsSimulated, activityNotes, photoName);
    }

    setActivityNotes('');
    setPhotoName('');
  };

  const handleSyncCache = () => {
    if (offlineMode) {
      alert('Cannot sync: Disable offline mode first to restore network connectivity.');
      return;
    }
    
    // Sync all cached items to project context
    cachedSubmissions.forEach(sub => {
      submitOfflineForm(sub.gpsLocation, sub.activityNotes, sub.photoUrl);
    });

    setCachedSubmissions([]);
    localStorage.removeItem('oms_field_cache');
    alert('Database Synchronized: Synced all offline cached reports with Firestore documents.');
  };

  // Load cache on start
  useEffect(() => {
    const savedCache = localStorage.getItem('oms_field_cache');
    if (savedCache) {
      setCachedSubmissions(JSON.parse(savedCache));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radio className="text-emerald-400 animate-pulse" />
            <span>Offline-Capable Field Surveyor Form</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">Caches geolocation logs and surveys inside local client databases. Syncs up to central cloud once connections recover.</p>
        </div>

        {/* Offline Simulation Toggle */}
        <button 
          onClick={() => setOfflineMode(!offlineMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
            offlineMode 
              ? 'bg-amber-600 border border-amber-500 text-white animate-bounce' 
              : 'bg-emerald-600 border border-emerald-500 text-white'
          }`}
        >
          {offlineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
          <span>{offlineMode ? 'Simulating: OFFLINE' : 'Simulating: ONLINE'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Survey Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">Collect Survey Data</h3>
          
          <form onSubmit={handleFieldSubmit} className="space-y-3">
            <div className="bg-slate-50 rounded border border-slate-150 p-3 text-xs space-y-2">
              <span className="font-bold text-slate-700 block flex items-center gap-1">
                <MapPin size={14} className="text-rose-500" />
                <span>Simulated GPS Coordinates</span>
              </span>
              <div className="font-mono text-[10px] text-slate-600">
                Lat: {gpsSimulated.latitude.toFixed(6)} <br />
                Lon: {gpsSimulated.longitude.toFixed(6)}
              </div>
              <button 
                type="button" 
                onClick={handleRandomizeGPS}
                className="text-[10px] bg-slate-200 text-slate-700 py-0.5 px-2 rounded hover:bg-slate-350"
              >
                Change Geolocation
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Survey / Notes</label>
              <textarea 
                required 
                placeholder="Log activity details, village counts, or water tower integrity reports..." 
                value={activityNotes} 
                onChange={(e) => setActivityNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attached Photo File Name</label>
              <input 
                type="text" 
                placeholder="e.g. well_mombasa_audit.jpg" 
                value={photoName} 
                onChange={(e) => setPhotoName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>

            <button 
              type="submit" 
              className={`w-full font-semibold py-2 rounded text-xs transition-colors ${
                offlineMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {offlineMode ? 'Cache Report Offline' : 'Submit Report directly'}
            </button>
          </form>
        </div>

        {/* Sync queue & Submission History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
          {/* Sync control block */}
          {cachedSubmissions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-800">You have {cachedSubmissions.length} offline cached reports</span>
                <p className="text-slate-500 text-[10px]">Ready to sync to the primary Firestore database.</p>
              </div>
              <button 
                onClick={handleSyncCache}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded shadow text-xs flex items-center gap-1"
                disabled={offlineMode}
              >
                <Wifi size={14} /> Synchronize Cloud
              </button>
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-sm">Submission Sync Log History</h3>
          <div className="space-y-3">
            {offlineSubmissions.map(sub => (
              <div key={sub.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{sub.userName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{sub.submittedAt}</span>
                </div>
                <p className="text-slate-650 leading-relaxed">{sub.activityNotes}</p>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                  <span>GPS: {sub.gpsLocation.latitude.toFixed(4)}, {sub.gpsLocation.longitude.toFixed(4)}</span>
                  <span>•</span>
                  <span>Photo Attachment: {sub.photoUrl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
