export const PATIENT_CONSENT_ABI = [
  "function consentRegistry(address, address) external view returns (bool isGranted, uint256 validUntil, string ipfsCID)",
  "function grantConsent(address _doctor, string memory _ipfsCID, uint256 _durationInSeconds) external",
  "function revokeConsent(address _doctor) external",
  "function verifyConsent(address _patient, address _doctor) external view returns (bool hasAccess, string memory ipfsCID)",
  "event ConsentGranted(address indexed patient, address indexed doctor, string ipfsCID, uint256 validUntil)",
  "event ConsentRevoked(address indexed patient, address indexed doctor)"
];

export const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
