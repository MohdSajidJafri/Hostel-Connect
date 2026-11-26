import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DemoReport, getDemoReports } from '../lib/demoData';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<DemoReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      setReports(getDemoReports());
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('message_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setReports((data as DemoReport[]) || []);
      } catch (err) {
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, isDemo]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
            Safety & Reports
          </h1>
          <p className="text-xs text-neutral-500">
            Review submitted community safety reports.
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-subtle divide-y divide-neutral-100">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500">Loading reports...</div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div key={r.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-950">{r.reason}</p>
                  <p className="text-[11px] text-neutral-500">
                    Reported user: <span className="font-mono">{r.reported_user_id}</span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-neutral-400 flex-shrink-0">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </span>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-neutral-500">
            No safety reports submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
