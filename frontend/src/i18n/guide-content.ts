export type GuideRoleId =
  | 'founder'
  | 'manager'
  | 'supervisor'
  | 'member'
  | 'guest';

export type GuideTopicId =
  | 'start'
  | 'workspace'
  | 'invite'
  | 'projects'
  | 'tasks'
  | 'myTasks'
  | 'departments'
  | 'chat'
  | 'meetings'
  | 'calendar'
  | 'email'
  | 'gallery'
  | 'team'
  | 'account'
  | 'settings'
  | 'roles'
  | 'audit'
  | 'billing'
  | 'analytics'
  | 'sheets';

export type GuideArticle = {
  title: string;
  summary: string;
  steps: string[];
  tips: string[];
};

export type GuideRole = {
  title: string;
  subtitle: string;
  bullets: string[];
  topics: GuideTopicId[];
};

export type GuideCopy = {
  roles: Record<GuideRoleId, GuideRole>;
  topics: Record<GuideTopicId, GuideArticle>;
};

export const GUIDE_TOPIC_ORDER: GuideTopicId[] = [
  'start',
  'workspace',
  'invite',
  'projects',
  'tasks',
  'myTasks',
  'departments',
  'chat',
  'meetings',
  'calendar',
  'email',
  'gallery',
  'team',
  'account',
  'settings',
  'roles',
  'audit',
  'billing',
  'analytics',
  'sheets',
];

export const GUIDE_ROLE_ORDER: GuideRoleId[] = [
  'founder',
  'manager',
  'supervisor',
  'member',
  'guest',
];

