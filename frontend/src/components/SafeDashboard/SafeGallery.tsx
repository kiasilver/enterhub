'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { glassStyle, textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  url: string;
  date: string;
  dimensions: string;
  size: string;
  format: string;
  description: string;
  author: string;
  colors: string[];
  isUploaded?: boolean;
}

const DEFAULT_ITEMS: GalleryItem[] = [
  {
    id: 'cyberpunk',
    title: 'Neo-Chiba Nightscape',
    category: 'Cyberpunk',
    url: '/gallery_cyberpunk.png',
    date: 'Jun 20, 2026',
    dimensions: '1920 x 1080',
    size: '1.8 MB',
    format: 'PNG',
    description: 'A breathtaking futuristic cityscape featuring towering skyscrapers covered in neon billboards, heavy rain reflecting vibrant purple and cyan lights off wet asphalt, and floating transport vehicles.',
    author: 'Kusanagi Art',
    colors: ['var(--primary)', '#a855f7', '#06b6d4', '#0f172a', '#1e293b']
  },
  {
    id: 'abstract',
    title: 'Translucent Spheres',
    category: '3D Art',
    url: '/gallery_abstract.png',
    date: 'Jun 19, 2026',
    dimensions: '1920 x 1080',
    size: '2.4 MB',
    format: 'PNG',
    description: 'An elegant glassmorphic composition presenting translucent bubble-like spheres resting on liquid-metallic structures, set against a smooth warm pastel orange and pink gradient backdrop.',
    author: 'Rendering Studio',
    colors: ['#f97316', '#ec4899', '#f43f5e', '#ffedd5', '#475569']
  },
  {
    id: 'minimalist',
    title: 'Twilight Ridge',
    category: 'Minimalist',
    url: '/gallery_minimalist.png',
    date: 'Jun 18, 2026',
    dimensions: '1920 x 1080',
    size: '1.2 MB',
    format: 'PNG',
    description: 'A serene vector-art landscape depicting rolling purple ridges under a single glowing low-poly neon sun, with low-polygon trees reflecting softly on a calm, dark lake.',
    author: 'Vectora Design',
    colors: ['var(--primary)', '#6d28d9', '#c084fc', '#1e1b4b', '#020617']
  },
  {
    id: 'hud',
    title: 'Tactical HUD Display',
    category: 'Holographic',
    url: '/gallery_hud.png',
    date: 'Jun 17, 2026',
    dimensions: '1920 x 1080',
    size: '1.5 MB',
    format: 'PNG',
    description: 'A highly-detailed futuristic graphical interface detailing live satellite tracking, circular holographic status dials, dynamic wave graphs, and clean telemetry stats in cobalt blue.',
    author: 'CyberTech Labs',
    colors: ['#0ea5e9', '#0284c7', '#bae6fd', '#0f172a', '#0b0f19']
  }
];

