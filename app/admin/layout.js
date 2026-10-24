import AdminShell from './AdminShell';

// A title template here keeps the \"· Ping Pilott\" suffix on the nested pages below.
export const metadata = { title: { default: 'Admin overview', template: '%s · Ping Pilott' } };

// Authentication, the admin role check and the page chrome live in AdminShell (a client component);
// this file stays a server component so the admin pages can set their own titles.
export default function AdminLayout({ children }) {
    return <AdminShell>{children}</AdminShell>;
}
