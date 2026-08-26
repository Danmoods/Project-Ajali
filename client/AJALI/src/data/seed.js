export const emergencyCategories = [
  { id: 'ambulance', label: 'Ambulance', icon: 'Siren' },
  { id: 'fire', label: 'Fire', icon: 'Flame' },
  { id: 'police', label: 'Police', icon: 'ShieldAlert' },
  { id: 'lifeguard', label: 'Lifeguard', icon: 'Waves' },
  { id: 'all', label: 'All-in-One', icon: 'Asterisk' },
]

export const seedIncidents = [
  {
    id: 'AJ-9924',
    title: 'Multi-Vehicle Collision on I-95',
    category: 'Traffic Collision',
    severity: 'Critical',
    status: 'Pending Review',
    reporter: 'Sarah J.',
    reporterType: 'Citizen',
    date: 'Oct 24, 2023',
    time: '14:32',
    location: 'I-95 Northbound, near Exit 42. Approx 2 miles from city center.',
    lat: 39.2904,
    lng: -76.6122,
    description:
      'A severe multi-vehicle collision involving a commercial semi-truck and three passenger vehicles. The semi-truck appears to have jackknifed across two lanes, causing a pile-up. Significant debris scattered across the northbound lanes. Emergency services requested immediately due to potential injuries and fuel spill risk.',
    evidence: ['scene', 'wreck'],
    hasVideo: true,
  },
  {
    id: 'AJ-9918',
    title: 'Fallen Tree Blocking Road',
    category: 'Road Hazard',
    severity: 'Warning',
    status: 'Under Review',
    reporter: 'Alex Mercer',
    reporterType: 'Citizen',
    date: 'Oct 22, 2023',
    time: '09:10',
    location: 'Maple St & 5th Ave',
    lat: 39.302,
    lng: -76.61,
    description:
      'A large oak tree came down across both lanes after last night’s storm. Traffic is being diverted onto 6th Ave. No injuries reported, but the road is fully impassable for standard vehicles.',
    evidence: ['tree'],
    hasVideo: false,
  },
  {
    id: 'AJ-9902',
    title: 'Major Flooding Reported Near Riverbank',
    category: 'Hazard',
    severity: 'Warning',
    status: 'Resolved',
    reporter: 'CityResident_B',
    reporterType: 'Citizen',
    date: 'Oct 20, 2023',
    time: '18:45',
    location: 'Riverside Drive, East Sector',
    lat: 39.295,
    lng: -76.615,
    description:
      'Water levels rose quickly after sustained rainfall, flooding the lower section of Riverside Drive. Local crews placed barriers and the road has since been cleared and reopened to traffic.',
    evidence: [],
    hasVideo: false,
  },
]

export const seedCommunityPosts = [
  {
    id: 'p1',
    author: 'HighwayPatrol_01',
    time: '2 mins ago',
    body: 'Major delay on I-95 South near exit 45. Multi-vehicle incident blocking two right lanes. Emergency services are on scene. Expect delays of 30+ minutes. Avoid if possible.',
  },
  {
    id: 'p2',
    author: 'CityResident_B',
    time: '15 mins ago',
    body: 'Power outage reported in the Downtown district, affecting traffic lights at 4th and Main. Please treat all dark intersections as 4-way stops. Drive carefully!',
  },
  {
    id: 'p3',
    author: 'LocalResponder',
    time: '1 hr ago',
    body: 'Weather advisory: Heavy rain expected to start around 4 PM. Roads may become slick. Reminder to check tire pressure and wiper fluid. Stay safe out there.',
  },
]

export const adminStats = {
  total: 2451,
  pending: 142,
  investigating: 86,
  resolved: 2105,
  rejected: 118,
}

export const adminIncidentRows = [
  {
    id: '#INC-842',
    title: 'Multi-vehicle collision',
    category: 'Accident',
    location: 'Nairobi Highway, KM 12',
    date: '10 mins ago',
    status: 'Pending',
  },
  {
    id: '#INC-841',
    title: 'Fallen tree blocking road',
    category: 'Hazard',
    location: 'Moi Avenue',
    date: '45 mins ago',
    status: 'Investigating',
  },
  {
    id: '#INC-840',
    title: 'Flooded underpass',
    category: 'Weather',
    location: 'Thika Road',
    date: '2 hours ago',
    status: 'Investigating',
  },
  {
    id: '#INC-839',
    title: 'Minor fender bender',
    category: 'Accident',
    location: 'CBD Junction',
    date: 'Yesterday',
    status: 'Resolved',
  },
]