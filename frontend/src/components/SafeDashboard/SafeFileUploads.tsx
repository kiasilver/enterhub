'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { UploadCloud, File as FileIcon, FileText, FileImage, X, Check, Camera, Paperclip } from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

const ACCENT = 'var(--primary)';
const GRAD = 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)';
const OK = '#10b981';

interface UItem { id: number; file: File; url?: string; }

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const isImg = (f: File) => f.type.startsWith('image/');
const FileTypeIcon = ({ file, size = 18 }: { file: File; size?: number }) => {
  if (isImg(file)) return <FileImage size={size} />;
  if (file.type.includes('pdf') || file.type.includes('text') || file.type.includes('word')) return <FileText size={size} />;
  return <FileIcon size={size} />;
};

/* ===================================================================== *
 *  Dropzone (dashed area with real drag & drop + click to browse)       *
 * ===================================================================== */
function Dropzone({
  isDark,
  onFiles,
  multiple = false,
  accept,
  title,
  subtitle,
  compact = false,
}: {
  isDark: boolean;
  onFiles: (files: FileList) => void;
  multiple?: boolean;
  accept?: string;
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}
      style={{
        borderColor: drag ? ACCENT : border,
        background: drag ? (isDark ? 'rgba(var(--primary-rgb), 0.08)' : 'rgba(var(--primary-rgb), 0.05)') : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
      />
      <motion.div
        animate={{ y: drag ? -5 : 0, scale: drag ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="rounded-2xl flex items-center justify-center mb-3"
        style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, background: drag ? GRAD : (isDark ? 'rgba(var(--primary-rgb), 0.14)' : 'rgba(var(--primary-rgb), 0.1)'), color: drag ? '#fff' : ACCENT }}
      >
        <UploadCloud size={compact ? 20 : 26} />
      </motion.div>
      <p className="text-[13px] font-semibold" style={{ color: pri }}>{drag ? 'Drop to upload' : title}</p>
      <p className="text-[11.5px] mt-1" style={{ color: mut }}>{subtitle}</p>
    </div>
  );
}

/* ===================================================================== *
 *  File row (with simulated upload progress)                            *
 * ===================================================================== */
function FileRow({ isDark, item, onRemove }: { isDark: boolean; item: UItem; onRemove: () => void }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const [done, setDone] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}` }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: isDark ? 'rgba(var(--primary-rgb), 0.14)' : 'rgba(var(--primary-rgb), 0.1)', color: ACCENT }}>
        {item.url ? <img src={item.url} alt="" className="w-full h-full object-cover" /> : <FileTypeIcon file={item.file} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] font-semibold truncate" style={{ color: pri }}>{item.file.name}</p>
          <span className="text-[11px] font-mono shrink-0" style={{ color: mut }}>{fmtSize(item.file.size)}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: done ? OK : GRAD, transformOrigin: 'left', width: '100%' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            onAnimationComplete={() => setDone(true)}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ color: done ? OK : mut }}
        onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Remove"
      >
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={16} /></motion.span>
          ) : (
            <motion.span key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><X size={16} /></motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

/* ===================================================================== *
 *  Section + plain button input                                         *
 * ===================================================================== */
function Section({ isDark, title, hint, children }: { isDark: boolean; title: string; hint?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-6 sm:p-7 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? <p className="text-[12px] mt-1 mb-6" style={{ color: mut }}>{hint}</p> : <div className="mb-6" />}
      {children}
    </motion.section>
  );
}

function ButtonInput({ isDark, label, multiple }: { isDark: boolean; label: string; multiple?: boolean }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const ref = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  return (
    <div>
      <label className="text-[12px] font-semibold block mb-1.5" style={{ color: pri }}>{label}</label>
      <div className="flex items-center gap-3 rounded-xl p-1.5" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}` }}>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold shrink-0"
          style={{ background: isDark ? 'rgba(var(--primary-rgb), 0.16)' : 'rgba(var(--primary-rgb), 0.1)', color: ACCENT }}
        >
          <Paperclip size={14} /> Browse
        </button>
        <span className="text-[12.5px] truncate" style={{ color: names.length ? pri : mut }}>
          {names.length === 0 ? 'No file selected' : names.length === 1 ? names[0] : `${names.length} files selected`}
        </span>
        <input
          ref={ref}
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={e => setNames(Array.from(e.target.files ?? []).map(f => f.name))}
        />
      </div>
    </div>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
