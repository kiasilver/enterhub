'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Clock, MessageSquare, Heart, ArrowRight, ArrowLeft, X, PenLine, Send } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle, surfaceHover } from './theme';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';

interface Props {
  isDark: boolean;
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

interface Blog {
  id: number;
  title: string;
  excerpt: string;
  body: string[];
  category: string;
  image: string;
  date: string;
  readTime: string;
  author: { name: string; avatar: string };
  likes: number;
  liked: boolean;
  comments: Comment[];
}

const RU = (path: string) => `https://randomuser.me/api/portraits/${path}.jpg`;
const CURRENT_USER = { name: 'Ali Mohammadi', avatar: '/profile.png' };

const INITIAL_BLOGS: Blog[] = [
  {
    id: 1,
    title: 'The Future of AI in Workplace Safety',
    excerpt: 'Explore how artificial intelligence and machine learning are revolutionizing hazard detection and preventing workplace accidents before they happen.',
    body: [
      'Artificial intelligence has quietly moved from the research lab to the factory floor. Computer-vision systems now watch live camera feeds and flag missing PPE, blocked fire exits, and unsafe proximity to moving machinery — all in real time, and all without fatiguing the way a human monitor would.',
      'The real breakthrough is prediction rather than detection. By correlating sensor data, incident reports, and even shift-scheduling patterns, modern models can estimate the probability of an accident on a given line before it ever occurs, giving safety managers the lead time they have always lacked.',
      'Of course, the technology is only as good as the culture around it. Alerts that nobody trusts get ignored, and false positives erode confidence quickly. The most successful deployments pair the AI with a tight human feedback loop so the system keeps earning its keep.',
      'Looking ahead, expect tighter integration between wearables, environmental sensors, and these predictive engines — turning workplace safety from a reactive checklist into a continuous, data-driven discipline.',
    ],
    category: 'Technology',
    image: '/img/2.jpg',
    date: 'Oct 24, 2023',
    readTime: '5 min read',
    author: { name: 'Dr. Sarah Chen', avatar: RU('women/90') },
    likes: 124,
    liked: false,
    comments: [
      { id: 1, author: 'Michael Davis', avatar: RU('men/41'), text: 'The prediction angle is exactly where we are investing this year. Great write-up.', time: '2 days ago' },
      { id: 2, author: 'Elena Rostova', avatar: RU('women/68'), text: 'False positives are the silent killer of adoption. Glad you called it out.', time: '1 day ago' },
    ],
  },
  {
    id: 2,
    title: 'Top 10 Compliance Pitfalls in 2024',
    excerpt: 'A comprehensive guide to navigating the latest OSHA regulations and avoiding common compliance mistakes that could cost your business millions.',
    body: [
      'Every year the regulatory landscape shifts, and 2024 is no exception. The most expensive mistakes are rarely dramatic — they are the quiet lapses in recordkeeping and training documentation that surface only during an audit.',
      'The number one pitfall remains treating compliance as a once-a-year event. Regulations are living documents, and the organizations that fare best treat their safety programs as continuously maintained systems rather than binders gathering dust.',
      'A close second is misclassifying near-misses. A near-miss that goes unlogged is a future incident with a head start. Building a blame-free reporting culture is the single highest-leverage change most teams can make.',
      'The good news: nearly all of these pitfalls are avoidable with modest, consistent effort. A quarterly review cadence and a clear owner for each requirement will keep you well ahead of the penalty curve.',
    ],
    category: 'Compliance',
    image: '/img/3.jpg',
    date: 'Oct 18, 2023',
    readTime: '8 min read',
    author: { name: 'Michael Davis', avatar: RU('men/41') },
    likes: 89,
    liked: false,
    comments: [
      { id: 1, author: 'Dr. Anita Patel', avatar: RU('women/57'), text: 'Misclassifying near-misses is so underrated. We changed our reporting form because of issues like this.', time: '3 days ago' },
    ],
  },
  {
    id: 3,
    title: 'Building a Culture of Safety First',
    excerpt: 'Safety is more than just protocols—it’s a mindset. Learn how to foster a company culture where every employee takes ownership of workplace well-being.',
    body: [
      'Protocols on a wall do not keep anyone safe; the behaviors they encourage do. A genuine safety culture is one where the most junior employee feels empowered to stop a job they believe is unsafe, without fear of reprisal.',
      'That kind of psychological safety is built slowly and broken quickly. Leaders set the tone every time they choose to celebrate a near-miss report instead of punishing the person who filed it.',
      'Practical rituals matter. A thirty-second pre-task talk, a visible incident board, and managers who actually walk the floor do more for culture than any glossy poster campaign ever will.',
      'When safety becomes identity rather than obligation, the metrics follow. The companies with the best records are almost never the ones with the thickest rulebooks — they are the ones where everyone simply looks out for each other.',
    ],
    category: 'Culture',
    image: '/img/5.jpg',
    date: 'Oct 12, 2023',
    readTime: '6 min read',
    author: { name: 'Elena Rostova', avatar: RU('women/68') },
    likes: 256,
    liked: false,
    comments: [
      { id: 1, author: 'Marcus Johnson', avatar: RU('men/22'), text: 'The thirty-second pre-task talk changed our team completely. Cannot recommend it enough.', time: '5 days ago' },
      { id: 2, author: 'James Wilson', avatar: RU('men/15'), text: 'Identity over obligation — stealing that line for our next all-hands.', time: '4 days ago' },
    ],
  },
  {
    id: 4,
    title: 'IoT Sensors: The New Eyes and Ears',
    excerpt: 'How Internet of Things (IoT) wearables and environmental sensors are providing real-time data to safety managers globally.',
    body: [
      'A single connected sensor is a curiosity; a network of them is a nervous system. Across industries, IoT devices are now continuously measuring gas levels, temperature, vibration, and worker location, streaming it all to a central dashboard.',
      'Wearables have been the surprise hero. A wristband that detects a fall or a sustained lack of motion can summon help in seconds, which in a lone-worker scenario is often the difference between an incident and a tragedy.',
      'The challenge is no longer collecting data but making sense of it. Without thoughtful thresholds and aggregation, teams drown in noise and start ignoring the very alerts meant to protect them.',
      'The next frontier is closing the loop — letting environmental sensors automatically throttle equipment or trigger ventilation, so the system responds before a human even reads the alert.',
    ],
    category: 'Innovation',
    image: '/img/9.jpg',
    date: 'Oct 05, 2023',
    readTime: '4 min read',
    author: { name: 'James Wilson', avatar: RU('men/15') },
    likes: 142,
    liked: false,
    comments: [
      { id: 1, author: 'Dr. Sarah Chen', avatar: RU('women/90'), text: 'Closing the loop is the holy grail. Most deployments still stop at the dashboard.', time: '6 days ago' },
    ],
  },
  {
    id: 5,
    title: 'Mental Health in High-Risk Environments',
    excerpt: 'Addressing psychological safety and mental well-being in construction, mining, and other high-stress industries.',
    body: [
      'For decades, safety meant hard hats and harnesses. The conversation is finally widening to include the mind, and not a moment too soon — fatigue, stress, and burnout are direct contributors to physical incidents.',
      'High-risk industries carry a particular stigma around mental health. Workers fear that admitting they are struggling will cost them their standing, so they stay silent until the pressure becomes unbearable.',
      'Effective programs start small and stay confidential. Peer-support networks, fatigue-aware scheduling, and quiet access to professional help do more than any single awareness day on the calendar.',
      'Treating psychological well-being as a core safety metric, rather than a perk, is the shift that separates resilient organizations from the rest. A rested, supported worker is a safer worker.',
    ],
    category: 'Wellness',
    image: '/img/10.jpg',
    date: 'Sep 28, 2023',
    readTime: '7 min read',
    author: { name: 'Dr. Anita Patel', avatar: RU('women/57') },
    likes: 310,
    liked: false,
    comments: [
      { id: 1, author: 'Elena Rostova', avatar: RU('women/68'), text: 'Fatigue-aware scheduling is overlooked everywhere. Thank you for putting numbers behind it.', time: '1 week ago' },
      { id: 2, author: 'Michael Davis', avatar: RU('men/41'), text: 'We added a confidential peer line last quarter. Uptake was higher than anyone expected.', time: '6 days ago' },
    ],
  },
  {
    id: 6,
    title: 'Emergency Response Drills that Work',
    excerpt: 'Stop running boring, predictable fire drills. Here is how to create dynamic emergency scenarios that actually prepare your team.',
    body: [
      'If your team can predict the drill, the drill has already failed. Real emergencies are messy, surprising, and time-pressured — and your practice should mirror that, not a tidy walk to the parking lot.',
      'Introduce realistic friction: a blocked exit, an unresponsive colleague, a radio that does not work. These curveballs reveal the gaps in your plan far better than a flawless run ever could.',
      'Debriefing is where the learning lives. A blame-free review immediately after the exercise, focused on the system rather than the individual, turns a single drill into lasting muscle memory.',
      'Run them often, vary them constantly, and rotate who leads. The goal is not a perfect score on drill day — it is calm, competent action on the day that actually counts.',
    ],
    category: 'Training',
    image: '/img/1.png',
    date: 'Sep 15, 2023',
    readTime: '5 min read',
    author: { name: 'Marcus Johnson', avatar: RU('men/22') },
    likes: 178,
    liked: false,
    comments: [
      { id: 1, author: 'James Wilson', avatar: RU('men/15'), text: 'The blocked-exit curveball exposed a real gap in our plan. Eye-opening.', time: '2 weeks ago' },
    ],
  },
];

const CATEGORY_OPTIONS = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Culture', label: 'Culture' },
  { value: 'Innovation', label: 'Innovation' },
  { value: 'Wellness', label: 'Wellness' },
  { value: 'Training', label: 'Training' },
];

