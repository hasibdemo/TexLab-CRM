import { useState, useMemo } from 'react';
import { Activity, Company, Contact, NavPage, User, ActivityType } from '../../types';
import { activitiesService } from '../../services/activitiesService';
import { authService } from '../../services/authService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Phone,
  Mail,
  Users,
  FileText,
  Plus,
  Trash2,
  Building2,
  PhoneCall,
  Calendar,
} from 'lucide-react';

interface ActivitiesListViewProps {
  activities: Activity[];
  companies: Company[];
  contacts: Contact[];
  onRefresh: () => void;
  onNavigate: (page: NavPage, params?: { companyId?: string }) => void;
  onOpenLogActivity: () => void;
  currentUser: User;
}

export function ActivitiesListView({
  activities,
  companies,
  contacts,
  onRefresh,
  onNavigate,
  onOpenLogActivity,
  currentUser,
}: ActivitiesListViewProps) {
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  const canLog = authService.canLogActivity(currentUser.role);
  const canDelete = authService.canDeleteCompanies(currentUser.role);

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach((c) => map.set(c.id, c));
    return map;
  }, [companies]);

  const contactMap = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((ct) => map.set(ct.id, ct));
    return map;
  }, [contacts]);

  const filteredActivities = useMemo(() => {
    let list = [...activities];

    if (selectedType !== 'All') {
      list = list.filter((a) => a.type === selectedType);
    }

    if (selectedCompany !== 'All') {
      list = list.filter((a) => a.companyId === selectedCompany);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const comp = companyMap.get(a.companyId);
        const cont = a.contactId ? contactMap.get(a.contactId) : null;
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.loggedBy.toLowerCase().includes(q) ||
          (a.outcome && a.outcome.toLowerCase().includes(q)) ||
          (comp && comp.name.toLowerCase().includes(q)) ||
          (cont && cont.name.toLowerCase().includes(q))
        );
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, selectedType, selectedCompany, search, companyMap, contactMap]);

  const handleDeleteConfirm = () => {
    if (!activityToDelete) return;
    try {
      activitiesService.deleteActivity(activityToDelete.id);
      showToast('Activity record removed.', 'success', 'Deleted');
      setActivityToDelete(null);
      onRefresh();
    } catch {
      showToast('Error removing activity record.', 'error');
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-blue-700" />;
      case 'email':
        return <Mail className="w-4 h-4 text-purple-700" />;
      case 'meeting':
        return <Users className="w-4 h-4 text-emerald-700" />;
      default:
        return <FileText className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Trade Activity Log & Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit trail of quotations, WhatsApp negotiations, LC reviews, and mill inspections.
          </p>
        </div>

        {canLog && (
          <button
            type="button"
            onClick={onOpenLogActivity}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search Activity
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quotes, specs, outcomes, staff..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Activity Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Types</option>
              <option value="call">Call / WhatsApp</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting / Mill Visit</option>
              <option value="note">Internal Note</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Companies ({companies.length})</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 font-mono tabular-nums">
          Showing <strong>{filteredActivities.length}</strong> activity logs
        </div>
      </div>

      {/* Activities Timeline List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No activity records found</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try adjusting your filters or log a new trade interaction.
            </p>
            {canLog && (
              <button
                type="button"
                onClick={onOpenLogActivity}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                Log New Interaction
              </button>
            )}
          </div>
        ) : (
          filteredActivities.map((act) => {
            const comp = companyMap.get(act.companyId);
            const cont = act.contactId ? contactMap.get(act.contactId) : null;

            return (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                      {getActivityIcon(act.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{act.title}</h4>
                        {act.outcome && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                            {act.outcome}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono tabular-nums">
                          {new Date(act.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span aria-hidden="true">·</span>
                        {comp && (
                          <button
                            type="button"
                            onClick={() => onNavigate('company-detail', { companyId: comp.id })}
                            className="font-semibold text-blue-900 hover:underline inline-flex items-center gap-1"
                          >
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{comp.name}</span>
                          </button>
                        )}
                        {cont && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Contact: {cont.name}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>by {act.loggedBy}</span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setActivityToDelete(act)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Delete activity record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-10">
                  {act.description}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(activityToDelete)}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Activity"
        message={`Are you sure you want to delete "${activityToDelete?.title}"?`}
        confirmText="Delete Activity"
        isDestructive={true}
      />
    </div>
  );
}