export default function SafeFileUploads({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const [single, setSingle] = useState<UItem | null>(null);
  const [many, setMany] = useState<UItem[]>([]);
  const [images, setImages] = useState<UItem[]>([]);
  const [avatar, setAvatar] = useState<UItem | null>(null);

  const addSingle = (fl: FileList) => {
    if (single?.url) URL.revokeObjectURL(single.url);
    const f = fl[0];
    setSingle({ id: nextId(), file: f, url: isImg(f) ? URL.createObjectURL(f) : undefined });
  };
  const addMany = (fl: FileList) => {
    setMany(prev => [...prev, ...Array.from(fl).map(f => ({ id: nextId(), file: f, url: isImg(f) ? URL.createObjectURL(f) : undefined }))]);
  };
  const removeMany = (id: number) => setMany(prev => {
    const it = prev.find(p => p.id === id);
    if (it?.url) URL.revokeObjectURL(it.url);
    return prev.filter(p => p.id !== id);
  });
  const clearMany = () => { many.forEach(m => m.url && URL.revokeObjectURL(m.url)); setMany([]); };
  const addImages = (fl: FileList) => {
    const imgs = Array.from(fl).filter(isImg).map(f => ({ id: nextId(), file: f, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...imgs]);
  };
  const removeImage = (id: number) => setImages(prev => {
    const it = prev.find(p => p.id === id);
    if (it?.url) URL.revokeObjectURL(it.url);
    return prev.filter(p => p.id !== id);
  });
  const setAvatarFile = (fl: FileList) => {
    const f = fl[0];
    if (!isImg(f)) return;
    if (avatar?.url) URL.revokeObjectURL(avatar.url);
    setAvatar({ id: nextId(), file: f, url: URL.createObjectURL(f) });
  };

  const totalSize = many.reduce((s, i) => s + i.file.size, 0);

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / File Uploads</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>File Uploads</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Basic button inputs --- */}
        <Section isDark={isDark} title="Basic Inputs" hint="Simple browse-button inputs for single and multiple file selection.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ButtonInput isDark={isDark} label="Single file" />
            <ButtonInput isDark={isDark} label="Multiple files" multiple />
          </div>
        </Section>

        {/* --- Single drag & drop --- */}
        <Section isDark={isDark} title="Drag & Drop — Single" hint="Drop a file onto the zone or click to browse. The zone highlights while dragging.">
          <Dropzone isDark={isDark} onFiles={addSingle} title="Drag & drop a file here" subtitle="or click to browse · max 10 MB" />
          <AnimatePresence>
            {single && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                <FileRow isDark={isDark} item={single} onRemove={() => { if (single.url) URL.revokeObjectURL(single.url); setSingle(null); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* --- Multiple drag & drop --- */}
        <Section isDark={isDark} title="Drag & Drop — Multiple" hint="Queue any number of files, each with its own upload progress.">
          <Dropzone isDark={isDark} onFiles={addMany} multiple title="Drag & drop files here" subtitle="or click to browse — multiple allowed" />
          {many.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-4 mb-2.5">
                <span className="text-[12px] font-semibold" style={{ color: sec }}>{many.length} file{many.length > 1 ? 's' : ''} · {fmtSize(totalSize)}</span>
                <button type="button" onClick={clearMany} className="text-[11.5px] font-semibold transition-opacity hover:opacity-70" style={{ color: ACCENT }}>Clear all</button>
              </div>
              <div className="flex flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {many.map(it => (
                    <FileRow key={it.id} isDark={isDark} item={it} onRemove={() => removeMany(it.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </Section>

        {/* --- Image dropzone with previews --- */}
        <Section isDark={isDark} title="Image Dropzone" hint="Drop images to see instant thumbnail previews. Hover a thumbnail to remove it.">
          <Dropzone isDark={isDark} onFiles={addImages} multiple accept="image/*" title="Drag & drop images here" subtitle="PNG, JPG, GIF, WebP" />
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
              <AnimatePresence initial={false}>
                {images.map(it => (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="relative group rounded-xl overflow-hidden aspect-square"
                    style={{ border: `1px solid ${border}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <button
                        type="button"
                        onClick={() => removeImage(it.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(244,63,94,0.9)', color: '#fff' }}
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[9px] truncate" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>{it.file.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Section>

        {/* --- Avatar upload --- */}
        <Section isDark={isDark} title="Avatar Upload" hint="A compact circular dropzone — drop or click to set a profile picture.">
          <div className="flex items-center gap-6">
            <AvatarDrop isDark={isDark} avatar={avatar} onFiles={setAvatarFile} onClear={() => { if (avatar?.url) URL.revokeObjectURL(avatar.url); setAvatar(null); }} />
            <div className="text-[12.5px] leading-relaxed" style={{ color: sec }}>
              <p className="font-semibold" style={{ color: pri }}>Profile picture</p>
              <p className="mt-1" style={{ color: mut }}>Drag an image onto the circle or click it to browse.<br />Square images work best · JPG or PNG.</p>
            </div>
          </div>
        </Section>

      </div>
    </motion.div>
  );
}

/* ===================================================================== *
 *  Avatar dropzone (circular)                                           *
 * ===================================================================== */
function AvatarDrop({ isDark, avatar, onFiles, onClear }: { isDark: boolean; avatar: UItem | null; onFiles: (fl: FileList) => void; onClear: () => void }) {
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative shrink-0">
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={e => { e.preventDefault(); setDrag(false); }}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
        className="w-24 h-24 rounded-full flex items-center justify-center cursor-pointer overflow-hidden transition-colors duration-200 group"
        style={{
          border: `2px dashed ${drag ? ACCENT : border}`,
          background: drag ? (isDark ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--primary-rgb), 0.06)') : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
        }}
      >
        {avatar?.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar.url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
              <Camera size={22} />
            </div>
          </>
        ) : (
          <motion.div animate={{ scale: drag ? 1.12 : 1 }} style={{ color: drag ? ACCENT : mut }}>
            <Camera size={26} />
          </motion.div>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {avatar && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onClear(); }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: '#f43f5e', color: '#fff', border: `2px solid ${isDark ? 'var(--background)' : '#fff'}` }}
          aria-label="Remove avatar"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
