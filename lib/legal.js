// Facts the legal pages share. Edit here, not in the pages.
// Fill every null before launch: Indian law expects the Grievance Officer's name and contact details to be published,
// and the pages show a visible "to be added" marker until they are set.
export const LEGAL = {
    name: 'Ping Pilott',
    updated: '2026-10-25',
    updatedLabel: 'October 25, 2026',
    // Legal name of the person or company that runs Ping Pilott, and its registered address in India.
    entityName: null,
    address: null,
    // Monitored mailbox for privacy and legal requests.
    contactEmail: null,
    // Named individual who handles complaints about personal data.
    grievanceOfficer: { name: null, email: null },
    // City whose courts have jurisdiction, e.g. 'Mumbai'.
    jurisdictionCity: null,
};

const TBA = (what) => `[${what} to be added]`;

export const entityLabel = () => LEGAL.entityName || TBA('Legal entity name');
export const addressLabel = () => LEGAL.address || TBA('Registered address in India');
export const emailLabel = () => LEGAL.contactEmail || TBA('Contact email');
export const officerLabel = () => {
    const { name, email } = LEGAL.grievanceOfficer;
    return `${name || TBA('Officer name')}, ${email || TBA('email')}`;
};
export const cityLabel = () => LEGAL.jurisdictionCity || TBA('City');
