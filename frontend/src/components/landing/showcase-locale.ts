import type { Locale } from '@/i18n';
import {
  BOARD_META,
  DEMO_ANALYTICS,
  DEMO_CAL_EVENTS,
  DEMO_CHAT_SEED,
  DEMO_CHECKLIST_CARDS,
  DEMO_DEPARTMENTS,
  DEMO_MAIL,
  DEMO_PEOPLE,
  DEMO_RBAC_MATRIX,
  DEMO_SHEETS_LOG,
  DEMO_WORK_TRENDS,
  INITIAL_BOARD,
  INITIAL_MY_TASKS,
  PRESENCE_DEMO,
  PRIORITY_META,
  RBAC_COLS,
  type BoardCard,
  type BoardColId,
  type DemoPerson,
  type ListTask,
} from './showcase-seed';

/** Chrome labels inside landing product demos */
export function demoChrome(lang: Locale) {
  if (lang === 'fa') {
    return {
      list: 'فهرست',
      kanban: 'کانبان',
      overview: 'نمای کلی',
      searchDepts: 'جستجوی بخش…',
      newDepartment: 'بخش جدید',
      departments: 'بخش‌های اداره',
      people: 'افراد',
      openTasks: 'وظایف باز',
      overall: 'کل',
      open: 'باز',
      done: 'انجام‌شده',
      overdue: 'معوق',
      cardMoved: 'کارت جابه‌جا شد',
      cardAdded: 'کارت به «انجام‌دادنی» اضافه شد',
      newCard: 'کارت جدید — نام را تغییر دهید',
      sentToReview: 'به «در حال بررسی» ارسال شد — سازنده باید قبل از تکمیل تأیید کند',
      dropHere: 'وظایف را اینجا رها کنید',
      approvedHere: 'وظایف تأییدشده اینجا می‌آیند',
      chats: 'گفتگوها',
      letters: 'نامه‌ها',
      saved: 'ذخیره‌ها',
      connected: 'متصل',
      notConnected: 'متصل نیست',
      connectHint: 'برای خروجی/ورود برد متصل شوید',
      exportBoard: 'خروجی برد',
      exporting: 'در حال خروجی…',
      importSheet: 'ورود شیت',
      importing: 'در حال ورود…',
      justNow: 'همین الان',
      prev: 'قبلی',
      today: 'امروز',
      next: 'بعدی',
      meeting: 'جلسه',
      ceremony: 'مراسم',
      reminder: 'یادآور',
      event: 'رویداد',
      task: 'وظیفه',
      inAppMeet: 'جلسه داخل اپ',
      inPerson: 'حضوری',
      externalLink: 'لینک خارجی',
      ok: 'خوب',
      watch: 'مراقب',
      weakEstimate: 'برآورد ضعیف',
      available: 'در دسترس',
      inMeeting: 'در جلسه',
      away: 'غایب',
      onLeave: 'مرخصی',
      offline: 'آفلاین',
      urgent: 'فوری',
      high: 'بالا',
      medium: 'متوسط',
      low: 'پایین',
      you: 'شما',
      messagePlaceholder: 'پیام بنویسید…',
      startTask: 'شروع وظیفه',
      endOfTask: 'پایان وظیفه',
      optional2fa: 'احراز هویت دو مرحله‌ای اختیاری',
      all: 'همه',
      guests: 'مهمان‌ها',
      members: 'اعضا',
      upcoming: 'آینده',
      dayEvents: 'رویدادهای روز',
      mon: 'د',
      tue: 'س',
      wed: 'چ',
      thu: 'پ',
      fri: 'ج',
      sat: 'ش',
      sun: 'ی',
      todo: 'انجام‌دادنی',
      onProcess: 'در حال انجام',
      onReview: 'در حال بررسی',
      completed: 'تکمیل‌شده',
      boards: 'بردها',
      chat: 'گفتگو',
      billing: 'صورتحساب',
      analytics: 'تحلیل‌ها',
      transfer: 'انتقال',
      owner: 'مالک',
      admin: 'ادمین',
      manager: 'مدیر',
      member: 'عضو',
      guest: 'مهمان',
      onTimeRate: 'نرخ به‌موقع',
      openDelays: 'تأخیرهای باز',
      extensions: 'تمدیدها',
      leadBalance: 'تعادل لید',
      tasksDone: 'وظایف انجام‌شده',
      avgCycle: 'میانگین چرخه',
    } as const;
  }
  return {
    list: 'List',
    kanban: 'Kanban',
    overview: 'Overview',
    searchDepts: 'Search departments…',
    newDepartment: 'New Department',
    departments: 'Departments',
    people: 'People',
    openTasks: 'Open tasks',
    overall: 'Overall',
    open: 'Open',
    done: 'Done',
    overdue: 'Overdue',
    cardMoved: 'Card moved',
    cardAdded: 'Card added to To Do',
    newCard: 'New card — rename me',
    sentToReview: 'Sent to On Review — creator must approve before Completed',
    dropHere: 'Drop tasks here',
    approvedHere: 'Approved tasks land here',
    chats: 'Chats',
    letters: 'Letters',
    saved: 'Saved',
    connected: 'Connected',
    notConnected: 'Not connected',
    connectHint: 'Connect to export / import boards',
    exportBoard: 'Export board',
    exporting: 'Exporting…',
    importSheet: 'Import sheet',
    importing: 'Importing…',
    justNow: 'Just now',
    prev: 'Prev',
    today: 'Today',
    next: 'Next',
    meeting: 'Meeting',
    ceremony: 'Ceremony',
    reminder: 'Reminder',
    event: 'Event',
    task: 'Task',
    inAppMeet: 'In-app Meet',
    inPerson: 'In person',
    externalLink: 'External link',
    ok: 'OK',
    watch: 'Watch',
    weakEstimate: 'Weak estimates',
    available: 'Available',
    inMeeting: 'In a meeting',
    away: 'Away',
    onLeave: 'On leave',
    offline: 'Offline',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    you: 'You',
    messagePlaceholder: 'Write a message…',
    startTask: 'Start task',
    endOfTask: 'End of task',
    optional2fa: '2FA optional',
    all: 'All',
    guests: 'Guests',
    members: 'Members',
    upcoming: 'Upcoming',
    dayEvents: 'Day events',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
    todo: 'To Do',
    onProcess: 'On Process',
    onReview: 'On Review',
    completed: 'Completed',
    boards: 'Boards',
    chat: 'Chat',
    billing: 'Billing',
    analytics: 'Analytics',
    transfer: 'Transfer',
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    member: 'Member',
    guest: 'Guest',
    onTimeRate: 'On-time rate',
    openDelays: 'Open delays',
    extensions: 'Extensions',
    leadBalance: 'Lead balance',
    tasksDone: 'Tasks done',
    avgCycle: 'Avg cycle',
  } as const;
}

