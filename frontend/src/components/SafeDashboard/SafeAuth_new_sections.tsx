// TEMP — new content for ERROR_TYPES, ErrorPagesTabs, auth-success, auth-2step, auth-errors

// ERROR_TYPES (lines 74-122 replacement):
const ERROR_TYPES_NEW = [
  {
    code: '404',
    title: 'Page Not Found',
    description: "The page you requested doesn't exist. It may have moved or the URL is incorrect.",
    accent: 'rgba(251,191,36,0.7)',
    accentSolid: '#fbbf24',
  },
  {
    code: '500',
    title: 'Internal Server Error',
    description: 'Something went wrong on our end. Our team has been notified and is working on it.',
    accent: 'rgba(248,113,113,0.7)',
    accentSolid: '#f87171',
  },
  {
    code: '503',
    title: 'Service Unavailable',
    description: 'The server is temporarily offline for scheduled maintenance. Please check back soon.',
    accent: 'rgba(167,139,250,0.7)',
    accentSolid: '#a78bfa',
  },
];
