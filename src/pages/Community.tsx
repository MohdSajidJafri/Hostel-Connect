import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CommunityCategory,
  CommunityPost,
  DEMO_PROFILES,
  getDemoPosts,
  saveDemoPosts,
} from '../lib/demoData';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  MessageSquare,
  CheckCircle2,
  Trash2,
  X,
  HelpCircle,
  Users,
  Package,
  ShoppingBag,
  Megaphone,
} from 'lucide-react';

const CATEGORIES: Array<{ id: 'all' | CommunityCategory; label: string; icon: React.ElementType }> = [
  { id: 'all', label: 'All', icon: Megaphone },
  { id: 'help', label: 'Ask a Senior', icon: HelpCircle },
  { id: 'group', label: 'Study & Hackathons', icon: Users },
  { id: 'borrow', label: 'Borrow & Lost', icon: Package },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'notice', label: 'Notices', icon: Megaphone },
];

const CATEGORY_BADGE: Record<CommunityCategory, string> = {
  help: 'Ask a Senior',
  group: 'Study / Hackathon',
  borrow: 'Borrow / Lost',
  marketplace: 'Marketplace',
  notice: 'Notice',
};

const Community: React.FC = () => {
  const { user, profile, isDemo } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | CommunityCategory>('all');
  const [showResolved, setShowResolved] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState<CommunityCategory>('help');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setPosts(getDemoPosts());
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data: postRows, error } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        const rows = (postRows || []) as CommunityPost[];
        const authorIds = [...new Set(rows.map((r) => r.author_id))];
        let profileMap = new Map<string, { full_name: string | null; room_number: string | null }>();

        if (authorIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, full_name, room_number')
            .in('user_id', authorIds);
          if (profs) {
            profileMap = new Map(profs.map((p) => [p.user_id, p]));
          }
        }

        setPosts(
          rows.map((r) => ({
            ...r,
            author_name: profileMap.get(r.author_id)?.full_name || 'Resident',
            author_room: profileMap.get(r.author_id)?.room_number || null,
          }))
        );
      } catch (err) {
        console.error('Error loading community posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    const channel = supabase
      .channel('community_posts_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isDemo]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const catMatch = activeTab === 'all' || p.category === activeTab;
      const statusMatch = showResolved || p.status === 'open';
      return catMatch && statusMatch;
    });
  }, [posts, activeTab, showResolved]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;
    setErrorMsg(null);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (isDemo) {
      const newPost: CommunityPost = {
        id: `post-${Date.now()}`,
        author_id: user.id,
        category,
        title: title.trim(),
        description: description.trim(),
        tags: parsedTags,
        price: category === 'marketplace' && price.trim() ? price.trim() : null,
        status: 'open',
        created_at: new Date().toISOString(),
        author_name: profile?.full_name || 'Demo Resident',
        author_room: profile?.room_number || null,
      };
      const updated = [newPost, ...posts];
      saveDemoPosts(updated);
      setPosts(updated);
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setTagsInput('');
      setPrice('');
      return;
    }

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          category,
          title: title.trim(),
          description: description.trim(),
          tags: parsedTags,
          price: category === 'marketplace' && price.trim() ? price.trim() : null,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const created: CommunityPost = {
          ...(data as CommunityPost),
          author_name: profile?.full_name || 'Resident',
          author_room: profile?.room_number || null,
        };
        setPosts((prev) => [created, ...prev]);
      }
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setTagsInput('');
      setPrice('');
    } catch (err) {
      console.error('Error creating post:', err);
      setErrorMsg('Failed to publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolved = async (post: CommunityPost) => {
    const nextStatus: 'open' | 'resolved' = post.status === 'open' ? 'resolved' : 'open';

    if (isDemo) {
      const updated = posts.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p));
      saveDemoPosts(updated);
      setPosts(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ status: nextStatus })
        .eq('id', post.id);
      if (error) throw error;
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      console.error('Error updating post:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (isDemo) {
      const updated = posts.filter((p) => p.id !== postId);
      saveDemoPosts(updated);
      setPosts(updated);
      return;
    }

    try {
      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const getAuthorLabel = (post: CommunityPost) => {
    if (post.author_name) return post.author_name;
    const demo = DEMO_PROFILES.find((p) => p.user_id === post.author_id);
    return demo?.full_name || 'Resident';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            Community Board
          </h1>
          <p className="text-sm text-neutral-500">
            Ask seniors, form hackathon teams, borrow essentials, buy/sell, and view hostel notices.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          data-testid="new-post-btn"
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Post</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const active = activeTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-neutral-950 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-900"
          />
          <span>Show resolved</span>
        </label>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-3 bg-white border border-neutral-200 rounded-xl">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-xs text-neutral-500">Loading community board...</span>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isAuthor = user?.id === post.author_id;
            return (
              <div
                key={post.id}
                className={`p-5 bg-white border border-neutral-200 rounded-xl shadow-subtle space-y-3 ${
                  post.status === 'resolved' ? 'opacity-70' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="badge">{CATEGORY_BADGE[post.category]}</span>
                    {post.price && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-950 text-white">
                        {post.price}
                      </span>
                    )}
                    {post.status === 'resolved' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Resolved
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">{post.title}</h2>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                        className="text-[11px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() =>
                      navigate(isAuthor ? '/profile' : `/profile/${post.author_id}`)
                    }
                    className="text-xs text-neutral-500 hover:text-neutral-950 hover:underline"
                  >
                    {getAuthorLabel(post)}
                    {post.author_room ? ` · ${post.author_room}` : ''}
                  </button>

                  <div className="flex items-center gap-2">
                    {isAuthor ? (
                      <>
                        <button
                          onClick={() => handleToggleResolved(post)}
                          className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>{post.status === 'open' ? 'Mark Resolved' : 'Reopen'}</span>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          aria-label="Delete post"
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/messages/${post.author_id}`)}
                        className="btn btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1.5 hover:bg-neutral-950 hover:text-white hover:border-neutral-950"
                      >
                        <MessageSquare size={13} />
                        <span>Reply in DM</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-neutral-200 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-neutral-950">No posts in this category</h3>
          <p className="text-xs text-neutral-500">Be the first to post a question, group, or listing.</p>
        </div>
      )}

      {/* Create Post Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-dropdown w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-950">Create Community Post</h3>
              <button
                onClick={() => setCreateOpen(false)}
                aria-label="Close modal"
                className="p-1 text-neutral-400 hover:text-neutral-950 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CommunityCategory)}
                  className="input text-xs"
                >
                  <option value="help">Ask a Senior / Help Request</option>
                  <option value="group">Study / Hackathon Group</option>
                  <option value="borrow">Borrow / Lend / Lost & Found</option>
                  <option value="marketplace">Marketplace (Buy / Sell)</option>
                  <option value="notice">Hostel Notice / Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short, clear headline..."
                  className="input text-xs"
                />
              </div>

              {category === 'marketplace' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Price</label>
                  <input
                    type="text"
                    maxLength={30}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. ₹1,200 or Free"
                    className="input text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Details</label>
                <textarea
                  rows={3}
                  required
                  maxLength={1500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include room/block, timing, or what you're looking for..."
                  className="input text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tags (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. React, Block B, Hackathon"
                  className="input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="btn btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-post-btn"
                  className="btn btn-primary text-xs py-1.5 px-3.5"
                >
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