export type DemoChrome = ReturnType<typeof demoChrome>;

const BOARD_TITLES_FA: Record<BoardColId, string> = {
  todo: 'انجام‌دادنی',
  progress: 'در حال انجام',
  review: 'در حال بررسی',
  done: 'تکمیل‌شده',
};

const CARD_TITLES_FA: Record<string, string> = {
  c1: 'وایرفریم جریان پرداخت',
  c2: 'قرارداد API فاکتورها',
  c6: 'حالت خالی برای مهمان‌ها',
  c3: 'بهبود کشیدن کانبان',
  c7: 'ضربان حضور',
  c4: 'ایمیل دعوت بخش',
  c5: 'سخت‌سازی نشست SSO',
  c8: 'دارایی‌های لوگو در public/',
};

const TASK_TITLES_FA: Record<string, string> = {
  t1: 'بازبینی PR #۴۸۲',
  t2: 'به‌روزرسانی متن صورتحساب',
  t3: 'پر کردن فضای کاری دمو',
  t4: 'QA پوشش جلسه',
  t5: 'ورود تقویم ICS',
  t6: 'ممیزی دسترسی مهمان',
  t7: 'خروجی عملکرد بخش',
  t8: 'رفع اعلان منشن',
};

const DEPT_FA: Record<string, string> = {
  Engineering: 'مهندسی',
  Product: 'محصول',
  Operations: 'عملیات',
  Finance: 'مالی',
  Eng: 'مهندسی',
  Prod: 'محصول',
  Ops: 'عملیات',
  Fin: 'مالی',
};

const ROLE_FA: Record<string, string> = {
  Manager: 'مدیر',
  Supervisor: 'سرپرست',
  Member: 'عضو',
  Guest: 'مهمان',
  Admin: 'ادمین',
  Owner: 'مالک',
};

