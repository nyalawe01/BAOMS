/**
 * Activity Calendar & Event Manager
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Interactive Event Manager for scheduling and tracking field activities,
 * progress report deadlines, donor submissions, and team meetings.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  Tag,
  Palette,
  Layers,
  X,
  List as ListIcon,
  LayoutGrid,
  Columns,
  Building,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { getAllActivities, getProjects, getProjectReports } from '../services/projectService';
import { ActivityRecord, ProjectRecord } from '../types/project';
import { showSuccess } from '@/lib/sweetAlert';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: 'activity' | 'report' | 'milestone' | 'meeting' | 'finance';
  color: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'red';
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  location?: string;
  participantsCount?: number;
  status?: string;
  description?: string;
  rawActivity?: ActivityRecord;
}

const COLOR_MAP: Record<CalendarEvent['color'], { bg: string; text: string; hover: string; ring: string }> = {
  blue: { bg: 'bg-[#2563eb]', text: 'text-white', hover: 'hover:bg-[#1d4ed8]', ring: 'ring-[#3b82f6]' },
  purple: { bg: 'bg-[#9333ea]', text: 'text-white', hover: 'hover:bg-[#7e22ce]', ring: 'ring-[#a855f7]' },
  pink: { bg: 'bg-[#db2777]', text: 'text-white', hover: 'hover:bg-[#be185d]', ring: 'ring-[#ec4899]' },
  green: { bg: 'bg-[#16a34a]', text: 'text-white', hover: 'hover:bg-[#15803d]', ring: 'ring-[#22c55e]' },
  orange: { bg: 'bg-[#ea580c]', text: 'text-white', hover: 'hover:bg-[#c2410c]', ring: 'ring-[#f97316]' },
  red: { bg: 'bg-[#dc2626]', text: 'text-white', hover: 'hover:bg-[#b91c1c]', ring: 'ring-[#ef4444]' },
};

const CATEGORY_COLORS: Record<CalendarEvent['category'], CalendarEvent['color']> = {
  activity: 'blue',
  report: 'orange',
  milestone: 'green',
  meeting: 'purple',
  finance: 'pink',
};

export const ActivityCalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles } = useAuth();

  // Navigation State
  const [currentDate, setCurrentDate] = useState(() => {
    const qDate = searchParams.get('date');
    return qDate ? new Date(qDate) : new Date();
  });
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Data State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Quick New Event Modal
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('activity');
  const [newEventColor, setNewEventColor] = useState<CalendarEvent['color']>('blue');
  const [newEventProjectId, setNewEventProjectId] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  // Load Real Activities & Projects
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedProjects, loadedActivities] = await Promise.all([
          getProjects({}, user ? { id: user.id, role: roles[0] } : undefined),
          getAllActivities(),
        ]);
        setProjects(loadedProjects);

        // Map activities to calendar events
        const mappedActivities: CalendarEvent[] = loadedActivities.map((act) => {
          let color: CalendarEvent['color'] = 'blue';
          if (act.title.toLowerCase().includes('report') || act.title.toLowerCase().includes('review')) {
            color = 'orange';
          } else if (act.title.toLowerCase().includes('training') || act.title.toLowerCase().includes('workshop')) {
            color = 'purple';
          } else if (act.title.toLowerCase().includes('safeguarding') || act.title.toLowerCase().includes('forum')) {
            color = 'green';
          } else if (act.title.toLowerCase().includes('budget') || act.title.toLowerCase().includes('finance')) {
            color = 'pink';
          }

          return {
            id: act.id,
            title: act.title,
            date: act.activityDate || act.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            category: 'activity',
            color,
            projectId: act.projectId,
            projectCode: act.projectCode || 'BAOMS-PRJ',
            projectName: act.projectName || 'Community Project',
            location: act.location || 'Field Site',
            participantsCount: act.participantsCount,
            status: act.submissionStatus,
            description: act.description || act.progress,
            rawActivity: act,
          };
        });

        // Add periodic monthly report milestones for active projects
        const reportMilestones: CalendarEvent[] = [];
        loadedProjects.forEach((proj) => {
          if (proj.status === 'active') {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            reportMilestones.push({
              id: `report-${proj.id}-month`,
              title: `${proj.projectCode || 'PRJ'} Monthly Progress Report Due`,
              date: `${year}-${month}-28`,
              category: 'report',
              color: 'orange',
              projectId: proj.id,
              projectCode: proj.projectCode,
              projectName: proj.name,
              location: 'Online / Dossier Hub',
              status: 'pending',
              description: 'Official monthly progress submission for donor compliance.',
            });
          }
        });

        setEvents([...mappedActivities, ...reportMilestones]);
      } catch (err) {
        console.error('Failed to load events for activity calendar:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, roles, currentDate.getFullYear(), currentDate.getMonth()]);

  // Current Month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesProj = (ev.projectName || '').toLowerCase().includes(q) || (ev.projectCode || '').toLowerCase().includes(q);
        const matchesLoc = (ev.location || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesProj && !matchesLoc) return false;
      }
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
      if (selectedProject !== 'all' && ev.projectId !== selectedProject) return false;
      if (selectedColor !== 'all' && ev.color !== selectedColor) return false;
      return true;
    });
  }, [events, searchQuery, selectedCategory, selectedProject, selectedColor]);

  // Calendar Matrix Computation for Month View (Sun - Sat)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill grid (35 or 42 cells)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Handle Quick Add Event
  const handleQuickAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const proj = projects.find((p) => p.id === newEventProjectId);
    const created: CalendarEvent = {
      id: `manual-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      category: newEventCategory,
      color: newEventColor,
      projectId: newEventProjectId || undefined,
      projectCode: proj?.projectCode || 'BAOMS-PRJ',
      projectName: proj?.name || 'Organizational Activity',
      location: newEventLocation.trim() || 'Headquarters / Field',
      description: newEventDescription.trim() || undefined,
      status: 'scheduled',
    };

    setEvents((prev) => [created, ...prev]);
    setIsNewEventModalOpen(false);
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventLocation('');
    showSuccess('Event Scheduled!', `"${created.title}" is now recorded on the activity calendar.`);
  };

  const openDateInPage = (dateStr: string) => {
    navigate(`/projects/activities/new?date=${dateStr}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Calendar Master Container - Sleek Modern Dark Styling as in reference image */}
      <div className="bg-[#121418] text-white rounded-2xl border border-[#262930] shadow-2xl p-4 sm:p-6 space-y-5">
        {/* Top Control Bar: Title & Navigation + View Modes + New Event */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#262930] pb-5">
          {/* Left: Scope / Project Selector & Month Title & Arrows */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                {monthName} {year}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#1b1e24] p-1 rounded-xl border border-[#2d313b]">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous month"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#282c35] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#282c35] rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next month"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#282c35] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: View Mode Tabs & New Event Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#1b1e24] p-1 rounded-xl border border-[#2d313b]">
              {(['month', 'week', 'day', 'list'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-[#2b2f3a] text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'month' && <CalendarIcon className="w-3.5 h-3.5" />}
                  {mode === 'week' && <Columns className="w-3.5 h-3.5" />}
                  {mode === 'day' && <Clock className="w-3.5 h-3.5" />}
                  {mode === 'list' && <ListIcon className="w-3.5 h-3.5" />}
                  <span>{mode}</span>
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewEventModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 border-0 font-semibold flex items-center gap-1.5 px-4 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4 text-slate-900 stroke-[2.5]" />
              <span>New Event</span>
            </Button>
          </div>
        </div>

        {/* Second Row Toolbar: Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events, activities, deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b1e24] border border-[#2d313b] text-white placeholder-slate-400 text-sm pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D68904] focus:border-[#D68904]"
            />
          </div>

          {/* Quick Filter Pill Buttons matching screenshot */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Colors Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSelectedColor(selectedColor === 'all' ? 'blue' : selectedColor === 'blue' ? 'green' : selectedColor === 'green' ? 'orange' : 'all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap ${
                  selectedColor !== 'all'
                    ? 'border-[#D68904] text-[#D68904] bg-[#D68904]/10'
                    : 'border-[#2d313b] bg-[#1b1e24] text-slate-300 hover:border-slate-500'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colors: {selectedColor}</span>
              </button>
            </div>

            {/* Categories Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-[#2d313b] bg-[#1b1e24] text-slate-300 hover:border-slate-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="activity">Field Activities</option>
              <option value="report">Progress Reports</option>
              <option value="milestone">Milestones</option>
              <option value="meeting">Team Meetings</option>
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-[#2d313b] bg-[#1b1e24] text-slate-300 hover:border-slate-500 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode || p.name}
                </option>
              ))}
            </select>

            {(searchQuery || selectedCategory !== 'all' || selectedProject !== 'all' || selectedColor !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedProject('all');
                  setSelectedColor('all');
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ─── VIEW 1: MONTH CALENDAR GRID (Exact match to reference screenshot) ─── */}
        {viewMode === 'month' && (
          <div className="rounded-2xl border border-[#262930] overflow-hidden bg-[#16181d]">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-[#262930] bg-[#181b21] text-center text-xs font-semibold text-slate-300 py-3">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#262930]">
              {calendarDays.map((day, idx) => {
                const dayEvents = filteredEvents.filter((ev) => ev.date === day.dateStr);

                return (
                  <div
                    key={idx}
                    onClick={() => openDateInPage(day.dateStr)}
                    className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-start transition-colors cursor-pointer group ${
                      day.isCurrentMonth
                        ? 'bg-[#14161b] hover:bg-[#1a1d24]'
                        : 'bg-[#101216] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center transition-all ${
                          day.isToday
                            ? 'w-6 h-6 rounded-full bg-white text-slate-950 font-bold shadow-md'
                            : day.isCurrentMonth
                            ? 'text-slate-300 group-hover:text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add
                      </span>
                    </div>

                    {/* Event Pill Badges */}
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => {
                        const style = COLOR_MAP[event.color];
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium truncate ${style.bg} ${style.text} ${style.hover} shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-between gap-1`}
                            title={`${event.title} (${event.projectName || ''})`}
                          >
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentDate(new Date(day.dateStr));
                            setViewMode('day');
                          }}
                          className="text-[10px] text-slate-400 font-semibold px-1 hover:text-white"
                        >
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 2: WEEK VIEW ─── */}
        {viewMode === 'week' && (
          <div className="rounded-2xl border border-[#262930] overflow-hidden bg-[#16181d]">
            <div className="grid grid-cols-7 border-b border-[#262930] bg-[#181b21] text-center text-xs font-semibold text-slate-300 py-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-[#262930] min-h-[420px]">
              {calendarDays.slice(0, 7).map((day, idx) => {
                const dayEvents = filteredEvents.filter((ev) => ev.date === day.dateStr);
                return (
                  <div key={idx} className="p-3 bg-[#14161b] space-y-2">
                    <div className="text-center font-bold text-sm text-slate-200 border-b border-[#262930] pb-2">
                      {day.dayNum}
                    </div>
                    <div className="space-y-1.5">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`p-2 rounded-lg text-xs font-medium ${COLOR_MAP[event.color].bg} text-white cursor-pointer hover:opacity-90 shadow-sm`}
                        >
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="text-[10px] opacity-80 truncate">{event.location || event.projectName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 3: DAY VIEW ─── */}
        {viewMode === 'day' && (
          <div className="rounded-2xl border border-[#262930] p-6 bg-[#16181d] space-y-5">
            <div className="flex items-center justify-between border-b border-[#262930] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-400">
                  {filteredEvents.filter((e) => e.date === currentDate.toISOString().slice(0, 10)).length} scheduled operational events
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openDateInPage(currentDate.toISOString().slice(0, 10))}
              >
                Record Activity for this Date
              </Button>
            </div>

            <div className="space-y-3">
              {filteredEvents.filter((e) => e.date === currentDate.toISOString().slice(0, 10)).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No activities or reports scheduled for this day. Click above to record one.
                </div>
              ) : (
                filteredEvents
                  .filter((e) => e.date === currentDate.toISOString().slice(0, 10))
                  .map((event) => {
                    const style = COLOR_MAP[event.color];
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="p-4 rounded-xl bg-[#1d2027] border border-[#2f333e] hover:border-slate-400 cursor-pointer transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-10 rounded-full ${style.bg}`} />
                          <div>
                            <h4 className="font-bold text-white text-sm">{event.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {event.projectName} • {event.location || 'Field'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${style.bg} ${style.text} font-semibold capitalize`}>
                            {event.category}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 4: CHRONOLOGICAL LIST VIEW ─── */}
        {viewMode === 'list' && (
          <div className="rounded-2xl border border-[#262930] overflow-hidden bg-[#16181d]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1b1e24] text-slate-300 border-b border-[#262930] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Activity / Event Title</th>
                  <th className="p-3">Project & Code</th>
                  <th className="p-3">Location / Channel</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262930] text-slate-200">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No events matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => {
                    const style = COLOR_MAP[event.color];
                    return (
                      <tr
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="hover:bg-[#1f232b] cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                          {event.date}
                        </td>
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${style.bg}`} />
                            <span>{event.title}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">
                          {event.projectCode || event.projectName || '—'}
                        </td>
                        <td className="p-3 text-slate-400">
                          {event.location || 'Field site'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${style.bg} ${style.text}`}>
                            {event.category}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (event.projectId) navigate(`/projects/${event.projectId}`);
                            }}
                            className="text-[#D68904] hover:underline text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <span>Open Project</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── EVENT DETAIL MODAL ─── */}
      {selectedEvent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
        >
          <div className="space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${COLOR_MAP[selectedEvent.color].bg} text-white`}>
                  {selectedEvent.category}
                </span>
                {selectedEvent.status && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                    {selectedEvent.status}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-slate-500 font-semibold">{selectedEvent.date}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold block">Associated Project</span>
                <p className="font-semibold text-slate-900">{selectedEvent.projectName} ({selectedEvent.projectCode})</p>
              </div>

              {selectedEvent.location && (
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Location</span>
                  <p className="text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{selectedEvent.location}</span>
                  </p>
                </div>
              )}

              {selectedEvent.participantsCount !== undefined && selectedEvent.participantsCount > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Participants Reached</span>
                  <p className="text-slate-700 flex items-center gap-1.5 font-bold">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{selectedEvent.participantsCount} community attendees</span>
                  </p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Summary Notes</span>
                  <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              {selectedEvent.projectId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/projects/${selectedEvent.projectId}`)}
                  className="flex items-center gap-1.5"
                >
                  <span>Open Project Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── QUICK NEW EVENT MODAL ─── */}
      <Modal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        title="Schedule New Event or Activity"
      >
        <form onSubmit={handleQuickAddEvent} className="space-y-4 text-slate-800">
          <Input
            label="Event / Activity Title *"
            placeholder="e.g., Community Forum & Child Safeguarding Workshop"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D68904]"
                required
              />
            </div>
            <Input
              type="time"
              label="Time"
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Category</label>
              <select
                value={newEventCategory}
                onChange={(e) => {
                  const cat = e.target.value as CalendarEvent['category'];
                  setNewEventCategory(cat);
                  setNewEventColor(CATEGORY_COLORS[cat] || 'blue');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D68904]"
              >
                <option value="activity">Field Activity</option>
                <option value="report">Progress Report Due</option>
                <option value="milestone">Milestone / Gate</option>
                <option value="meeting">Team Standup / Review</option>
                <option value="finance">Budget Review / Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Color Tag</label>
              <select
                value={newEventColor}
                onChange={(e) => setNewEventColor(e.target.value as CalendarEvent['color'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D68904]"
              >
                <option value="blue">Blue (Standup / Field)</option>
                <option value="green">Green (Safeguarding / Deploy)</option>
                <option value="orange">Orange (Report / Presentation)</option>
                <option value="purple">Purple (Workshop / Design)</option>
                <option value="pink">Pink (Finance / Social)</option>
                <option value="red">Red (Urgent / Deadline)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Associated Project</label>
            <select
              value={newEventProjectId}
              onChange={(e) => setNewEventProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D68904]"
            >
              <option value="">General Organizational Event</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Location / Venue"
            placeholder="e.g. Yombo Dovya Ward Office / Zoom"
            value={newEventLocation}
            onChange={(e) => setNewEventLocation(e.target.value)}
          />

          <Textarea
            label="Description / Instructions"
            placeholder="Provide context, required staff preparations, agenda highlights..."
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsNewEventModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save to Calendar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