export default function SafeGallery({ isDark }: { isDark: boolean }) {
  const { primaryColor } = useTheme();
  const [items, setItems] = useState<GalleryItem[]>(DEFAULT_ITEMS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Lightbox State
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  // Upload Dialog State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Cyberpunk');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthor, setNewAuthor] = useState('Local User');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Custom tooltips and simulations
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = ['All', 'Cyberpunk', '3D Art', 'Minimalist', 'Holographic'];
    if (items.some(item => item.isUploaded)) {
      cats.push('Uploads');
    }
    return cats;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.author.toLowerCase().includes(search.toLowerCase());
      
      if (selectedCategory === 'All') return matchSearch;
      if (selectedCategory === 'Uploads') return item.isUploaded && matchSearch;
      return item.category === selectedCategory && matchSearch;
    });
  }, [items, search, selectedCategory]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setNewFileUrl(localUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Simulated Upload Submit
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileUrl || !newTitle.trim()) return;

    const newItem: GalleryItem = {
      id: `uploaded-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      url: newFileUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dimensions: '1920 x 1080', // Default mock info
      size: '2.1 MB',
      format: 'PNG',
      description: newDesc.trim() || 'A user uploaded graphic added to the Enterhub interactive gallery.',
      author: newAuthor.trim() || 'Local Administrator',
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', 'var(--primary)'], // Mock color swatches
      isUploaded: true
    };

    setItems(prev => [newItem, ...prev]);
    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewFileUrl('');
    setUploadOpen(false);
    setSelectedCategory('All');
  };

  // Action helpers
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const simulateDownload = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (downloadProgress[id] !== undefined) return;
    
    setDownloadProgress(prev => ({ ...prev, [id]: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(prev => ({ ...prev, [id]: progress }));
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Reset progress after a short delay
          setDownloadProgress(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          // Mock download alert
          alert('Asset downloaded successfully (Simulated)');
        }, 1000);
      }
    }, 100);
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Apps / Gallery
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Media Gallery
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div 
            className="flex p-1 rounded-xl transition-all duration-300 border"
            style={{ 
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: borderSubtle(isDark)
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: viewMode === 'grid' ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent',
                color: viewMode === 'grid' ? textPrimary(isDark) : textMuted(isDark)
              }}
              title="Grid View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: viewMode === 'list' ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent',
                color: viewMode === 'list' ? textPrimary(isDark) : textMuted(isDark)
              }}
              title="List View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center gap-2 cursor-pointer"
            style={{
              background: 'var(--primary)',
              color: ['#ffffff', '#00f0ff', '#a3ff00', '#00ff88', '#ffd700'].includes(primaryColor.toLowerCase()) ? '#000000' : '#ffffff',
              boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.35)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Asset
          </button>
        </div>
      </div>

      {/* ── Filtering and Search ── */}
      <div 
        className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={glassStyle(isDark)}
      >
        {/* Categories Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={{
                  background: isSelected 
                    ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')
                    : 'transparent',
                  color: isSelected ? textPrimary(isDark) : textSecondary(isDark),
                  border: `1px solid ${isSelected ? borderSubtle(isDark) : 'transparent'}`
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = surfaceHover(isDark);
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search assets, details, authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium outline-none transition-all duration-300"
            style={{
              background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textPrimary(isDark),
            }}
          />
          <span className="absolute left-3 top-2.5 opacity-40" style={{ color: textPrimary(isDark) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Content Grid / List ── */}
      {filteredItems.length === 0 ? (
        <div 
          className="py-20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4"
          style={glassStyle(isDark)}
        >
          <div className="w-16 h-16 rounded-full bg-[rgba(var(--primary-rgb),0.08)] flex items-center justify-center" style={{ border: `1px solid ${borderSubtle(isDark)}` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: textPrimary(isDark) }}>No assets found</h3>
            <p className="text-xs max-w-xs mt-1" style={{ color: textSecondary(isDark) }}>
              We couldn't find any image matching your query or filter. Try a different keyword or upload a new design.
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => {
              const isFav = !!favorites[item.id];
              const progress = downloadProgress[item.id];
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group rounded-2xl overflow-hidden relative border cursor-pointer select-none"
                  style={{
                    ...glassStyle(isDark),
                    borderColor: borderSubtle(isDark)
                  }}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image wrapper */}
                  <div className="aspect-video relative overflow-hidden bg-black/10">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    {/* Actions Overlay */}
                    <div 
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3"
                    >
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90"
                        title={isFav ? "Unfavorite" : "Favorite"}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill={isFav ? "#ff4444" : "none"} 
                          stroke={isFav ? "#ff4444" : "#ffffff"} 
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Lightbox Trigger */}
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all scale-105 hover:scale-110"
                        title="View Details"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={(e) => simulateDownload(item.id, e)}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 relative overflow-hidden"
                        title="Download"
                      >
                        {progress !== undefined ? (
                          <div className="absolute inset-0 bg-primary/50 flex items-center justify-center text-[10px] text-white font-bold">
                            {progress}%
                          </div>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Category Label */}
                    <span 
                      className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md border"
                      style={{
                        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)',
                        color: textPrimary(isDark),
                        borderColor: borderSubtle(isDark)
                      }}
                    >
                      {item.category}
                    </span>
                  </div>

                  {/* Metadata block */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold truncate flex-1" style={{ color: textPrimary(isDark) }}>
                        {item.title}
                      </h4>
                      {isFav && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-ping" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px]" style={{ color: textMuted(isDark) }}>
                      <span>{item.author}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ── List Layout ── */
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => {
              const isFav = !!favorites[item.id];
              const progress = downloadProgress[item.id];
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className="p-3 rounded-2xl flex items-center justify-between gap-4 border cursor-pointer"
                  style={{
                    ...glassStyle(isDark),
                    borderColor: borderSubtle(isDark)
                  }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/10">
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold truncate" style={{ color: textPrimary(isDark) }}>
                          {item.title}
                        </h4>
                        <span 
                          className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border"
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            color: textSecondary(isDark),
                            borderColor: borderSubtle(isDark)
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] mt-0.5 truncate max-w-sm" style={{ color: textSecondary(isDark) }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Size and specs */}
                    <div className="text-right text-[10px] hidden sm:block" style={{ color: textMuted(isDark) }}>
                      <p className="font-medium text-xs" style={{ color: textSecondary(isDark) }}>{item.size}</p>
                      <p>{item.dimensions}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {/* Favorite */}
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className="p-1.5 rounded-lg border transition-all active:scale-95"
                        style={{
                          background: surfaceItem(isDark),
                          borderColor: borderSubtle(isDark),
                          color: isFav ? '#ff4444' : textSecondary(isDark)
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={isFav ? "#ff4444" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Download */}
                      <button
                        onClick={(e) => simulateDownload(item.id, e)}
                        className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1.5 relative overflow-hidden"
                        style={{
                          background: surfaceItem(isDark),
                          borderColor: borderSubtle(isDark),
                          color: textPrimary(isDark)
                        }}
                      >
                        {progress !== undefined ? (
                          <span>Loading {progress}%</span>
                        ) : (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Lightbox Details Modal ── */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.28 }}
              className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row border max-h-[85vh] md:max-h-[75vh]"
              style={{
                background: panelFill(isDark),
                borderColor: borderSubtle(isDark),
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)'
              }}
            >
              {/* Close trigger */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
                  borderColor: borderSubtle(isDark),
                  color: textPrimary(isDark)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Left Side: Large image view */}
              <div className="w-full md:w-[55%] h-64 md:h-auto relative bg-black/20 flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedItem.url} 
                  alt={selectedItem.title} 
                  className="w-full h-full object-contain md:object-cover"
                />
              </div>

              {/* Right Side: Data view */}
              <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="space-y-6">
                  {/* Category & Title */}
                  <div>
                    <span 
                      className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border"
                      style={{
                        background: 'rgba(var(--primary-rgb),0.1)',
                        color: 'var(--primary)',
                        borderColor: 'rgba(var(--primary-rgb),0.2)'
                      }}
                    >
                      {selectedItem.category}
                    </span>
                    <h2 className="text-xl font-extrabold mt-2.5" style={{ color: textPrimary(isDark) }}>
                      {selectedItem.title}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: textMuted(isDark) }}>
                      Authored by <span className="font-semibold" style={{ color: textSecondary(isDark) }}>{selectedItem.author}</span>
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <h5 className="text-[11px] font-bold tracking-wider uppercase opacity-40 mb-1.5" style={{ color: textPrimary(isDark) }}>Description</h5>
                    <p className="text-xs leading-relaxed" style={{ color: textSecondary(isDark) }}>
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Extractable Color Palette */}
                  <div>
                    <h5 className="text-[11px] font-bold tracking-wider uppercase opacity-40 mb-2 flex items-center justify-between" style={{ color: textPrimary(isDark) }}>
                      <span>Dominant Palette</span>
                      {copiedColor && (
                        <span className="text-[9px] text-green-500 font-extrabold tracking-normal">Copied: {copiedColor}!</span>
                      )}
                    </h5>
                    <div className="flex items-center gap-3">
                      {selectedItem.colors.map(col => (
                        <button
                          key={col}
                          onClick={() => copyToClipboard(col)}
                          className="w-7 h-7 rounded-full transition-all border border-white/20 scale-100 hover:scale-115 active:scale-95 shadow-md flex items-center justify-center group relative cursor-pointer"
                          style={{ background: col }}
                          title={`Copy ${col}`}
                        >
                          <span className="absolute -bottom-6 scale-0 group-hover:scale-100 text-[8px] bg-black text-white px-1 py-0.5 rounded transition-transform font-mono shadow">
                            {col}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tech specs table */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold tracking-wider uppercase opacity-40" style={{ color: textPrimary(isDark) }}>Technical Details</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-2.5 rounded-xl" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                        <p style={{ color: textMuted(isDark) }}>Dimensions</p>
                        <p className="font-semibold mt-0.5" style={{ color: textSecondary(isDark) }}>{selectedItem.dimensions}</p>
                      </div>
                      <div className="p-2.5 rounded-xl" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                        <p style={{ color: textMuted(isDark) }}>File Size</p>
                        <p className="font-semibold mt-0.5" style={{ color: textSecondary(isDark) }}>{selectedItem.size}</p>
                      </div>
                      <div className="p-2.5 rounded-xl" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                        <p style={{ color: textMuted(isDark) }}>Created</p>
                        <p className="font-semibold mt-0.5" style={{ color: textSecondary(isDark) }}>{selectedItem.date}</p>
                      </div>
                      <div className="p-2.5 rounded-xl" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                        <p style={{ color: textMuted(isDark) }}>Format</p>
                        <p className="font-semibold mt-0.5" style={{ color: textSecondary(isDark) }}>{selectedItem.format}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal footer controls */}
                <div className="mt-8 flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}>
                  <button
                    onClick={() => toggleFavorite(selectedItem.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: favorites[selectedItem.id] ? '#ff4444' : textSecondary(isDark)
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={favorites[selectedItem.id] ? "#ff4444" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {favorites[selectedItem.id] ? "Saved" : "Save to Favorites"}
                  </button>

                  <button
                    onClick={() => simulateDownload(selectedItem.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                      boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.25)'
                    }}
                  >
                    {downloadProgress[selectedItem.id] !== undefined ? (
                      <span>Downloading {downloadProgress[selectedItem.id]}%</span>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Asset
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Simulated Upload Dialog ── */}
      <AnimatePresence>
        {uploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUploadOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />

            {/* Form Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl z-10 border"
              style={{
                background: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.96)',
                borderColor: borderSubtle(isDark),
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>Upload New Asset</h3>
                  <p className="text-xs" style={{ color: textMuted(isDark) }}>Add custom image assets, illustrations, or graphics to the interactive catalog.</p>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* Image input/dragzone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-colors cursor-pointer relative overflow-hidden"
                    style={{
                      background: dragActive ? 'rgba(var(--primary-rgb), 0.08)' : surfaceItem(isDark),
                      borderColor: dragActive ? 'var(--primary)' : borderSubtle(isDark)
                    }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    {newFileUrl ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <img src={newFileUrl} alt="Preview" className="h-full object-contain" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewFileUrl('');
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[rgba(var(--primary-rgb),0.08)] mx-auto flex items-center justify-center" style={{ border: `1px solid ${borderSubtle(isDark)}` }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <div className="text-xs" style={{ color: textSecondary(isDark) }}>
                          <span className="font-bold text-primary">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-[10px]" style={{ color: textMuted(isDark) }}>PNG, JPG, SVG, or WEBP (Max 10MB)</p>
                      </div>
                    )}
                  </div>

                  {/* Title & Category Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: textSecondary(isDark) }}>Asset Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Neon Horizon"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{
                          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${borderSubtle(isDark)}`,
                          color: textPrimary(isDark)
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: textSecondary(isDark) }}>Category</label>
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{
                          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${borderSubtle(isDark)}`,
                          color: textPrimary(isDark),
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${isDark ? 'white' : 'black'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          paddingRight: '32px'
                        }}
                      >
                        <option value="Cyberpunk">Cyberpunk</option>
                        <option value="3D Art">3D Art</option>
                        <option value="Minimalist">Minimalist</option>
                        <option value="Holographic">Holographic</option>
                      </select>
                    </div>
                  </div>

                  {/* Description input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: textSecondary(isDark) }}>Description</label>
                    <textarea
                      placeholder="Add background story or asset specs..."
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition-all resize-none"
                      style={{
                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${borderSubtle(isDark)}`,
                        color: textPrimary(isDark)
                      }}
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setUploadOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border"
                      style={{
                        background: 'transparent',
                        borderColor: borderSubtle(isDark),
                        color: textSecondary(isDark)
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFileUrl || !newTitle.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                        boxShadow: newFileUrl && newTitle.trim() ? '0 4px 12px rgba(var(--primary-rgb), 0.25)' : 'none'
                      }}
                    >
                      Confirm Upload
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