const DEFAULT_IMAGE = '/img/4.jpg';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};
const viewVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function SafeBlogsPage({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [blogs, setBlogs] = useState<Blog[]>(INITIAL_BLOGS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isWriteOpen, setIsWriteOpen] = useState(false);

  const selectedBlog = blogs.find(b => b.id === selectedId) || null;

  const toggleLike = (id: number) => {
    setBlogs(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, liked: !b.liked, likes: b.liked ? b.likes - 1 : b.likes + 1 }
          : b
      )
    );
  };

  const addComment = (id: number, text: string) => {
    setBlogs(prev =>
      prev.map(b =>
        b.id === id
          ? {
              ...b,
              comments: [
                ...b.comments,
                {
                  id: (b.comments[b.comments.length - 1]?.id ?? 0) + 1,
                  author: CURRENT_USER.name,
                  avatar: CURRENT_USER.avatar,
                  text,
                  time: 'Just now',
                },
              ],
            }
          : b
      )
    );
  };

  const addBlog = (data: { title: string; category: string; excerpt: string; image: string }) => {
    const words = data.excerpt.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 50));
    const newBlog: Blog = {
      id: Math.max(0, ...blogs.map(b => b.id)) + 1,
      title: data.title.trim(),
      excerpt: data.excerpt.trim(),
      body: data.excerpt
        .trim()
        .split(/\n+/)
        .map(p => p.trim())
        .filter(Boolean),
      category: data.category,
      image: data.image.trim() || DEFAULT_IMAGE,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      readTime: `${minutes} min read`,
      author: { name: CURRENT_USER.name, avatar: CURRENT_USER.avatar },
      likes: 0,
      liked: false,
      comments: [],
    };
    setBlogs(prev => [newBlog, ...prev]);
    setIsWriteOpen(false);
  };

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence mode="wait">
        {selectedBlog ? (
          <motion.div
            key="detail"
            variants={viewVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <ArticleDetail
              blog={selectedBlog}
              isDark={isDark}
              onBack={() => setSelectedId(null)}
              onToggleLike={() => toggleLike(selectedBlog.id)}
              onAddComment={(text) => addComment(selectedBlog.id, text)}
            />
          </motion.div>
        ) : (
          <motion.div key="grid" variants={viewVariants} initial="hidden" animate="show" exit="exit">
            {/* ── Header ── */}
            <motion.div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4" variants={item}>
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: pri, letterSpacing: '-0.01em' }}>Insights</h2>
                <p className="text-sm" style={{ color: mut }}>News, trends, and best practices in workplace safety and compliance.</p>
              </div>
              <motion.div
                className="inline-flex shrink-0"
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
                whileTap={{ scale: 0.96 }}
              >
                <GlassButton onClick={() => setIsWriteOpen(true)} style={{ padding: '9px 18px', borderRadius: '10px' }}>
                  <PenLine size={14} /> Write article
                </GlassButton>
              </motion.div>
            </motion.div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <motion.div
                  key={blog.id}
                  variants={item}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
                  className="rounded-2xl overflow-hidden group cursor-pointer flex flex-col"
                  style={{ ...glassStyle(isDark), transition: 'box-shadow 0.25s ease, border-color 0.25s ease' }}
                  onClick={() => setSelectedId(blog.id)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)';
                    e.currentTarget.style.boxShadow = isDark ? '0 10px 30px -14px rgba(0,0,0,0.6)' : '0 10px 30px -14px rgba(0,0,0,0.18)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Image */}
                  <div className="w-full h-44 overflow-hidden relative">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md"
                      style={{ background: 'rgba(0,0,0,0.45)', color: '#ffffff' }}
                    >
                      {blog.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-[11px] mb-2.5" style={{ color: mut }}>
                      <Clock size={12} /> <span>{blog.date}</span>
                      <span className="w-1 h-1 rounded-full" style={{ background: mut }} />
                      <span>{blog.readTime}</span>
                    </div>

                    <h3 className="text-[16px] font-semibold mb-2 line-clamp-2" style={{ color: pri, lineHeight: 1.35 }}>
                      {blog.title}
                    </h3>

                    <p className="text-[13px] mb-5 line-clamp-2 flex-1" style={{ color: sec, lineHeight: 1.6 }}>
                      {blog.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="pt-4 mt-auto flex items-center justify-between border-t" style={{ borderColor: border }}>
                      <div className="flex items-center gap-2.5">
                        <img src={blog.author.avatar} alt={blog.author.name} className="w-7 h-7 rounded-full object-cover" style={{ border: `1px solid ${border}` }} />
                        <span className="text-xs font-medium" style={{ color: sec }}>{blog.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: mut }}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 1.35 }}
                          className="flex items-center gap-1 cursor-pointer"
                          style={{ color: blog.liked ? '#ef4444' : mut }}
                          onClick={(e) => { e.stopPropagation(); toggleLike(blog.id); }}
                          aria-label={blog.liked ? 'Unlike' : 'Like'}
                        >
                          <Heart size={13} fill={blog.liked ? '#ef4444' : 'none'} /> {blog.likes}
                        </motion.button>
                        <span className="flex items-center gap-1"><MessageSquare size={13} /> {blog.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div className="mt-8 flex justify-center" variants={item}>
              <motion.div
                className="inline-flex"
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
                whileTap={{ scale: 0.96 }}
              >
                <GlassButton style={{ padding: '10px 20px', borderRadius: '10px' }}>
                  Load more <ArrowRight size={15} />
                </GlassButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Write article modal ── */}
      <AnimatePresence>
        {isWriteOpen && (
          <WriteArticleModal
            isDark={isDark}
            onClose={() => setIsWriteOpen(false)}
            onSubmit={addBlog}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────── Article detail ─────────────────────────── */

interface DetailProps {
  blog: Blog;
  isDark: boolean;
  onBack: () => void;
  onToggleLike: () => void;
  onAddComment: (text: string) => void;
}

function ArticleDetail({ blog, isDark, onBack, onToggleLike, onAddComment }: DetailProps) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const surf = surfaceHover(isDark);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.button
        type="button"
        onClick={onBack}
        whileHover={{ x: -3 }}
        className="flex items-center gap-2 text-sm font-medium mb-5 cursor-pointer"
        style={{ color: sec }}
      >
        <ArrowLeft size={16} /> Back to insights
      </motion.button>

      <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ border: `1px solid ${border}` }}>
        <img src={blog.image} alt={blog.title} className="w-full h-64 object-cover" />
        <span
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.45)', color: '#ffffff' }}
        >
          {blog.category}
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-4" style={{ color: pri, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        {blog.title}
      </h1>

      <div className="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b" style={{ borderColor: border }}>
        <div className="flex items-center gap-3">
          <img src={blog.author.avatar} alt={blog.author.name} className="w-10 h-10 rounded-full object-cover" style={{ border: `1px solid ${border}` }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: pri }}>{blog.author.name}</div>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: mut }}>
              <span>{blog.date}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: mut }} />
              <Clock size={11} /> <span>{blog.readTime}</span>
            </div>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 1.25 }}
          onClick={onToggleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer"
          style={{
            border: `1px solid ${blog.liked ? '#ef4444' : border}`,
            color: blog.liked ? '#ef4444' : sec,
            background: blog.liked ? 'rgba(239,68,68,0.08)' : 'transparent',
          }}
          aria-label={blog.liked ? 'Unlike' : 'Like'}
        >
          <Heart size={15} fill={blog.liked ? '#ef4444' : 'none'} /> {blog.likes}
        </motion.button>
      </div>

      <div className="space-y-4 mb-10">
        {blog.body.map((para, i) => (
          <p key={i} className="text-[15px]" style={{ color: sec, lineHeight: 1.75 }}>
            {para}
          </p>
        ))}
      </div>

      {/* Comments */}
      <div className="border-t pt-7" style={{ borderColor: border }}>
        <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: pri }}>
          <MessageSquare size={16} /> Comments <span style={{ color: mut }}>({blog.comments.length})</span>
        </h3>

        <div className="space-y-5 mb-7">
          {blog.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <img src={c.avatar} alt={c.author} className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: `1px solid ${border}` }} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold" style={{ color: pri }}>{c.author}</span>
                  <span className="text-[11px]" style={{ color: mut }}>{c.time}</span>
                </div>
                <p className="text-[13px]" style={{ color: sec, lineHeight: 1.6 }}>{c.text}</p>
              </div>
            </div>
          ))}
          {blog.comments.length === 0 && (
            <p className="text-[13px]" style={{ color: mut }}>Be the first to comment.</p>
          )}
        </div>

        {/* New comment */}
        <div className="flex gap-3 items-start">
          <img src={CURRENT_USER.avatar} alt={CURRENT_USER.name} className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: `1px solid ${border}` }} />
          <div className="flex-1 flex flex-col gap-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
              style={{ background: surf, border: `1px solid ${border}`, color: pri }}
            />
            <div className="flex justify-end">
              <motion.div whileTap={{ scale: 0.96 }} className="inline-flex">
                <GlassButton onClick={submit} style={{ padding: '7px 16px', borderRadius: '9px' }}>
                  <Send size={13} /> Post
                </GlassButton>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Write article modal ─────────────────────────── */