const LABEL_FA: Record<string, string> = {
  Design: 'طراحی',
  UX: 'تجربه کاربری',
  Backend: 'بک‌اند',
  Frontend: 'فرانت‌اند',
  Realtime: 'لحظه‌ای',
  Ops: 'عملیات',
  Security: 'امنیت',
  Brand: 'برند',
};

export function localizedBoardMeta(lang: Locale) {
  if (lang !== 'fa') return BOARD_META;
  return BOARD_META.map((m) => ({ ...m, title: BOARD_TITLES_FA[m.id] }));
}

export function localizedInitialBoard(lang: Locale): Record<BoardColId, BoardCard[]> {
  if (lang !== 'fa') {
    return JSON.parse(JSON.stringify(INITIAL_BOARD)) as Record<BoardColId, BoardCard[]>;
  }
  const clone = JSON.parse(JSON.stringify(INITIAL_BOARD)) as Record<BoardColId, BoardCard[]>;
  (Object.keys(clone) as BoardColId[]).forEach((col) => {
    clone[col] = clone[col].map((c) => ({
      ...c,
      title: CARD_TITLES_FA[c.id] || c.title,
      labels: c.labels.map((l) => LABEL_FA[l] || l),
      due: c.due
        .replace('Jul', 'ژوئیه')
        .replace('Aug', 'اوت'),
    }));
  });
  return clone;
}

export function localizedMyTasks(lang: Locale): ListTask[] {
  if (lang !== 'fa') return JSON.parse(JSON.stringify(INITIAL_MY_TASKS)) as ListTask[];
  return INITIAL_MY_TASKS.map((t) => ({
    ...t,
    title: TASK_TITLES_FA[t.id] || t.title,
    board: DEPT_FA[t.board] || t.board,
    due: t.due
      .replace('Today', 'امروز')
      .replace('Tomorrow', 'فردا')
      .replace('Yesterday', 'دیروز')
      .replace('Next week', 'هفته بعد')
      .replace('Fri', 'جمعه')
      .replace('Mon', 'دوشنبه'),
    milestones: t.milestones.map((m) => ({
      ...m,
      label:
        ({
          'Read diff': 'خواندن تغییرات',
          'Leave notes': 'ثبت یادداشت',
          Draft: 'پیش‌نویس',
          'Legal check': 'بررسی حقوقی',
          'Seed boards': 'پر کردن بردها',
          'Seed analytics': 'پر کردن تحلیل',
          'AV test': 'تست صدا و تصویر',
          'Share screen': 'اشتراک صفحه',
          'Parse ICS': 'پردازش ICS',
          'UI polish': 'پرداخت UI',
          Matrix: 'ماتریس',
          CSV: 'CSV',
          Sheets: 'شیت‌ها',
          Reproduce: 'بازتولید',
          Patch: 'پچ',
        } as Record<string, string>)[m.label] || m.label,
    })),
  }));
}

export function localizedPeople(lang: Locale): DemoPerson[] {
  if (lang !== 'fa') return DEMO_PEOPLE;
  return DEMO_PEOPLE.map((p) => ({
    ...p,
    role: ROLE_FA[p.role] || p.role,
    dept: p.dept ? DEPT_FA[p.dept] || p.dept : p.dept,
    title:
      ({
        'Eng Manager': 'مدیر مهندسی',
        'Tech Lead': 'لید فنی',
        'Product Designer': 'طراح محصول',
        'Ops Specialist': 'متخصص عملیات',
        Partner: 'شریک',
        'Finance Lead': 'لید مالی',
      } as Record<string, string>)[p.title || ''] || p.title,
  }));
}

export function localizedPresence(lang: Locale) {
  const c = demoChrome(lang);
  return {
    available: { label: c.available, color: PRESENCE_DEMO.available.color },
    meeting: { label: c.inMeeting, color: PRESENCE_DEMO.meeting.color },
    away: { label: c.away, color: PRESENCE_DEMO.away.color },
    leave: { label: c.onLeave, color: PRESENCE_DEMO.leave.color },
    offline: { label: c.offline, color: PRESENCE_DEMO.offline.color },
  };
}

export function localizedPriority(lang: Locale) {
  const c = demoChrome(lang);
  return {
    URGENT: { ...PRIORITY_META.URGENT, label: c.urgent },
    HIGH: { ...PRIORITY_META.HIGH, label: c.high },
    MEDIUM: { ...PRIORITY_META.MEDIUM, label: c.medium },
    LOW: { ...PRIORITY_META.LOW, label: c.low },
  };
}

