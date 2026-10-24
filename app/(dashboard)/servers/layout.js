// A title template here keeps the \"· Ping Pilott\" suffix on the nested pages below.
export const metadata = { title: { default: 'Servers', template: '%s · Ping Pilott' } };

export default function Layout({ children }) {
    return children;
}