const en: GuideCopy = {
  roles: {
    founder: {
      title: 'Founder / owner',
      subtitle: 'You set up the company workspace and can do everything.',
      bullets: [
        'Create the workspace, branding, and plan',
        'Invite the first managers and departments',
        'Transfer ownership later if needed',
      ],
      topics: [
        'start',
        'workspace',
        'invite',
        'projects',
        'departments',
        'settings',
        'roles',
        'audit',
        'billing',
        'analytics',
        'meetings',
        'email',
        'team',
        'account',
        'sheets',
      ],
    },
    manager: {
      title: 'Department manager',
      subtitle: 'You run a unit: people, projects, approvals, and evaluations.',
      bullets: [
        'Invite accountants, interns, and supervisors',
        'Approve invites and completed tasks',
        'Watch department analytics and workload',
      ],
      topics: [
        'invite',
        'departments',
        'projects',
        'tasks',
        'analytics',
        'chat',
        'meetings',
        'email',
        'team',
        'account',
      ],
    },
    supervisor: {
      title: 'Supervisor',
      subtitle: 'You coach people day to day and invite employees.',
      bullets: [
        'Invite employees (managers approve if required)',
        'Assign and review tasks',
        'Use chat and meetings with the team',
      ],
      topics: ['invite', 'projects', 'tasks', 'myTasks', 'chat', 'meetings', 'calendar', 'team', 'account'],
    },
    member: {
      title: 'Member / employee',
      subtitle: 'You do the work: tasks, checklists, chat, and calendar.',
      bullets: [
        'Start and submit tasks from My Tasks',
        'Update checklists and comment on cards',
        'Chat, react, and join meetings',
      ],
      topics: ['start', 'myTasks', 'tasks', 'projects', 'chat', 'meetings', 'calendar', 'email', 'team', 'account'],
    },
    guest: {
      title: 'Guest / observer',
      subtitle: 'You view a private project as read-only.',
      bullets: [
        'Open only the boards you were invited to',
        'Read cards and comments — no edits',
        'Ask the owner if you need write access',
      ],
      topics: ['start', 'projects', 'tasks'],
    },
  },
  topics: {
    start: {
      title: 'Get started',
      summary:
        'Sign up with phone or email, join a workspace invite, or create your own company workspace.',
      steps: [
        'Open Sign up and verify with OTP (phone or email).',
        'If you received an invite, accept it from Home — or open the one-time /join link.',
        'To start a company, use Create a company workspace and pick a name.',
        'Open the sidebar: Home, Projects, My Tasks, Departments, Chat, Calendar, Email.',
      ],
      tips: [
        'The invite link works once and must match the invited email or phone.',
        'Switch language anytime — Persian uses a right-to-left layout.',
      ],
    },
    workspace: {
      title: 'Workspace home',
      summary:
        'Home shows your plan, members, cloud, upcoming tasks, recent projects, and company activity.',
      steps: [
        'Check the usage strip: plan, members, and cloud storage.',
        'Use Up next for tasks due today or tomorrow.',
        'Star projects you use daily — they stay on Home.',
        'Activity lists card and invite events across boards you can see.',
      ],
      tips: [
        'Members (not “seats”) is how many people are on the plan.',
        'If cloud is full, delete gallery files or buy more storage in Billing.',
      ],
    },
    invite: {
      title: 'Invite people',
      summary:
        'Add teammates by email or Iranian mobile. You can also copy a one-time join link.',
      steps: [
        'Go to Settings → Members (or Team).',
        'Enter email or 09… mobile, pick a role, and optionally one or more departments.',
        'Send invite — then copy the one-time link and send it yourself if needed.',
        'The person signs in with the same contact and accepts. After accept the link cannot be reused.',
        'Managers may need to approve. Admins can use Activate now to skip waiting.',
      ],
      tips: [
        'Supervisors can only invite employees. Managers can invite supervisors or members.',
        'One person can belong to several departments (for example Finance + IT).',
      ],
    },
    projects: {
      title: 'Projects & boards',
      summary:
        'A project is a board. List and Kanban live on the same Projects page — open a task without leaving.',
      steps: [
        'Open Projects. Use Kanban or List. Overview is charts and filters.',
        'Click a department column or expand a section to see its projects and tasks.',
        'Create a project: name, section, access (workspace or private), optional color and icon.',
        'Private projects need observers. Workspace projects are visible to everyone in the company.',
        'Hover a project card and use the pencil to edit — title is just “Edit project”.',
      ],
      tips: [
        'If you skip color/icon, Enterhub picks a palette and a letter mark.',
        'There is no separate board page for members — stay on Projects.',
      ],
    },
    tasks: {
      title: 'Tasks & checklists',
      summary:
        'Cards have assignees, an optional supervisor, dates, labels, attachments, and a checklist.',
      steps: [
        'Create a task from the project card or the + menu.',
        'Set start/due dates, people, supervisor, and labels.',
        'Checklist can include notes. Bookend items “Start task” and “End of task” have no note toggle.',
        'Start work, submit for review, then a manager approves or rejects.',
        'Open any task from Projects or My Tasks — the same details modal.',
      ],
      tips: [
        'Estimates and supervisor are optional.',
        'Approval can include a structured evaluation that feeds Analytics.',
      ],
    },
    myTasks: {
      title: 'My Tasks',
      summary: 'Your personal queue across every project — List or Kanban, live updates.',
      steps: [
        'Open My Tasks. Switch Kanban / List.',
        'Drag to In progress and check Start task on the checklist.',
        'Toggle checklist items inline; they update for everyone live.',
        'Move to Done to send the card to Review for approval.',
      ],
      tips: [
        'Due buckets help you clear overdue work first.',
        'Assigned vs Done tabs keep finished work out of the way.',
      ],
    },
    departments: {
      title: 'Departments',
      summary:
        'Departments are the org layer: managers, supervisors, members, and the projects under each unit.',
      steps: [
        'Open Departments to see units, people, and progress.',
        'Create a department and assign a manager.',
        'Put projects in a section (or leave them in General).',
        'Click a department to see its projects and tasks.',
      ],
      tips: [
        'Early-stage companies can put one person in several departments.',
        'Department analytics show if a unit is overloaded.',
      ],
    },
    chat: {
      title: 'Chat',
      summary: 'Channels, direct messages, letters, and saved messages — with reactions.',
      steps: [
        'Open Chat. Pick a channel or start a DM from Team members.',
        'Mention people with @, projects with #, files with attachments.',
        'React to any message — including your own. Double-click to like (👍).',
        'Open the reaction picker for recent and all icons (like WhatsApp / Telegram).',
      ],
      tips: [
        'Saved messages live under the Saved tab.',
        'Letters are formal internal mail, separate from IMAP email.',
      ],
    },
    meetings: {
      title: 'Calls in Chat',
      summary:
        'Calls live inside Chat — 1:1 from a direct message, or a group call from the camera button next to the chat tabs.',
      steps: [
        'Open Chat. For one person, open their DM and press Call.',
        'For several people, press the camera button beside Chats / Letters / Saved, pick teammates, then start the group call.',
        'You can also start a group call from a channel header — members are pre-selected.',
        'They get an incoming card. Accept opens Chat and joins the same room (up to 12 people).',
        'Use the dock: mic, camera, share screen, end. When you share, your screen fills the call so you can confirm it.',
      ],
      tips: [
        'There is no separate Meetings tab — stay in Chat.',
        'Allow camera, microphone, and display capture in the browser.',
      ],
    },
    calendar: {
      title: 'Calendar',
      summary: 'See task dates and workspace events. Persian locale uses a readable date picker.',
      steps: [
        'Open Calendar from the sidebar.',
        'Task due dates from boards appear on the calendar.',
        'Add workspace events when you have access.',
        'Switch calendar system in Account → Preferences if needed.',
      ],
      tips: [
        'Date pickers stay Gregorian numbers even in Persian UI.',
        'Use My Tasks due buckets together with Calendar.',
      ],
    },
    email: {
      title: 'Email',
      summary:
        'Internal workspace mail always works. To sync Gmail, Outlook, or company IMAP, connect a mailbox.',
      steps: [
        'If you see “Email is not connected”, open Settings → Email.',
        'Choose personal or organization mailbox.',
        'Enter address, IMAP host (Gmail: imap.gmail.com), port 993, username, and an app password.',
        'Connect mailbox, then Sync. Messages appear under Apps → Email.',
        'Internal Nexus mail (to teammates) does not need IMAP.',
      ],
      tips: [
        'Gmail and Outlook need an app password, not your normal login password.',
        'If sync fails, the error shows on the mailbox row — fix host/password and sync again.',
      ],
    },
    team: {
      title: 'Team directory',
      summary:
        'Team shows everyone in the workspace: role, departments, and who is online.',
      steps: [
        'Open Team in the sidebar.',
        'Filter by department or search a name.',
        'Open a person to see their role and departments.',
        'Invite more people from Settings → Members if you have access.',
      ],
      tips: [
        'Presence updates live — green means they are in the workspace now.',
        'Guests only appear on the private projects they can see.',
      ],
    },
    account: {
      title: 'Your account',
      summary:
        'Profile, password, 2FA, sessions, notifications, language, and support tickets are personal — not workspace settings.',
      steps: [
        'Open Account from the avatar menu.',
        'Profile: name, photo, and contact.',
        'Settings: password, two-factor, sessions, and notification prefs.',
        'Help: open the Help center or send a support ticket.',
      ],
      tips: [
        'Revoke other sessions if you signed in on a shared computer.',
        'Workspace billing lives under Settings → Billing, not Account.',
      ],
    },
    gallery: {
      title: 'Gallery & cloud',
      summary: 'Files shared in chat, boards, and uploads live in the workspace gallery.',
      steps: [
        'Open Settings → Gallery (or Media).',
        'Managers see every shared file; others may see only their uploads.',
        'Pick gallery images for the workspace logo.',
        'Watch the usage strip — buy more cloud if storage is full.',
      ],
      tips: [
        'Deleting unused photos frees space immediately.',
        'Attachments on cards also count toward cloud.',
      ],
    },
    settings: {
      title: 'Workspace settings',
      summary:
        'Branding, members, roles, labels, gallery, security, billing, email, integrations, and the activity log.',
      steps: [
        'Open Settings. Scroll the top tabs if they do not all fit.',
        'General: company name, light/dark logo, avatar color.',
        'Members invite people. Roles (next article) set the permission matrix.',
        'Labels are colored tags for tasks. Security covers 2FA and IP allowlist.',
        'Activity log (Audit) records invites, role edits, member changes, and plan updates.',
      ],
      tips: [
        'Only the owner can transfer ownership.',
        'Open the Roles and Activity log articles in this Help center for the full pages.',
      ],
    },
    roles: {
      title: 'Roles & permissions',
      summary:
        'Settings → Roles is the full access matrix: system roles on the left, a permission grid on the right, and New role for company position templates.',
      steps: [
        'Open Settings → Roles. You need the “Manage roles” permission (Owner and Org Admin have it).',
        'The header is “Roles & permissions”. The purple Access badge is only a label. New role opens the create form.',
        'The left list is every role. System (Owner, Org Admin, Board Admin, Member, Guest) shows “System” and a member count. Position or custom roles show “Position / custom”.',
        'Click a role to load it on the right. A pencil appears only on renameable roles — not on locked system names.',
        'System roles: the title is fixed. You still see the description and how many members have it. You cannot delete them. The Owner switches cannot be turned off.',
        'Custom / position roles: edit Role name and press Rename (or Enter). Description is optional. Delete is red and only works if nobody has the role — reassign people first.',
        'Save writes the name, description, and every permission toggle together.',
        'The grid is grouped: Workspace, Security, Billing, Departments, Analytics, People, Boards, Lists, Cards, Collaboration, Automations, Guests, and extras such as financial fields or labels.',
        'Each row is a human label (for example “Invite to a department”), not a raw code. Hold ⓘ to read what that switch actually allows.',
        'New role: search company positions (CEO, Accountant, IT Supervisor, …). Pick Custom role to start blank, or a template to prefill name, description, and switches. Then Create role or Cancel.',
        'Search also matches department names (Finance, IT / Engineering, HR, Marketing, Operations, Leadership).',
      ],
      tips: [
        'Locked system names stay in English in the database; the page always shows them in your language.',
        'A role with members cannot be deleted until those people are moved.',
        'Changing switches is not live until you press Save.',
        'Members and guests get their day-to-day access from this matrix — pair it with Settings → Members.',
      ],
    },
    audit: {
      title: 'Activity log',
      summary:
        'Settings → Activity log is the security trail: who did what, when, how serious it was, and from which IP.',
      steps: [
        'Open Settings → Activity log. You need “Read activity log” or “Manage roles”.',
        'The header explains that invites, roles, members, boards, and plan changes are recorded. The Trail badge is only a label.',
        'Search filters the table locally: action text, person name or email, severity, or IP.',
        'When is the local date and time of the event.',
        'Who is the member who did it (name, and email underneath). If there is no user, it shows System.',
        'What happened is a full sentence in your language — for example “Invite created”, “Role permissions updated”, “Member signed out of all devices”.',
        'Severity: Info (routine), Warning (sensitive: role or member changes), Critical (the most serious security events).',
        'IP is the address stored with that action, when the server captured it.',
        'Typical rows you will see: invite created / accepted / approved / rejected / activated now; member invited, updated, removed, or force-logged-out; role created, renamed, permissions updated, or deleted; board created or updated; workspace updated or security policies changed; ownership transferred; plan or extra cloud configured.',
      ],
      tips: [
        'The log does not replace chat history — only security-sensitive workspace actions.',
        'Search works in Persian or English (for example «دعوت» or invite).',
        'If the page is empty, nothing sensitive has been recorded yet, or you do not have access.',
      ],
    },
    billing: {
      title: 'Plans & billing',
      summary: 'Free, Base, and Advanced. Pay by card-to-card; extra cloud can be bought separately.',
      steps: [
        'Open Settings → Billing (or Manage plan on Home).',
        'Pick a plan and member count. Gift members may be included.',
        'Upload a card-to-card receipt if you upgrade.',
        'Cloud-only purchases add storage without changing the plan.',
      ],
      tips: [
        'Free stays available: projects, tasks, boards, calendar, evaluation.',
        '1:1 meetings live inside Chat — not on a separate tab or a third-party live page.',
      ],
    },
    analytics: {
      title: 'Analytics & evaluation',
      summary:
        'When a manager approves a task, Enterhub stores a score for that card — then rolls it into Analytics.',
      steps: [
        'Approve a submitted task and fill the evaluation if prompted.',
        'Open Analytics (company or department, based on your access).',
        'Lead view helps rebalance overloaded people.',
        'Work trends shows delays and estimate quality over time.',
      ],
      tips: [
        'This is not a year-end form — it happens on each approved task.',
        'Pair Lead with Departments when a unit is slipping.',
      ],
    },
    sheets: {
      title: 'Google Sheets',
      summary: 'Export a board or My Tasks to Drive, or import rows as cards.',
      steps: [
        'Open Settings → Integrations and connect Google.',
        'Live export creates a spreadsheet in your Drive.',
        'Bulk import: paste a Spreadsheet ID; existing card IDs are skipped.',
        'Recent sync links stay on that page.',
      ],
      tips: [
        'An admin must set Google client credentials on the server.',
        'Use import for kickoff lists, not as the daily board.',
      ],
    },
  },
};