export function localizedDepartments(lang: Locale) {
  if (lang !== 'fa') return DEMO_DEPARTMENTS;
  return DEMO_DEPARTMENTS.map((d) => ({
    ...d,
    name: DEPT_FA[d.name] || d.name,
  }));
}

export function localizedAnalytics(lang: Locale) {
  if (lang !== 'fa') return DEMO_ANALYTICS;
  const c = demoChrome(lang);
  return {
    ...DEMO_ANALYTICS,
    kpis: [
      { label: c.onTimeRate, value: '۸۶٪', delta: '+۴٫۲٪', good: true },
      { label: c.openDelays, value: '۱۲', delta: '−۳', good: true },
      { label: c.extensions, value: '۹', delta: '+۱', good: false },
      { label: c.leadBalance, value: '۷۴٪', delta: 'خوب', good: true },
      { label: c.tasksDone, value: '۲۴۸', delta: '+۳۱', good: true },
      { label: c.avgCycle, value: '۳٫۴ر', delta: '−۰٫۶ر', good: true },
    ],
    bars: DEMO_ANALYTICS.bars.map((b) => ({ ...b, name: DEPT_FA[b.name] || b.name })),
    weekly: [
      { day: 'د', completed: 18, delayed: 4 },
      { day: 'س', completed: 22, delayed: 3 },
      { day: 'چ', completed: 19, delayed: 5 },
      { day: 'پ', completed: 27, delayed: 2 },
      { day: 'ج', completed: 24, delayed: 3 },
      { day: 'ش', completed: 8, delayed: 1 },
      { day: 'ی', completed: 5, delayed: 0 },
    ],
    statusMix: [
      { name: c.completed, value: 42, color: '#22C55E' },
      { name: c.onProcess, value: 28, color: '#F59E0B' },
      { name: c.onReview, value: 18, color: '#F43F5E' },
      { name: c.todo, value: 12, color: '#3B82F6' },
    ],
  };
}

export function localizedChat(lang: Locale) {
  if (lang !== 'fa') return DEMO_CHAT_SEED;
  return {
    rooms: DEMO_CHAT_SEED.rooms.map((r) => ({
      ...r,
      name:
        ({
          general: 'عمومی',
          engineering: 'مهندسی',
          product: 'محصول',
        } as Record<string, string>)[r.name] || r.name,
    })),
    messages: DEMO_CHAT_SEED.messages.map((m) => ({
      ...m,
      from: m.me ? (lang === 'fa' ? 'شما' : m.from) : m.from,
      text:
        ({
          m1: 'استندآپ تا ۱۰ دقیقه دیگر — از اتاق برد می‌آیم.',
          m2: 'جلسه HD را شروع می‌کنم — اشتراک صفحه ۱۰۸۰p.',
          m3: 'در راهم. کانبان اسپرینت ۲۴ را به اشتراک می‌گذارم.',
          m4: 'PR #۴۸۲ آماده بازبینی است.',
          m5: 'می‌توانی ساعت ۱۰ به بازبینی Q3 بیایی؟',
          m6: 'جشن سالگرد شرکت در تقویم است — ۲۷ ژوئیه.',
        } as Record<string, string>)[m.id] || m.text,
      time: m.time.replace('Yesterday', 'دیروز'),
    })),
  };
}

export function localizedCalEvents(lang: Locale) {
  if (lang !== 'fa') return DEMO_CAL_EVENTS;
  const map: Record<string, { title: string; desc?: string; zone?: string }> = {
    ev1: { title: 'بازبینی محصول', desc: 'قفل محدوده اسپرینت ۲۴ با لیدهای محصول و مهندسی.', zone: 'جلسه اینترهاب' },
    ev2: { title: 'بازبینی PR #۴۸۲', desc: 'سررسید روی برد پلتفرم · اختصاص به شما.', zone: 'برد پلتفرم' },
    ev3: { title: 'نقد طراحی', desc: 'مرور وایرفریم پرداخت.', zone: 'طبقه ۳ · استودیو' },
    ev4: { title: 'بازدید سایت مشتری', desc: 'بازدید عملیات با میرا (مهمان).', zone: 'نووا · دروازه B' },
    ev5: { title: 'مهلت برد', desc: 'سررسید قرارداد API فاکتور.', zone: 'برد رشد' },
    ev6: { title: 'ارسال گزارش هزینه Q3', desc: 'یادآور نرم — بدون جلسه.', zone: 'مالی' },
    ev7: { title: 'سالگرد شرکت', desc: 'جشن · کیک، جوایز و شرکای مهمان.', zone: 'تراس بام' },
    ev8: { title: 'لایو همهٔ شرکت', desc: 'اگر حضوری نمی‌رسید با لینک خارجی بپیوندید.', zone: 'meet.enterhub.app/allhands' },
    ev9: { title: 'همگام‌سازی لید', desc: 'بازتوزیع افراد پربار.', zone: 'جلسه اینترهاب' },
  };
  return DEMO_CAL_EVENTS.map((e) => ({
    ...e,
    title: map[e.id]?.title || e.title,
    desc: map[e.id]?.desc || e.desc,
    zone: map[e.id]?.zone || e.zone,
    priority:
      e.priority === 'High' ? ('بالا' as 'High') : e.priority === 'Low' ? ('پایین' as 'Low') : e.priority === 'Normal' ? ('عادی' as 'Normal') : e.priority,
  }));
}