interface ModalProps {
  isDark: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; category: string; excerpt: string; image: string }) => void;
}

function WriteArticleModal({ isDark, onClose, onSubmit }: ModalProps) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const surf = surfaceHover(isDark);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canSubmit = title.trim().length > 0 && excerpt.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ title, category, excerpt, image });
  };

  const labelStyle: React.CSSProperties = { color: sec };
  const fieldStyle: React.CSSProperties = { background: surf, border: `1px solid ${border}`, color: pri };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        className="w-full max-w-md p-6"
        style={{ ...glassStyle(isDark), borderRadius: '16px' }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: pri }}>Write article</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg cursor-pointer"
            style={{ color: mut }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A compelling headline"
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Category</label>
            <CustomSelect value={category} onChange={setCategory} options={CATEGORY_OPTIONS} isDark={isDark} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary or the opening paragraphs..."
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Image URL <span style={{ color: mut }}>(optional)</span></label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
              style={fieldStyle}
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-1">
            <motion.div whileTap={{ scale: 0.96 }} className="inline-flex">
              <GlassButton onClick={onClose} style={{ padding: '8px 16px', borderRadius: '9px' }}>
                Cancel
              </GlassButton>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }} className="inline-flex">
              <GlassButton
                onClick={handleSubmit}
                hoverVariant="success"
                style={{ padding: '8px 16px', borderRadius: '9px', opacity: canSubmit ? 1 : 0.5 }}
              >
                Publish
              </GlassButton>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
