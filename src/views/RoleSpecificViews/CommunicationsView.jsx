import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  MessageSquare
} from 'lucide-react';

export function CommunicationsView() {
  const { announcements, mediaLibrary, addAnnouncement, addMediaAsset, projects } = useProject();
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [mediaFile, setMediaFile] = useState('');
  const [mediaProjTag, setMediaProjTag] = useState('');

  const handlePubAnn = (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    addAnnouncement(annTitle, annContent);
    setAnnTitle('');
    setAnnContent('');
  };

  const handleUploadMedia = (e) => {
    e.preventDefault();
    if (!mediaFile || !mediaProjTag) return;

    const mockUnsplashUrl = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400";
    addMediaAsset(mediaFile, mockUnsplashUrl, mediaProjTag);
    setMediaFile('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/25">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="text-indigo-400" />
          <span>Announcement Publisher & Media Library</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">Broadcast general notices to the organization and manage digital media files linked to specific projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Publisher */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Publish Board Announcement</h3>
          
          <form onSubmit={handlePubAnn} className="space-y-3">
            <input 
              type="text" 
              required 
              placeholder="Announcement Title" 
              value={annTitle} 
              onChange={(e) => setAnnTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <textarea 
              required 
              placeholder="Content..." 
              value={annContent} 
              onChange={(e) => setAnnContent(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              rows="3"
            />
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-xs">Publish Broadcast</button>
          </form>

          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {announcements.map(ann => (
              <div key={ann.id} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1">
                <div className="font-bold text-slate-800">{ann.title}</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{ann.content}</p>
                <span className="text-[10px] text-slate-400 block font-mono">By: {ann.authorName} • {ann.publishedAt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Media Library */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Media Asset Library</h3>
          
          <form onSubmit={handleUploadMedia} className="grid grid-cols-3 gap-3">
            <input 
              type="text" 
              required 
              placeholder="File Name (e.g. logo.png)" 
              value={mediaFile} 
              onChange={(e) => setMediaFile(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
            />
            <select 
              required
              value={mediaProjTag} 
              onChange={(e) => setMediaProjTag(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
            >
              <option value="">Tag Project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 rounded">Tag & Upload</button>
          </form>

          <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {mediaLibrary.map(med => (
              <div key={med.id} className="border border-slate-200 rounded p-2 bg-slate-50 space-y-1">
                <img src={med.url} alt={med.fileName} className="w-full h-16 object-cover rounded bg-slate-200" />
                <div className="text-[10px] font-bold text-slate-700 truncate">{med.fileName}</div>
                <div className="text-[9px] text-indigo-600 truncate">Project: {med.projectName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
