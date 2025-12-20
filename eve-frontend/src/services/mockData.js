export const MOCK_USER = {
    id: 1,
    email: 'demo@example.com',
    first_name: 'Demo',
    last_name: 'User',
    phone_number: '+2348012345678',
    is_verified: true,
    profile_picture: null,
};

export const MOCK_CRIME_ZONES = [
    {
        id: 1,
        name: 'Central Market Area',
        risk_level: 'High',
        risk_score: 85,
        latitude: 6.5244,
        longitude: 3.3792,
        radius: 500,
        description: 'High number of reported incidents in the last month.',
    },
    {
        id: 2,
        name: 'City Park',
        risk_level: 'Low',
        risk_score: 20,
        latitude: 6.5300,
        longitude: 3.3850,
        radius: 300,
        description: 'Generally safe area with regular patrols.',
    },
    {
        id: 3,
        name: 'Downtown Junction',
        risk_level: 'Medium',
        risk_score: 55,
        latitude: 6.5180,
        longitude: 3.3750,
        radius: 400,
        description: 'Traffic congestion and occasional pickpocketing reported.',
    },
];

export const MOCK_HEATMAP_DATA = [
    // Generate some random points around Lagos coordinates
    ...Array.from({ length: 50 }, (_, i) => ({
        latitude: 6.5244 + (Math.random() - 0.5) * 0.05,
        longitude: 3.3792 + (Math.random() - 0.5) * 0.05,
        risk_score: Math.floor(Math.random() * 100),
    })),
];

export const MOCK_PREDICTION = {
    risk_score: 45,
    risk_level: 'Medium',
    confidence: 0.85,
    contributing_factors: [
        'Time of day (Late Night)',
        'Historical incident reports',
        'Poor lighting reported',
    ],
    safety_tips: [
        'Stay in well-lit areas',
        'Avoid walking alone',
        'Keep valuables hidden',
    ],
};

export const MOCK_INCIDENT_TYPES = [
    'Theft',
    'Assault',
    'Harassment',
    'Vandalism',
    'Suspicious Activity',
];
