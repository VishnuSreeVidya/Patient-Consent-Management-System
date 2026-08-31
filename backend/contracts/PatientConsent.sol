// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PatientConsent {
    struct Consent {
        bool isGranted;
        uint256 validUntil;
        string ipfsCID;
    }

    // patient => doctor => Consent
    mapping(address => mapping(address => Consent)) public consentRegistry;

    event ConsentGranted(
        address indexed patient,
        address indexed doctor,
        string ipfsCID,
        uint256 validUntil
    );

    event ConsentRevoked(
        address indexed patient,
        address indexed doctor
    );

    function grantConsent(
        address _doctor,
        string memory _ipfsCID,
        uint256 _durationInSeconds
    ) external {
        require(_doctor != address(0), "Invalid doctor address");
        uint256 validUntil = block.timestamp + _durationInSeconds;
        consentRegistry[msg.sender][_doctor] = Consent({
            isGranted: true,
            validUntil: validUntil,
            ipfsCID: _ipfsCID
        });
        emit ConsentGranted(msg.sender, _doctor, _ipfsCID, validUntil);
    }

    function revokeConsent(address _doctor) external {
        require(_doctor != address(0), "Invalid doctor address");
        consentRegistry[msg.sender][_doctor].isGranted = false;
        emit ConsentRevoked(msg.sender, _doctor);
    }

    function verifyConsent(address _patient, address _doctor)
        external
        view
        returns (bool hasAccess, string memory ipfsCID)
    {
        Consent memory consent = consentRegistry[_patient][_doctor];
        if (consent.isGranted && consent.validUntil > block.timestamp) {
            return (true, consent.ipfsCID);
        } else {
            return (false, "");
        }
    }
}
