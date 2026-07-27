'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface SafeBlogProps {
  isDark: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  views: number;
  shares: number;
  author: string;
  publishDate: string;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconFileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconMessage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-emerald-500 mr-1">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconTrendingDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-red-500 mr-1">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_POSTS: BlogPost[] = [
  { id: 'PST-201', title: 'Implementing Compliance Systems', category: 'Compliance', status: 'Published', views: 24500, shares: 1840, author: 'Ali Mohammadi', publishDate: 'Jun 15, 2026' },
  { id: 'PST-202', title: 'recruitment Best Practices 2026', category: 'Recruiting', status: 'Published', views: 18200, shares: 1250, author: 'Sarah Jenkins', publishDate: 'Jun 12, 2026' },
  { id: 'PST-203', title: 'Gas Auditing checklist & Guidelines', category: 'Audits', status: 'Draft', views: 0, shares: 0, author: 'Mark Davis', publishDate: 'Draft' },
  { id: 'PST-204', title: 'Fulfillment Portal Integrations v2', category: 'General', status: 'Scheduled', views: 0, shares: 0, author: 'Ali Mohammadi', publishDate: 'Jun 30, 2026' },
];

const VIEWS_TREND_DATA = [
  { time: 'Jan', views: 42000 },
  { time: 'Feb', views: 54000 },
  { time: 'Mar', views: 68000 },
  { time: 'Apr', views: 78000 },
  { time: 'May', views: 98000 },
  { time: 'Jun', views: 120400 },
];

