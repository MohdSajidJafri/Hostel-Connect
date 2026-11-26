import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { DEMO_PROFILES } from '../lib/demoData';
import { getCached, setCached } from '../lib/cache';
import { Search as SearchIcon, X, RotateCcw, ChevronDown, BadgeCheck } from 'lucide-react';

const DIRECTORY_CACHE_KEY = 'directory_profiles';
const PAGE_SIZE = 40;

const Search: React.FC = () => {
  const { isDemo, user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [profiles, setProfiles] = useState<Profile[]>(
    () => getCached<Profile[]>(DIRECTORY_CACHE_KEY, 60_000) || []
  );
  const [loading, setLoading] = useState(() => !getCached<Profile[]>(DIRECTORY_CACHE_KEY, 60_000));

  useEffect(() => {
    if (isDemo) {
      setProfiles(DEMO_PROFILES.filter((p) => p.user_id !== user?.id));
      setLoading(false);
      return;
    }
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, user?.id]);

  // Sync state if URL search param changes
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setSearchQuery(q);
  }, [searchParams]);

  const fetchProfiles = async () => {
    try {
      if (profiles.length === 0) {
        setLoading(true);
      }
      let query = supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, year_of_study, expertise, domain, room_number, availability_status, is_verified, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (user?.id) {
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      const list = (data as Profile[]) || [];
      setProfiles(list);
      setCached(DIRECTORY_CACHE_KEY, list);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('All');
    setSelectedYear('All');
    setSelectedRoom('All');
    setSearchParams({});
  };

  // Distinct courses/departments for filter pills
  const coursePills = ['All', 'CSE', 'IT', 'ECE', 'Mechanical', 'Civil'];

  // Memoized filtering using deferred query so typing stays 60fps
  const filteredProfiles = useMemo(() => {
    const query = deferredQuery.toLowerCase().trim();
    return profiles.filter((p) => {
      const matchesQuery = !query || (
        (p.full_name && p.full_name.toLowerCase().includes(query)) ||
        (p.domain && p.domain.toLowerCase().includes(query)) ||
        (p.expertise && p.expertise.toLowerCase().includes(query)) ||
        (p.room_number && p.room_number.toLowerCase().includes(query))
      );

      const matchesCourse = selectedCourse === 'All' || (
        p.domain && p.domain.toLowerCase().includes(selectedCourse.toLowerCase())
      );

      const matchesYear = selectedYear === 'All' || (
        p.year_of_study !== null && p.year_of_study.toString() === selectedYear
      );

      const matchesRoom = selectedRoom === 'All' || (
        p.room_number && p.room_number.toLowerCase().startsWith(selectedRoom.toLowerCase())
      );

      return matchesQuery && matchesCourse && matchesYear && matchesRoom;
    });
  }, [profiles, deferredQuery, selectedCourse, selectedYear, selectedRoom]);

  const visibleProfiles = useMemo(
    () => filteredProfiles.slice(0, visibleCount),
    [filteredProfiles, visibleCount]
  );

  const handleMessageClick = (userId: string) => {
    navigate(`/messages/${userId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
          Search Residents
        </h1>
        <p className="text-sm text-neutral-500 font-normal">
          Find and connect with hostel residents.
        </p>
      </div>

      {/* Prominent Search Bar */}
      <div className="relative">
        <SearchIcon
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name, expertise, course or room..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-subtle transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-0.5"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Controls: Quick Pills + Dropdowns */}
      <div className="space-y-3">
        {/* Course Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {coursePills.map((c) => {
            const isSelected = selectedCourse === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCourse(c)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-950 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Dropdown Filters & Reset */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Year Filter */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-md pl-2.5 pr-7 py-1 text-xs text-neutral-700 hover:border-neutral-300 focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              <option value="All">Year: All</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>

          {/* Block / Wing Filter */}
          <div className="relative">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-md pl-2.5 pr-7 py-1 text-xs text-neutral-700 hover:border-neutral-300 focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              <option value="All">Block: All</option>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
              <option value="C">Block C</option>
              <option value="D">Block D</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>

          {/* Reset Button */}
          {(searchQuery || selectedCourse !== 'All' || selectedYear !== 'All' || selectedRoom !== 'All') && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-950 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          <div className="ml-auto text-xs text-neutral-400">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'resident' : 'residents'}
          </div>
        </div>
      </div>

      {/* Directory Listing (Dense, Clean Rows) */}
      <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-xs text-neutral-500">Loading directory...</span>
          </div>
        ) : visibleProfiles.length > 0 ? (
          <>
            {visibleProfiles.map((p) => (
            <div
              key={p.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
            >
              {/* Resident Info */}
              <div
                onClick={() => navigate(`/profile/${p.user_id}`)}
                className="flex items-start gap-3.5 min-w-0 cursor-pointer group"
              >
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className="w-11 h-11 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.full_name || 'Resident'}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  {isOnline(p.user_id) && (
                    <span
                      title="Online"
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-sm font-semibold text-neutral-950 truncate group-hover:underline">
                      {p.full_name || 'Unnamed Resident'}
                    </h2>
                    {p.is_verified && (
                      <span title="Verified Resident">
                        <BadgeCheck size={14} className="text-sky-600 flex-shrink-0" />
                      </span>
                    )}
                    {p.availability_status && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {p.availability_status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 font-normal">
                    {p.domain || 'Course not specified'}
                    {p.year_of_study ? ` · Year ${p.year_of_study}` : ''}
                  </p>

                  {p.expertise && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {p.expertise
                        .split(/[·,]/)
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSearchChange(skill);
                            }}
                            className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                          >
                            {skill}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Room Badge & Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                {p.room_number ? (
                  <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                    {p.room_number}
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400 italic">No room</span>
                )}

                <button
                  onClick={() => handleMessageClick(p.user_id)}
                  className="btn btn-secondary text-xs py-1.5 px-3.5 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-colors"
                >
                  Message
                </button>
              </div>
            </div>
            ))}
            {filteredProfiles.length > visibleCount && (
              <div className="p-4 text-center bg-neutral-50/40">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="btn btn-secondary text-xs py-1.5 px-4"
                >
                  Show more ({filteredProfiles.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-semibold text-neutral-950">No residents found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Try a different name, course, expertise, or room number.
            </p>
            {(searchQuery || selectedCourse !== 'All' || selectedYear !== 'All' || selectedRoom !== 'All') && (
              <button
                onClick={resetFilters}
                className="btn btn-secondary text-xs mt-3 inline-flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Clear all filters</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

