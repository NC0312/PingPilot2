// app/admin/support/layout.js
// Authentication, the admin role check and the page chrome all come from app/admin/layout.js.
// A title template here keeps the \"· Ping Pilott\" suffix on the nested pages below.
export const metadata = { title: { default: 'Admin support tickets', template: '%s · Ping Pilott' } };

export default function AdminSupportLayout({ children }) {
    return children;
}