const fa: GuideCopy = {
  roles: {
    founder: {
      title: 'مؤسس / مالک',
      subtitle: 'فضای کاری شرکت را می‌سازید و به همه چیز دسترسی دارید.',
      bullets: [
        'ساخت فضای کاری، هویت بصری و پلن',
        'دعوت اولین مدیران و بخش‌ها',
        'در صورت نیاز انتقال مالکیت',
      ],
      topics: [
        'start',
        'workspace',
        'invite',
        'projects',
        'departments',
        'settings',
        'roles',
        'audit',
        'billing',
        'analytics',
        'meetings',
        'email',
        'team',
        'account',
        'sheets',
      ],
    },
    manager: {
      title: 'مدیر بخش',
      subtitle: 'یک واحد را می‌گردانید: افراد، پروژه‌ها، تأییدها و ارزیابی.',
      bullets: [
        'دعوت حسابدار، کارآموز و سرپرست',
        'تأیید دعوت و وظایف تمام‌شده',
        'دیدن تحلیل و بار کاری بخش',
      ],
      topics: [
        'invite',
        'departments',
        'projects',
        'tasks',
        'analytics',
        'chat',
        'meetings',
        'email',
        'team',
        'account',
      ],
    },
    supervisor: {
      title: 'سرپرست',
      subtitle: 'کار روزمره تیم را جلو می‌برید و کارمند دعوت می‌کنید.',
      bullets: [
        'دعوت کارمند (در صورت نیاز تأیید مدیر)',
        'محول و بررسی وظیفه',
        'گفتگو و جلسه با تیم',
      ],
      topics: ['invite', 'projects', 'tasks', 'myTasks', 'chat', 'meetings', 'calendar', 'team', 'account'],
    },
    member: {
      title: 'عضو / کارمند',
      subtitle: 'کار را انجام می‌دهید: وظیفه، چک‌لیست، گفتگو و تقویم.',
      bullets: [
        'شروع و ارسال وظیفه از «وظایف من»',
        'به‌روز کردن چک‌لیست و نظر روی کارت',
        'گفتگو، واکنش و پیوستن به جلسه',
      ],
      topics: ['start', 'myTasks', 'tasks', 'projects', 'chat', 'meetings', 'calendar', 'email', 'team', 'account'],
    },
    guest: {
      title: 'مهمان / ناظر',
      subtitle: 'پروژه خصوصی را فقط مشاهده می‌کنید.',
      bullets: [
        'فقط بردهایی که دعوت شده‌اید باز می‌شوند',
        'خواندن کارت و نظر — بدون ویرایش',
        'برای دسترسی نوشتن از مالک بخواهید',
      ],
      topics: ['start', 'projects', 'tasks'],
    },
  },
  topics: {
    start: {
      title: 'شروع کار',
      summary:
        'با ایمیل یا موبایل ثبت‌نام کنید، دعوت را بپذیرید، یا خودتان فضای کاری شرکت بسازید.',
      steps: [
        'ثبت‌نام کنید و کد یک‌بارمصرف را وارد کنید.',
        'اگر دعوت دارید از خانه بپذیرید یا لینک یک‌بارمصرف /join را باز کنید.',
        'برای شرکت جدید از «ساخت فضای کاری شرکت» استفاده کنید.',
        'نوار کناری: خانه، پروژه‌ها، وظایف من، بخش‌ها، گفتگو، تقویم، ایمیل.',
      ],
      tips: [
        'لینک دعوت یک‌بار مصرف است و باید با همان ایمیل یا شماره باشد.',
        'زبان را هر زمان عوض کنید — فارسی راست‌به‌چپ است.',
      ],
    },
    workspace: {
      title: 'خانه فضای کاری',
      summary: 'خانه پلن، اعضا، فضای ابری، وظایف نزدیک، پروژه‌های اخیر و فعالیت شرکت را نشان می‌دهد.',
      steps: [
        'نوار مصرف را ببینید: پلن، اعضا و فضای ابری.',
        'از «بعدی» برای موعد امروز و فردا استفاده کنید.',
        'پروژه‌های پرکاربرد را ستاره کنید.',
        'فعالیت، رویداد کارت و دعوت را در بردهای قابل‌دسترسی نشان می‌دهد.',
      ],
      tips: [
        'برچسب اعضا یعنی تعداد افراد پلن — نه صندلی.',
        'اگر ابر پر شد، فایل گالری را حذف کنید یا فضای بیشتر بخرید.',
      ],
    },
    invite: {
      title: 'دعوت افراد',
      summary: 'هم‌تیمی را با ایمیل یا موبایل ایران اضافه کنید. لینک یک‌بارمصرف هم می‌سازید.',
      steps: [
        'به تنظیمات ← اعضا بروید.',
        'ایمیل یا ۰۹…، نقش و در صورت نیاز چند بخش را انتخاب کنید.',
        'دعوت را بفرستید و در صورت نیاز لینک یک‌بارمصرف را کپی کنید.',
        'فرد با همان تماس وارد می‌شود و می‌پذیرد. بعد از پذیرش لینک باطل است.',
        'ممکن است مدیر باید تأیید کند. ادمین می‌تواند «فعال‌سازی الان» بزند.',
      ],
      tips: [
        'سرپرست فقط کارمند دعوت می‌کند. مدیر می‌تواند سرپرست یا عضو دعوت کند.',
        'یک نفر می‌تواند در چند بخش باشد (مثلاً مالی + فناوری).',
      ],
    },
    projects: {
      title: 'پروژه‌ها و بردها',
      summary:
        'هر پروژه یک برد است. فهرست و کانبان روی همان صفحه پروژه‌ها هستند — تسک را بدون ترک صفحه باز کنید.',
      steps: [
        'وارد پروژه‌ها شوید. کانبان یا فهرست. نمای کلی برای نمودار و فیلتر است.',
        'ستون بخش را باز کنید تا پروژه‌ها و تسک‌ها را ببینید.',
        'پروژه بسازید: نام، بخش، دسترسی (فضای کاری یا خصوصی)، رنگ و آیکون اختیاری.',
        'پروژه خصوصی ناظر می‌خواهد. پروژه فضای کاری برای همه شرکت دیده می‌شود.',
        'روی کارت پروژه بروید و مداد را بزنید — عنوان فقط «ویرایش پروژه» است.',
      ],
      tips: [
        'اگر رنگ و آیکون نگذارید، پالت و حرف خودکار می‌آید.',
        'برای اعضا صفحه برد جدا نیست — روی پروژه‌ها بمانید.',
      ],
    },
    tasks: {
      title: 'وظایف و چک‌لیست',
      summary: 'کارت مسئول، سرپرست اختیاری، تاریخ، برچسب، پیوست و چک‌لیست دارد.',
      steps: [
        'تسک را از کارت پروژه یا منوی + بسازید.',
        'تاریخ، افراد، سرپرست و برچسب را بگذارید.',
        'چک‌لیست می‌تواند یادداشت داشته باشد. موارد «Start task» و «End of task» یادداشت ندارند.',
        'کار را شروع کنید، برای بررسی بفرستید، بعد مدیر تأیید یا رد می‌کند.',
        'تسک را از پروژه‌ها یا وظایف من باز کنید — همان پنجره جزئیات.',
      ],
      tips: [
        'تخمین و سرپرست اختیاری است.',
        'تأیید می‌تواند ارزیابی ساخت‌یافته داشته باشد که به تحلیل می‌رود.',
      ],
    },
    myTasks: {
      title: 'وظایف من',
      summary: 'صف شخصی شما از همه پروژه‌ها — فهرست یا کانبان، به‌روز زنده.',
      steps: [
        'وظایف من را باز کنید و کانبان / فهرست را عوض کنید.',
        'به «در حال انجام» بکشید و Start task را بزنید.',
        'آیتم چک‌لیست را همان‌جا عوض کنید؛ برای همه زنده است.',
        'به انجام‌شده ببرید تا برای تأیید مدیر برود.',
      ],
      tips: [
        'سطل موعد کمک می‌کند معوق‌ها را اول تمام کنید.',
        'تب محول‌شده و انجام‌شده کار تمام‌شده را جدا می‌کند.',
      ],
    },
    departments: {
      title: 'بخش‌ها',
      summary: 'بخش‌ها لایه سازمان هستند: مدیر، سرپرست، عضو و پروژه‌های هر واحد.',
      steps: [
        'بخش‌ها را باز کنید تا واحد، افراد و پیشرفت را ببینید.',
        'بخش بسازید و مدیر بگذارید.',
        'پروژه‌ها را در یک بخش بگذارید یا در عمومی بمانند.',
        'روی بخش کلیک کنید تا پروژه‌ها و تسک‌هایش را ببینید.',
      ],
      tips: [
        'اوایل کار یک نفر می‌تواند چند بخش را پوشش دهد.',
        'تحلیل بخش نشان می‌دهد کدام واحد شلوغ است.',
      ],
    },
    chat: {
      title: 'گفتگو',
      summary: 'کانال، پیام مستقیم، نامه و ذخیره‌ها — با واکنش.',
      steps: [
        'گفتگو را باز کنید. کانال انتخاب کنید یا از اعضا پیام مستقیم بسازید.',
        'با @ افراد، با # پروژه و با پیوست فایل را ذکر کنید.',
        'روی هر پیام — حتی پیام خودتان — واکنش بگذارید. دابل‌کلیک یعنی لایک.',
        'پنل واکنش، اخیراً استفاده‌شده و همه آیکون‌ها را نشان می‌دهد.',
      ],
      tips: [
        'پیام‌های ذخیره‌شده در تب ذخیره‌ها هستند.',
        'نامه‌ها پیام رسمی داخلی‌اند و به IMAP نیاز ندارند.',
      ],
    },
    meetings: {
      title: 'تماس در گفتگو',
      summary:
        'تماس داخل گفتگو است — یک‌به‌یک از پیام مستقیم، گروهی از دکمه دوربین کنار تب‌های گفتگو.',
      steps: [
        'گفتگو را باز کنید. برای یک نفر، پیام مستقیم را باز کنید و «تماس» را بزنید.',
        'برای چند نفر، دکمه دوربین کنار گفتگوها / نامه‌ها / ذخیره‌ها را بزنید، افراد را انتخاب کنید و تماس گروهی را شروع کنید.',
        'از هدر کانال هم می‌توانید تماس گروهی بگذارید — اعضای کانال از قبل انتخاب شده‌اند.',
        'طرف‌ها کارت ورودی می‌بینند. پذیرش همان گفتگو را باز می‌کند و وارد اتاق می‌شود (تا ۱۲ نفر).',
        'نوار پایین: میکروفون، دوربین، اشتراک صفحه، پایان. وقتی صفحه را به اشتراک می‌گذارید خودتان همان تصویر را بزرگ می‌بینید.',
      ],
      tips: [
        'تب جدا برای جلسات نیست — داخل گفتگو بمانید.',
        'در مرورگر اجازه دوربین، میکروفون و اشتراک صفحه را بدهید.',
      ],
    },
    calendar: {
      title: 'تقویم',
      summary: 'تاریخ وظایف و رویدادهای فضای کاری. در فارسی انتخاب تاریخ خوانا است.',
      steps: [
        'تقویم را از نوار کناری باز کنید.',
        'موعد کارت‌ها روی تقویم دیده می‌شود.',
        'اگر دسترسی دارید رویداد فضای کاری اضافه کنید.',
        'سامانه تقویم را از حساب ← ترجیحات عوض کنید.',
      ],
      tips: [
        'اعداد تاریخ در فارسی هم میلادی می‌مانند.',
        'سطل موعد در وظایف من را با تقویم با هم ببینید.',
      ],
    },
    email: {
      title: 'ایمیل',
      summary:
        'نامه داخلی فضای کاری همیشه کار می‌کند. برای جیمیل، اوت‌لوک یا IMAP سازمانی صندوق را وصل کنید.',
      steps: [
        'اگر نوشت «ایمیل وصل نیست» بروید تنظیمات ← ایمیل.',
        'صندوق شخصی یا سازمانی را انتخاب کنید.',
        'نشانی، میزبان IMAP (جیمیل: imap.gmail.com)، پورت ۹۹۳، نام کاربری و رمز برنامه را بگذارید.',
        'اتصال را بزنید و همگام کنید. پیام‌ها در برنامه‌ها ← ایمیل می‌آیند.',
        'نامه داخلی به هم‌تیمی IMAP نمی‌خواهد.',
      ],
      tips: [
        'جیمیل و اوت‌لوک رمز برنامه می‌خواهند، نه رمز ورود معمولی.',
        'اگر همگام شکست بخورد خطا روی همان ردیف است — میزبان یا رمز را درست کنید.',
      ],
    },
    gallery: {
      title: 'گالری و فضای ابری',
      summary: 'فایل‌های گفتگو، برد و آپلود در گالری فضای کاری هستند.',
      steps: [
        'تنظیمات ← گالری را باز کنید.',
        'مدیر همه فایل‌های اشتراک‌شده را می‌بیند؛ بقیه شاید فقط آپلود خودشان را.',
        'برای لوگو از گالری عکس بردارید.',
        'نوار مصرف را ببینید — اگر پر شد فضای بیشتر بخرید.',
      ],
      tips: [
        'حذف عکس بلافاصله فضا آزاد می‌کند.',
        'پیوست کارت‌ها هم از سهم ابری کم می‌کند.',
      ],
    },
    settings: {
      title: 'تنظیمات فضای کاری',
      summary: 'هویت بصری، اعضا، نقش، برچسب، گالری، امنیت، صورتحساب، ایمیل، یکپارچه‌سازی و گزارش فعالیت.',
      steps: [
        'تنظیمات را باز کنید. اگر تب‌ها جا نشدند افقی اسکرول کنید.',
        'عمومی: نام شرکت، لوگوی روشن/تیره، رنگ آواتار.',
        'اعضا افراد را دعوت می‌کند. نقش‌ها (مقاله بعد) ماتریس دسترسی را می‌سازند.',
        'برچسب‌ها تگ رنگی تسک‌اند. امنیت یعنی تأیید دو مرحله‌ای و فهرست IP.',
        'گزارش فعالیت دعوت، ویرایش نقش، تغییر عضو و به‌روزرسانی پلن را ثبت می‌کند.',
      ],
      tips: [
        'فقط مالک می‌تواند مالکیت را منتقل کند.',
        'برای کل صفحه نقش‌ها و گزارش فعالیت، همان مقاله‌ها را در این مرکز راهنما باز کنید.',
      ],
    },
    roles: {
      title: 'نقش‌ها و دسترسی‌ها',
      summary:
        'تنظیمات ← نقش‌ها کل ماتریس دسترسی است: نقش‌های سیستمی سمت فهرست، جدول سوئیچ‌ها سمت راست، و «نقش جدید» برای قالب سمت‌های شرکت.',
      steps: [
        'تنظیمات ← نقش‌ها را باز کنید. دسترسی «مدیریت نقش‌ها» لازم است (مالک و مدیر سازمان دارند).',
        'عنوان صفحه «نقش‌ها و دسترسی‌ها» است. نشان بنفش «دسترسی» فقط برچسب است. دکمه «نقش جدید» فرم ساخت را باز می‌کند.',
        'فهرست چپ همه نقش‌هاست. سیستمی (مالک، مدیر سازمان، مدیر برد، عضو، مهمان) برچسب «سیستمی» و تعداد عضو دارد. سمت یا سفارشی برچسب «سمت / سفارشی» دارد.',
        'روی نقش بزنید تا سمت راست بارگذاری شود. مداد فقط روی نقش‌های قابل‌تغییرنام دیده می‌شود — نام نقش سیستمی قفل است.',
        'نقش سیستمی: عنوان ثابت است. شرح و تعداد اعضا را می‌بینید. حذف نمی‌شود. سوئیچ‌های مالک خاموش نمی‌شوند.',
        'نقش سفارشی / سمت: نام نقش را ویرایش کنید و «تغییر نام» (یا کلید اینتر) بزنید. شرح اختیاری است. حذف قرمز است و فقط وقتی کسی این نقش را ندارد کار می‌کند — اول افراد را جابه‌جا کنید.',
        'ذخیره، نام، شرح و همه سوئیچ‌های دسترسی را با هم می‌نویسد.',
        'جدول گروه‌بندی شده: فضای کاری، امنیت، صورتحساب، بخش‌ها، تحلیل، افراد، بردها، ستون‌ها، کارت‌ها، همکاری، خودکارسازی، مهمان و موارد اضافه مثل فیلد مالی یا برچسب.',
        'هر ردیف یک عنوان فارسی است (مثلاً «دعوت به بخش»)، نه کد خام. ⓘ را نگه دارید تا ببینید آن سوئیچ دقیقاً چه اجازه‌ای می‌دهد.',
        'نقش جدید: سمت‌های شرکت را جستجو کنید (مدیرعامل، حسابدار، سرپرست فناوری، …). «نقش سفارشی» از خالی شروع می‌کند؛ قالب، نام و شرح و سوئیچ‌ها را پر می‌کند. بعد «ایجاد نقش» یا انصراف.',
        'جستجو نام بخش را هم پیدا می‌کند (مالی، فناوری / مهندسی، منابع انسانی، بازاریابی، عملیات، رهبری).',
      ],
      tips: [
        'نام قفل‌شده سیستمی در پایگاه داده انگلیسی می‌ماند؛ صفحه همیشه به زبان شما نشان می‌دهد.',
        'نقشی که عضو دارد تا جابه‌جایی افراد حذف نمی‌شود.',
        'تغییر سوئیچ‌ها تا زدن ذخیره اعمال نمی‌شود.',
        'دسترسی روزمره عضو و مهمان از همین ماتریس می‌آید — با تنظیمات ← اعضا جفتش کنید.',
      ],
    },
    audit: {
      title: 'گزارش فعالیت',
      summary:
        'تنظیمات ← گزارش فعالیت ردپای امنیتی است: چه کسی چه کرد، کی، چقدر جدی بود، و از کدام آی‌پی.',
      steps: [
        'تنظیمات ← گزارش فعالیت را باز کنید. دسترسی «خواندن گزارش فعالیت» یا «مدیریت نقش‌ها» لازم است.',
        'عنوان توضیح می‌دهد که دعوت، نقش، عضو، برد و تغییر پلن ثبت می‌شود. نشان «ردپا» فقط برچسب است.',
        'جستجو جدول را همان‌جا فیلتر می‌کند: متن عمل، نام یا ایمیل فرد، شدت، یا آی‌پی.',
        'ستون زمان، تاریخ و ساعت محلی همان رویداد است.',
        'ستون چه کسی، عضو انجام‌دهنده است (نام، و ایمیل زیرش). اگر کاربری نباشد «سامانه» دیده می‌شود.',
        'ستون چه شد یک جمله کامل به زبان شماست — مثلاً «دعوت ساخته شد»، «دسترسی‌های نقش به‌روز شد»، «عضو از همه دستگاه‌ها خارج شد».',
        'شدت: اطلاع (روزمره)، هشدار (حساس: نقش یا عضو)، بحرانی (جدی‌ترین رویداد امنیتی).',
        'آی‌پی نشانی ثبت‌شده همان عمل است، اگر سرور گرفته باشد.',
        'ردیف‌های رایج: ساخت / پذیرش / تأیید / رد / فعال‌سازی فوری دعوت؛ دعوت، به‌روزرسانی، حذف یا خروج اجباری عضو؛ ساخت، تغییر نام، به‌روزرسانی دسترسی یا حذف نقش؛ ساخت یا به‌روزرسانی برد؛ به‌روزرسانی فضای کاری یا سیاست امنیت؛ انتقال مالکیت؛ تنظیم پلن یا فضای ابری اضافه.',
      ],
      tips: [
        'این گزارش جای تاریخچه گفتگو نیست — فقط اقدامات حساس فضای کاری.',
        'جستجو فارسی و انگلیسی را می‌فهمد (مثلاً «دعوت» یا invite).',
        'اگر صفحه خالی است هنوز رویداد حساسی ثبت نشده، یا دسترسی ندارید.',
      ],
    },
    billing: {
      title: 'پلن و صورتحساب',
      summary: 'رایگان، پایه و پیشرفته. پرداخت کارت‌به‌کارت؛ فضای ابری جدا هم قابل خرید است.',
      steps: [
        'تنظیمات ← صورتحساب یا «مدیریت پلن» در خانه.',
        'پلن و تعداد اعضا را انتخاب کنید. ممکن است عضو هدیه داشته باشید.',
        'برای ارتقا رسید کارت‌به‌کارت بفرستید.',
        'خرید فقط‌ابری، فضا را زیاد می‌کند بدون عوض کردن پلن.',
      ],
      tips: [
        'پلن رایگان پروژه، وظیفه، برد، تقویم و ارزیابی را دارد.',
        'جلسه یک‌به‌یک داخل گفتگو است — نه تب جدا و نه صفحه پخش زنده دیگران.',
      ],
    },
    team: {
      title: 'فهرست تیم',
      summary: 'تیم همه افراد فضای کاری را نشان می‌دهد: نقش، بخش و وضعیت آنلاین.',
      steps: [
        'از نوار کناری «تیم» را باز کنید.',
        'با بخش فیلتر کنید یا نام را جستجو کنید.',
        'روی فرد بزنید تا نقش و بخش‌ها را ببینید.',
        'اگر دسترسی دارید از تنظیمات ← اعضا دعوت کنید.',
      ],
      tips: [
        'وضعیت حضور زنده است — سبز یعنی الان در فضای کاری است.',
        'مهمان فقط روی پروژه‌های خصوصی خودش دیده می‌شود.',
      ],
    },
    account: {
      title: 'حساب شما',
      summary:
        'پروفایل، رمز، تأیید دو مرحله‌ای، نشست‌ها، اعلان، زبان و تیکت پشتیبانی شخصی‌اند — نه تنظیمات فضای کاری.',
      steps: [
        'از منوی آواتار «حساب» را باز کنید.',
        'پروفایل: نام، عکس و تماس.',
        'تنظیمات: رمز، تأیید دو مرحله‌ای، نشست‌ها و ترجیح اعلان.',
        'راهنما: مرکز راهنما را باز کنید یا تیکت بفرستید.',
      ],
      tips: [
        'اگر روی سیستم مشترک وارد شدید نشست‌های دیگر را باطل کنید.',
        'صورتحساب فضای کاری در تنظیمات ← صورتحساب است، نه حساب شخصی.',
      ],
    },
    analytics: {
      title: 'تحلیل و ارزیابی',
      summary:
        'وقتی مدیر وظیفه را تأیید می‌کند نمره همان کارت ثبت می‌شود و به تحلیل می‌رود.',
      steps: [
        'وظیفه ارسال‌شده را تأیید کنید و در صورت پرسش ارزیابی را پر کنید.',
        'تحلیل را باز کنید (شرکت یا بخش، بسته به دسترسی).',
        'نمای لید برای متعادل کردن بار افراد است.',
        'روند کار تأخیر و کیفیت تخمین را در زمان نشان می‌دهد.',
      ],
      tips: [
        'این فرم پایان سال نیست — روی هر تأیید اتفاق می‌افتد.',
        'اگر واحدی عقب است لید را با بخش‌ها ببینید.',
      ],
    },
    sheets: {
      title: 'گوگل شیت',
      summary: 'برد یا وظایف من را به درایو بفرستید، یا ردیف‌ها را کارت کنید.',
      steps: [
        'تنظیمات ← یکپارچه‌سازی و اتصال گوگل.',
        'خروجی زنده یک صفحه گسترده در درایو می‌سازد.',
        'ورود گروهی: شناسه شیت را بچسبانید؛ شناسه کارت تکراری رد می‌شود.',
        'لینک‌های همگام اخیر همان صفحه می‌مانند.',
      ],
      tips: [
        'ادمین باید کلید گوگل را روی سرور بگذارد.',
        'ورود گروهی برای شروع لیست است، نه کار روزانه.',
      ],
    },
  },
};

export function getGuideCopy(lang: 'en' | 'fa'): GuideCopy {
  return lang === 'fa' ? fa : en;
}
