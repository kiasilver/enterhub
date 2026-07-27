'use client';

import { useId, useState } from 'react';
import { RiStarFill } from 'react-icons/ri';
import { motion, type Variants } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { textPrimary, textMuted, glassStyle } from './theme';

interface Props {
  isDark: boolean;
}

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } } };

// ── 1. Review filter ──
function RatingFilter() {
  const id = useId();
  const rows: [string, string, number][] = [
    ['all', '12,921', 0],
    ['5-stars', '5,168', 5],
    ['4-stars', '4,726', 4],
    ['3-stars', '3,234', 3],
    ['2-stars', '1,842', 2],
    ['1-star', '452', 1],
  ];
  return (
    <RadioGroup defaultValue="all">
      {rows.map(([value, count, stars], idx) => (
        <div className="flex items-center gap-2" key={value}>
          <RadioGroupItem id={`${id}-${idx}`} value={value} />
          <Label className="inline-flex items-center gap-1" htmlFor={`${id}-${idx}`}>
            {stars === 0 ? (
              'All reviews'
            ) : (
              <span aria-hidden="true" className="inline-flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <RiStarFill className={i < stars ? '' : 'opacity-30'} key={i} size={16} />
                ))}
              </span>
            )}{' '}
            <span className="font-normal text-muted-foreground text-xs leading-[inherit]">({count})</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

// ── 2. Interactive star input ──
function StarInput() {
  const id = useId();
  const [hoverRating, setHoverRating] = useState('');
  const [currentRating, setCurrentRating] = useState('');
  return (
    <fieldset className="space-y-4">
      <legend className="font-medium text-foreground text-sm leading-none">Rate your experience</legend>
      <RadioGroup className="inline-flex gap-0" onValueChange={setCurrentRating}>
        {['1', '2', '3', '4', '5'].map((value) => (
          <label
            className="group relative cursor-pointer rounded p-0.5 outline-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
            key={value}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating('')}
          >
            <RadioGroupItem className="sr-only" id={`${id}-${value}`} value={value} />
            <RiStarFill
              className={`transition-all ${(hoverRating || currentRating) >= value ? 'text-amber-500' : 'text-input'} group-hover:scale-110`}
              size={24}
            />
            <span className="sr-only">{value} star{value === '1' ? '' : 's'}</span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

// ── 3. Feedback dialog ──
function FeedbackDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Rating</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">Help us improve</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <form className="space-y-5">
            <div className="space-y-4">
              <div>
                <fieldset className="space-y-4">
                  <legend className="font-semibold text-foreground text-lg leading-none">How hard was it to set up your account?</legend>
                  <RadioGroup className="-space-x-px flex gap-0 rounded-md shadow-xs">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
                      <label
                        className="relative flex size-9 flex-1 cursor-pointer flex-col items-center justify-center gap-3 border border-input text-center text-sm outline-none transition-[color,box-shadow] first:rounded-s-md last:rounded-e-md has-data-[state=checked]:z-10 has-data-disabled:cursor-not-allowed has-data-[state=checked]:border-[#f59e0b]/50 has-focus-visible:border-ring has-data-disabled:opacity-50 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                        key={number}
                      >
                        <RadioGroupItem className="sr-only after:absolute after:inset-0" id={`radio-17-r${number}`} value={number.toString()} />
                        {number}
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>
                <div className="mt-2 flex justify-between text-muted-foreground text-xs">
                  <p>Very easy</p>
                  <p>Very dificult</p>
                </div>
              </div>

              <div className="*:not-first:mt-2">
                <Label>Why did you give this rating?</Label>
                <Textarea aria-label="Send feedback" id="feedback" placeholder="How can we improve Enterhub?" />
              </div>
            </div>
            <Button className="w-full" type="button">Send feedback</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 4. Emoji slider ──
function EmojiSlider() {
  const [value, setValue] = useState([3]);
  const emojis = ['😡', '🙁', '😐', '🙂', '😍'];
  const labels = ['Awful', 'Poor', 'Okay', 'Good', 'Amazing'];
  return (
    <div className="*:not-first:mt-3">
      <Label>Rate your experience</Label>
      <div className="flex items-center gap-2">
        <Slider
          aria-label="Rate your experience"
          max={5}
          min={1}
          onValueChange={setValue}
          showTooltip
          tooltipContent={(v) => labels[v - 1]}
          value={value}
        />
        <span className="text-2xl">{emojis[value[0] - 1]}</span>
      </div>
    </div>
  );
}

function Demo({ title, isDark, children }: { title: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.div variants={item} className="rounded-2xl p-6" style={glassStyle(isDark)}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary(isDark) }}>{title}</h3>
      {children}
    </motion.div>
  );
}

export default function SafeRatings({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Advance UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Ratings</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Review filters, star inputs, a feedback dialog, and an emoji slider.</p>
      </motion.div>

      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Demo title="Customer reviews" isDark={isDark}><RatingFilter /></Demo>
        <Demo title="Rate your experience" isDark={isDark}><StarInput /></Demo>
        <Demo title="Feedback dialog" isDark={isDark}><FeedbackDialog /></Demo>
        <Demo title="Emoji slider" isDark={isDark}><EmojiSlider /></Demo>
      </div>
    </motion.div>
  );
}