export function localizedMail(lang: Locale) {
  if (lang !== 'fa') return DEMO_MAIL;
  return [
    { ...DEMO_MAIL[0], subject: 'اولویت‌های برد Q3', preview: 'می‌توانیم محدوده اسپرینت ۲۴ را قبل از استندآپ پنجشنبه قفل کنیم؟', time: '۰۸:۴۰' },
    { ...DEMO_MAIL[1], from: 'صورتحساب', subject: 'تمدید پلن پایه', preview: 'پلن سالانه پایه در ۱۲ اوت تمدید می‌شود — ۱۰ صندلی.', time: 'دیروز' },
    { ...DEMO_MAIL[2], subject: 'دسترسی مهمان برای میرا', preview: 'برد پلتفرم را به اشتراک گذاشتم — فقط نظر نیاز دارد.', time: 'دوشنبه' },
    { ...DEMO_MAIL[3], from: 'شما', subject: 'باز: خروجی تحلیل بخش', preview: 'CSV و شیت برای عملیات صادر شد — پیوست.', time: 'یکشنبه' },
  ];
}

export function localizedChecklist(lang: Locale) {
  if (lang !== 'fa') return DEMO_CHECKLIST_CARDS;
  return [
    { ...DEMO_CHECKLIST_CARDS[0], title: 'انتشار دموی لندینگ' },
    { ...DEMO_CHECKLIST_CARDS[1], title: 'تأیید ایمیل‌های دعوت' },
    { ...DEMO_CHECKLIST_CARDS[2], title: 'پیگیری سخت‌سازی SSO' },
  ];
}

export function localizedSheetsLog(lang: Locale) {
  if (lang !== 'fa') return DEMO_SHEETS_LOG;
  return [
    { id: 's1', name: 'خروجی برد مهندسی', when: '۲ ساعت پیش', dir: 'export' as const },
    { id: 's2', name: 'وظایف من — ژوئیه', when: 'دیروز', dir: 'export' as const },
    { id: 's3', name: 'ورود · شیت بک‌لاگ', when: '۳ روز پیش', dir: 'import' as const },
  ];
}

export function localizedRbac(lang: Locale) {
  const c = demoChrome(lang);
  if (lang !== 'fa') return { cols: RBAC_COLS, matrix: DEMO_RBAC_MATRIX };
  return {
    cols: [c.boards, c.chat, c.members, c.billing, c.analytics, c.transfer],
    matrix: [
      { role: c.owner, flags: DEMO_RBAC_MATRIX[0].flags },
      { role: c.admin, flags: DEMO_RBAC_MATRIX[1].flags },
      { role: c.manager, flags: DEMO_RBAC_MATRIX[2].flags },
      { role: c.member, flags: DEMO_RBAC_MATRIX[3].flags },
      { role: c.guest, flags: DEMO_RBAC_MATRIX[4].flags },
    ],
  };
}

export function localizedWorkTrends(lang: Locale) {
  if (lang !== 'fa') return DEMO_WORK_TRENDS;
  const c = demoChrome(lang);
  return {
    ...DEMO_WORK_TRENDS,
    creators: DEMO_WORK_TRENDS.creators.map((x) => ({
      ...x,
      signalLabel:
        x.signal === 'ok' ? c.ok : x.signal === 'watch' ? c.watch : c.weakEstimate,
    })),
  };
}
