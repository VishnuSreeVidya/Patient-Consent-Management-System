// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PatientConsent
 * @dev Decentralized Patient Consent Management System with Granular Categories,
 *      Time-Bound Access, and Emergency Break-Glass Protocol.
 */
contract PatientConsent {
    enum RecordCategory { General, Prescriptions, LabTests, Radiology, Sensitive }

    struct Consent {
        bool isGranted;
        uint8 category;
        uint256 validUntil;
        string ipfsCID;
    }

    struct EmergencyAccess {
        address doctor;
        uint256 timestamp;
        string reason;
    }

    // Patient => Doctor => Consent Details
    mapping(address => mapping(address => Consent)) public consentRegistry;

    // Patient => Emergency Access History
    mapping(address => EmergencyAccess[]) public emergencyAccessLogs;

    // Events
    event ConsentGranted(
        address indexed patient,
        address indexed doctor,
        string ipfsCID,
        uint8 category,
        uint256 validUntil
    );

    event ConsentRevoked(
        address indexed patient,
        address indexed doctor
    );

    event EmergencyAccessTriggered(
        address indexed patient,
        address indexed doctor,
        string reason,
        uint256 timestamp
    );

    /**
     * @notice Grants time-bound, categorized consent to a healthcare provider.
     * @param _doctor Address of the healthcare provider.
     * @param _ipfsCID IPFS CID of the encrypted medical record.
     * @param _category Medical category (0: General, 1: Prescriptions, 2: LabTests, 3: Radiology, 4: Sensitive).
     * @param _durationInSeconds Validity duration in seconds.
     */
    function grantConsent(
        address _doctor,
        string memory _ipfsCID,
        uint8 _category,
        uint256 _durationInSeconds
    ) external {
        require(_doctor != address(0), "Invalid doctor address");
        require(_doctor != msg.sender, "Cannot grant consent to self");
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(_durationInSeconds > 0, "Duration must be greater than 0");
        require(_category <= uint8(RecordCategory.Sensitive), "Invalid category");

        uint256 expiry = block.timestamp + _durationInSeconds;

        consentRegistry[msg.sender][_doctor] = Consent({
            isGranted: true,
            category: _category,
            validUntil: expiry,
            ipfsCID: _ipfsCID
        });

        emit ConsentGranted(msg.sender, _doctor, _ipfsCID, _category, expiry);
    }

    /**
     * @notice Revokes consent previously granted to a healthcare provider.
     * @param _doctor Address of the healthcare provider to revoke.
     */
    function revokeConsent(address _doctor) external {
        require(_doctor != address(0), "Invalid doctor address");
        require(consentRegistry[msg.sender][_doctor].isGranted, "No active consent found");

        delete consentRegistry[msg.sender][_doctor];

        emit ConsentRevoked(msg.sender, _doctor);
    }

    /**
     * @notice Verifies if a doctor has active, unexpired consent to access a patient's records.
     * @param _patient Address of the patient.
     * @param _doctor Address of the healthcare provider.
     * @return hasAccess Boolean indicating active access.
     * @return ipfsCID The IPFS CID of the encrypted EHR document.
     * @return category The medical record category.
     */
    function verifyConsent(
        address _patient,
        address _doctor
    ) external view returns (bool hasAccess, string memory ipfsCID, uint8 category) {
        Consent memory c = consentRegistry[_patient][_doctor];

        if (c.isGranted && block.timestamp <= c.validUntil) {
            return (true, c.ipfsCID, c.category);
        }

        return (false, "", 0);
    }

    /**
     * @notice Emergency Break-Glass protocol for verified emergency rooms.
     *         Emits an immutable high-priority audit event.
     * @param _patient Address of the patient in emergency.
     * @param _reason Justification reason for emergency access.
     */
    function emergencyBreakGlass(
        address _patient,
        string memory _reason
    ) external {
        require(_patient != address(0), "Invalid patient address");
        require(_patient != msg.sender, "Cannot break glass on self");
        require(bytes(_reason).length > 0, "Emergency reason required");

        emergencyAccessLogs[_patient].push(EmergencyAccess({
            doctor: msg.sender,
            timestamp: block.timestamp,
            reason: _reason
        }));

        emit EmergencyAccessTriggered(_patient, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Retrieves emergency access audit logs for a patient.
     * @param _patient Address of the patient.
     */
    function getEmergencyAccessLogs(
        address _patient
    ) external view returns (EmergencyAccess[] memory) {
        return emergencyAccessLogs[_patient];
    }
}