export default function SafeBlog({ isDark }: SafeBlogProps) {
  const { primaryColor } = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft' | 'Scheduled'>('All');

  // Create Post Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('');
  const [newPostStatus, setNewPostStatus] = useState<BlogPost['status']>('Published');
  const [newPostAuthor, setNewPostAuthor] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    const newPost: BlogPost = {
      id: `PST-${Math.floor(Math.random() * 900) + 205}`,
      title: newPostTitle,
      category: newPostCategory || 'General',
      status: newPostStatus,
      views: 0,
      shares: 0,
      author: newPostAuthor || 'Anonymous',
      publishDate: newPostStatus === 'Published' 
        ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
        : newPostStatus === 'Scheduled' 
          ? new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
          : 'Draft',
    };

    setPosts(prev => [...prev, newPost]);
    setNewPostTitle('');
    setNewPostCategory('');
    setNewPostStatus('Published');
    setNewPostAuthor('');
    setIsCreateOpen(false);
  };

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Calculations
  const totalViews = 120400;
  const totalPosts = posts.length + 44;
  const totalShares = 8200;
  const totalComments = 1120;

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  // Toggle post status
  const togglePostStatus = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus: BlogPost['status'] = p.status === 'Published' ? 'Draft' : 'Published';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const getStatusStyles = (status: BlogPost['status']) => {
    switch (status) {
      case 'Published':
        return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
      case 'Draft':
        return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Scheduled':
        return { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.25)' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Dashboards
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Blog Workspace
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => setIsCreateOpen(true)}>
            Create Post
          </GlassButton>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* 1. Total Posts */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Articles Count
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>
              <IconFileText />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{totalPosts}</span>
              <span className="text-[10px] font-semibold text-[var(--primary)] block mt-1">
                4 scheduled
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Views */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Total Views
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconEye />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>{(totalViews / 1000).toFixed(1)}k</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 14.2% <span style={{ color: mut }}>(30d)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Total Shares */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Total Shares
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IconShare />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>{(totalShares / 1000).toFixed(1)}k</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 4.8% <span style={{ color: mut }}>(7d)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4. Comments */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Comments
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <IconMessage />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>{totalComments}</span>
              <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1 mt-1">
                <IconTrendingDown /> 2.5% <span style={{ color: mut }}>(30d)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Graph Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Views performance Area Chart */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Views Growth index</h3>
              <p className="text-xs" style={{ color: sec }}>Monthly readers performance analytics</p>
            </div>
            <button className="text-xs hover:text-primary transition-colors p-0.5" style={{ color: mut }}><IconThreeDots /></button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={VIEWS_TREND_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} tickFormatter={val => `${val / 1000}k`} />
                  <Tooltip
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="views" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Informative side panel */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] transition-colors justify-between" style={{ background: bg, border: `1px solid ${border}` }}>
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: pri }}>Distribution Analytics</h3>
            <p className="text-xs" style={{ color: sec }}>Audience sharing conversion</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>Social Share Conversion</span>
                <span style={{ color: '#10b981' }}>6.8%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '38%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: pri }}>
                <span>Reader Engagement</span>
                <span style={{ color: 'var(--primary)' }}>84.5%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full bg-primary" style={{ width: '84.5%' }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed" style={{ borderColor: borderSubtle(isDark) }}>
            <span className="text-[10px]" style={{ color: mut }}>Audience Retention optimal</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Search Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${border}` }}>
        <div className="flex items-center gap-1">
          {(['All', 'Published', 'Draft', 'Scheduled'] as const).map(tab => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                  color: isActive ? pri : sec,
                  border: `1px solid ${isActive ? borderSubtle(isDark) : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = surfaceHover(isDark); }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, minWidth: 160 }}
        >
          <img src="/search.svg" alt="search" width={12} height={12} style={{ opacity: 0.45, filter: isDark ? 'invert(1)' : 'none' }} />
          <input
            type="text"
            placeholder="Search article..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none border-none text-xs w-full"
            style={{ color: textPrimary(isDark) }}
          />
        </div>
      </div>

      {/* Articles cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPosts.map((post) => {
          const style = getStatusStyles(post.status);
          return (
            <div
              key={post.id}
              className="p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: bg, borderColor: border }}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[9px] font-bold block" style={{ color: mut }}>{post.id} • {post.category}</span>
                  <h4 className="text-sm font-bold mt-1 group-hover:text-primary transition-colors" style={{ color: pri }}>{post.title}</h4>
                  <span className="text-[10px]" style={{ color: sec }}>By: {post.author}</span>
                </div>

                <button
                  onClick={() => togglePostStatus(post.id)}
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold border cursor-pointer active:scale-95 transition-all text-center"
                  style={{ background: style.bg, color: style.text, borderColor: style.border }}
                >
                  {post.status}
                </button>
              </div>

              <div className="flex justify-between items-end pt-4 mt-4 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                <div className="text-[10px]" style={{ color: mut }}>
                  Published: <span className="font-bold" style={{ color: pri }}>{post.publishDate}</span>
                </div>

                <div className="flex gap-4 text-right text-[10px]" style={{ color: mut }}>
                  <div>
                    <span className="font-bold block" style={{ color: pri }}>{post.views.toLocaleString()}</span>
                    <span>Views</span>
                  </div>
                  <div>
                    <span className="font-bold block" style={{ color: pri }}>{post.shares.toLocaleString()}</span>
                    <span>Shares</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CREATE POST DIALOG MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl relative shadow-2xl transition-colors"
              style={{
                background: isDark ? 'rgba(20, 20, 20, 0.98)' : '#ffffff',
                border: `1px solid ${borderSubtle(isDark)}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <button
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Create New Post</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Write and schedule a new safety or compliance article</p>
              
              <form onSubmit={handleCreatePostSubmit} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Post Title</label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={e => setNewPostTitle(e.target.value)}
                    placeholder="e.g. 5 Compliance Auditing Tips"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                {/* Category & Author */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Category</label>
                    <input
                      type="text"
                      required
                      value={newPostCategory}
                      onChange={e => setNewPostCategory(e.target.value)}
                      placeholder="e.g. Compliance"
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                      style={{
                        background: surfaceItem(isDark),
                        borderColor: borderSubtle(isDark),
                        color: pri,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Author</label>
                    <input
                      type="text"
                      required
                      value={newPostAuthor}
                      onChange={e => setNewPostAuthor(e.target.value)}
                      placeholder="e.g. Ali Mohammadi"
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                      style={{
                        background: surfaceItem(isDark),
                        borderColor: borderSubtle(isDark),
                        color: pri,
                      }}
                    />
                  </div>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Initial Status</label>
                  <CustomSelect
                    value={newPostStatus}
                    onChange={setNewPostStatus}
                    isDark={isDark}
                    options={[
                      { value: 'Published', label: 'Published' },
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Scheduled', label: 'Scheduled' },
                    ]}
                  />
                </div>

                {/* Action button */}
                <GlassButton
                  type="submit"
                  className="w-full mt-4"
                >
                  Create Post
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
