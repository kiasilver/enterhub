'use client';

import { useState, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle, surfaceHover } from './theme';
import GlassButton from './GlassButton';
import { Mail, Phone, MapPin, Briefcase, Calendar, Edit2, CheckCircle, FileText, Wrench, Camera, Save, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const cardHover = { type: 'spring', stiffness: 400, damping: 28 } as const;

export default function SafeProfile({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const glass = glassStyle(isDark);

  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Ali Mohammadi',
    role: 'Safety Manager',
    company: 'Enterhub Inc.',
    coverImg: '/img/1.png', // local abstract cover
    avatarImg: '/profile.png',
    about: 'Dedicated Safety Manager with over 8 years of experience ensuring workplace compliance, minimizing risks, and establishing robust safety protocols across multiple enterprise facilities.',
    location: 'Tehran, Iran',
    email: 'ali.mohammadi@enterhub.co',
    joined: 'September 2021',
    expertise: 'Risk Assessment, OSHA Compliance, Incident Investigation, Emergency Response, Team Leadership, Audit Management',
    stats: [
      { label: 'Projects', value: '42', color: '' },
      { label: 'Audits', value: '156', color: '' },
      { label: 'Incidents', value: '0', color: '#10b981' },
      { label: 'Certifications', value: '14', color: '' }
    ]
  });

  const [editForm, setEditForm] = useState(profile);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit
      setEditForm(profile);
      setIsEditing(false);
    } else {
      // Start edit
      setEditForm(profile);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImg' | 'avatarImg') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditForm(prev => ({ ...prev, [field]: url }));
    }
  };

  const inputStyle = {
    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    color: pri,
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-10 no-scrollbar">

      {/* Cover Image */}
      <div className="w-full h-48 md:h-64 relative rounded-b-3xl overflow-hidden shadow-lg mx-auto group" style={{ maxWidth: 'calc(100% - 3rem)' }}>
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{
            backgroundImage: `url("${isEditing ? editForm.coverImg : profile.coverImg}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.9
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => coverInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-bold transition-all"
            >
              <Camera size={16} /> Change Cover
            </button>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'coverImg')} />
          </div>
        )}
      </div>

      <motion.div
        className="max-w-6xl mx-auto px-6 lg:px-12 -mt-20 relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-10">
          <motion.div
            variants={item}
            whileHover={{ y: -4 }}
            transition={cardHover}
            className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden flex-shrink-0 border-4 shadow-2xl relative group bg-black"
            style={{ borderColor: isDark ? 'var(--background)' : '#f0eded' }}
          >
            <img src={isEditing ? editForm.avatarImg : profile.avatarImg} alt="Profile" className="w-full h-full object-cover" />
            {isEditing && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={24} color="#fff" />
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'avatarImg')} />
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="flex-1 mb-2 w-full md:w-auto">
            {isEditing ? (
              <div className="space-y-2 mb-2 w-full max-w-sm">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full text-2xl font-black tracking-tight px-3 py-1.5 rounded-lg outline-none focus:ring-2 ring-primary"
                  style={inputStyle}
                  placeholder="Full Name"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                    className="flex-1 text-sm font-semibold px-3 py-1.5 rounded-lg outline-none focus:ring-2 ring-primary"
                    style={inputStyle}
                    placeholder="Role"
                  />
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))}
                    className="flex-1 text-sm font-semibold px-3 py-1.5 rounded-lg outline-none focus:ring-2 ring-primary"
                    style={inputStyle}
                    placeholder="Company"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1
                  className="text-3xl font-black tracking-tight mb-2"
                  style={{ color: pri }}
                >
                  {profile.name}
                </h1>
                <p
                  className="text-sm font-semibold flex items-center gap-2 px-3 py-1 rounded-full inline-flex"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: sec }}
                >
                  <Briefcase size={14} /> {profile.role} at {profile.company}
                </p>
              </>
            )}
          </motion.div>

          <motion.div
            variants={item}
            className="flex gap-3 mb-2 w-full md:w-auto"
          >
            {isEditing ? (
              <>
                <GlassButton hoverVariant="danger" className="flex-1 md:flex-none" onClick={handleEditToggle}>
                  <X size={14} /> Cancel
                </GlassButton>
                <GlassButton
                  hoverVariant="success"
                  className="flex-1 md:flex-none"
                  onClick={handleSave}
                >
                  <Save size={14} /> Save Profile
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton className="flex-1 md:flex-none">
                  <Mail size={14} /> Message
                </GlassButton>
                <GlassButton 
                  className="flex-1 md:flex-none"
                  onClick={handleEditToggle}
                >
                  <Edit2 size={14} /> Edit Profile
                </GlassButton>
              </>
            )}
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <motion.div
            variants={item}
            className="lg:col-span-1 space-y-6"
          >
            {/* About & Info */}
            <div className="rounded-3xl p-7" style={glass}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: pri, letterSpacing: '0.15em' }}>About</h3>

              {isEditing ? (
                <textarea
                  value={editForm.about}
                  onChange={e => setEditForm(p => ({ ...p, about: e.target.value }))}
                  className="w-full text-sm leading-relaxed mb-6 px-3 py-2 rounded-xl outline-none focus:ring-2 ring-primary resize-none h-28 no-scrollbar"
                  style={inputStyle}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-sm leading-relaxed mb-6" style={{ color: sec }}>
                  {profile.about}
                </p>
              )}

              <div className="space-y-5">
                {/* Location */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: surfaceHover(isDark), color: pri }}>
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: mut }}>Location</p>
                    {isEditing ? (
                      <input
                        type="text" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                        className="w-full text-sm font-semibold px-2 py-1 rounded outline-none focus:ring-2 ring-primary" style={inputStyle}
                      />
                    ) : (
                      <p className="text-sm font-semibold" style={{ color: pri }}>{profile.location}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: surfaceHover(isDark), color: pri }}>
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: mut }}>Email</p>
                    {isEditing ? (
                      <input
                        type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full text-sm font-semibold px-2 py-1 rounded outline-none focus:ring-2 ring-primary" style={inputStyle}
                      />
                    ) : (
                      <p className="text-sm font-semibold truncate" style={{ color: pri }}>{profile.email}</p>
                    )}
                  </div>
                </div>

                {/* Joined */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: surfaceHover(isDark), color: pri }}>
                    <Calendar size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: mut }}>Joined</p>
                    <p className="text-sm font-semibold" style={{ color: pri }}>{profile.joined}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div className="rounded-3xl p-7" style={glass}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: pri, letterSpacing: '0.15em' }}>Expertise</h3>
              {isEditing ? (
                <div>
                  <p className="text-[10px] mb-2" style={{ color: mut }}>Comma separated list of skills</p>
                  <textarea
                    value={editForm.expertise}
                    onChange={e => setEditForm(p => ({ ...p, expertise: e.target.value }))}
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl outline-none focus:ring-2 ring-primary h-24 resize-none no-scrollbar"
                    style={inputStyle}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.split(',').map((skill, i) => skill.trim() && (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                      style={{ background: surfaceHover(isDark), color: pri, border: `1px solid ${borderSubtle(isDark)}` }}
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            variants={item}
            className="lg:col-span-2 space-y-6"
          >
            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
            >
              {(isEditing ? editForm.stats : profile.stats).map((stat, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  whileHover={{ y: -4 }}
                  transition={cardHover}
                  className="rounded-3xl p-4 text-center flex flex-col items-center justify-center"
                  style={glass}
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={e => {
                          const newStats = [...editForm.stats];
                          newStats[i].value = e.target.value;
                          setEditForm(p => ({ ...p, stats: newStats }));
                        }}
                        className="text-2xl font-black tracking-tight mb-2 w-full text-center outline-none bg-transparent rounded focus:bg-black/10 dark:focus:bg-white/10"
                        style={{ color: stat.color || pri }}
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={e => {
                          const newStats = [...editForm.stats];
                          newStats[i].label = e.target.value;
                          setEditForm(p => ({ ...p, stats: newStats }));
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest w-full text-center outline-none bg-transparent rounded focus:bg-black/10 dark:focus:bg-white/10"
                        style={{ color: mut }}
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-black tracking-tight mb-2" style={{ color: stat.color || pri }}>{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: mut }}>{stat.label}</p>
                    </>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Recent Activity */}
            <div className="rounded-3xl p-7" style={glass}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: pri, letterSpacing: '0.15em' }}>Recent Activity</h3>
                <button className="text-xs font-bold text-primary hover:text-primary transition-colors">View All</button>
              </div>

              <motion.div
                className="space-y-6"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
              >
                {[
                  { title: 'Completed Safety Audit', desc: 'Facility Alpha passed with 98% score.', time: '2 hours ago', icon: <CheckCircle size={16} /> },
                  { title: 'Updated Protocol Guidelines', desc: 'Revised section 4.2 regarding hazardous materials.', time: 'Yesterday', icon: <FileText size={16} /> },
                  { title: 'Resolved Incident Ticket #402', desc: 'Minor equipment malfunction addressed.', time: '3 days ago', icon: <Wrench size={16} /> },
                ].map((activity, i) => (
                  <motion.div
                    key={i}
                    variants={item}
                    whileHover={{ y: -4 }}
                    transition={cardHover}
                    className="flex items-start gap-4 p-4 rounded-2xl transition-colors"
                    style={{ background: surfaceHover(isDark) }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.15)', color: primaryColor }}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                        <h4 className="font-bold text-sm" style={{ color: pri }}>{activity.title}</h4>
                        <span className="text-[10px] font-semibold mt-1 sm:mt-0" style={{ color: mut }}>{activity.time}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: sec }}>{activity.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
