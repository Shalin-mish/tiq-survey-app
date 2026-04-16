export const identities = [
  { val: 'professional',        tag: '01', label: 'Working Professional', sublabel: 'In NDT, QA/QC, or inspection' },
  { val: 'freelancer',          tag: '02', label: 'Freelancer',           sublabel: 'Independent service provider' },
  { val: 'manufacturer',        tag: '03', label: 'Manufacturer / EPC',   sublabel: 'Hiring inspection teams' },
  { val: 'inspection_provider', tag: '04', label: 'Inspection Provider',  sublabel: 'TIC lab, agency, or firm' },
  { val: 'fresher',             tag: '05', label: 'Fresher / Student',    sublabel: 'Entering the industry' },
  { val: 'vendor',              tag: '06', label: 'Vendor / OEM',         sublabel: 'Equipment or materials supplier' },
]

export const step2Titles: Record<string, string> = {
  professional:        "What's your biggest challenge right now?",
  freelancer:          "What would make the biggest difference for you?",
  manufacturer:        "What's your most pressing operational challenge?",
  inspection_provider: "Where do you feel the most friction?",
  fresher:             "What would help you the most right now?",
  vendor:              "What slows you down the most?",
}

export const painOptions: Record<string, { main: string; desc: string }[]> = {
  professional: [
    { main: 'Finding the right job or project',       desc: 'Relevant openings, contract roles, or long-term positions in NDT and QA' },
    { main: 'Accessing the right training',           desc: 'Courses and upskilling programs aligned to my role and certification level' },
    { main: 'Getting industry-recognised credentials',desc: 'ASNT, ASME, or ISO-aligned micro-certifications that clients and employers trust' },
    { main: 'Digitising my inspection reports',       desc: 'Creating professional, standardised reports without manual formatting' },
  ],
  freelancer: [
    { main: 'Landing inspection gigs and contracts',  desc: 'Short-term and project-based work from companies looking for verified freelancers' },
    { main: 'Getting credentialed to improve my rate',desc: 'Micro-credentials that help me stand out and justify a better daily rate' },
    { main: 'Presenting reports professionally',      desc: 'Digitised, standardised formats that build credibility with clients' },
    { main: 'Building a verifiable track record',     desc: 'A profile that shows my competency history beyond just a paper certificate' },
  ],
  manufacturer: [
    { main: 'Finding verified inspection talent',     desc: 'Hiring NDT and QA professionals whose qualifications are actually trustworthy' },
    { main: 'Standardising QA documentation',         desc: 'Consistent report formats across projects, sites, and contractors' },
    { main: 'Managing workforce competency',          desc: 'Tracking certifications, renewals, and practical qualification status at scale' },
    { main: 'Reducing rework from poor inspections',  desc: 'Catching quality issues earlier by improving the inspection baseline' },
  ],
  inspection_provider: [
    { main: 'Finding and retaining qualified NDT professionals', desc: 'Building a reliable bench of certified inspectors across disciplines' },
    { main: 'Standardising report quality',           desc: 'Consistent formats across clients, sites, and inspector levels' },
    { main: 'Managing certifications at scale',       desc: 'Tracking renewals, competency records, and compliance across a large team' },
    { main: 'Scaling capacity for large projects',    desc: 'Quickly onboarding and verifying qualified personnel when demand spikes' },
  ],
  fresher: [
    { main: 'Breaking into the QA or NDT industry',  desc: 'Understanding how to start, what certifications matter, and who is hiring' },
    { main: 'Getting the right certifications',       desc: 'Knowing which programs are credible and what employers actually look for' },
    { main: 'Finding entry-level jobs or internships',desc: 'Opportunities that give real exposure to inspection work' },
    { main: 'Building a credible professional profile',desc: 'Something beyond a degree that shows practical competency to employers' },
  ],
  vendor: [
    { main: 'Finding qualified inspection partners',  desc: 'Reliable testing and inspection firms for my products or supply chain' },
    { main: 'Verifying contractor competency',        desc: 'Ensuring the inspectors engaged actually hold the qualifications they claim' },
    { main: 'Standardising supplier documentation',   desc: 'Consistent inspection and QA formats across my vendor base' },
    { main: 'Reducing inspection bottlenecks',        desc: 'Faster turnaround without compromising on compliance or quality' },
  ],
}
