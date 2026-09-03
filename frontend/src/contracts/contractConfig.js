export const PATIENT_CONSENT_ABI = [
  "function consentRegistry(address, address) external view returns (bool isGranted, uint8 category, uint256 validUntil, string ipfsCID)",
  "function grantConsent(address _doctor, string memory _ipfsCID, uint8 _category, uint256 _durationInSeconds) external",
  "function revokeConsent(address _doctor) external",
  "function verifyConsent(address _patient, address _doctor) external view returns (bool hasAccess, string memory ipfsCID, uint8 category)",
  "function emergencyBreakGlass(address _patient, string memory _reason) external",
  "function getEmergencyAccessLogs(address _patient) external view returns (tuple(address doctor, uint256 timestamp, string reason)[] memory)",
  "event ConsentGranted(address indexed patient, address indexed doctor, string ipfsCID, uint8 category, uint256 validUntil)",
  "event ConsentRevoked(address indexed patient, address indexed doctor)",
  "event EmergencyAccessTriggered(address indexed patient, address indexed doctor, string reason, uint256 timestamp)"
];

export const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const RECORD_CATEGORIES = [
  { value: 0, label: "General EHR", icon: "FileText", color: "from-blue-500 to-cyan-500", bd: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  { value: 1, label: "Prescriptions", icon: "Pill", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  { value: 2, label: "Lab & Blood Work", icon: "FlaskConical", color: "from-violet-500 to-purple-500", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  { value: 3, label: "Radiology & Scans", icon: "Activity", color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  { value: 4, label: "Sensitive / Mental", icon: "Lock", color: "from-rose-500 to-red-500", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" }
];
