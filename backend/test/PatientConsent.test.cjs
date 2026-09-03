const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PatientConsent Management System", function () {
  let patientConsent;
  let owner, patient, doctor, unauthorizedDoctor, emergencyDoctor;
  const testCID = "QmXaWrK7mqZU2pNjR1wmAK5y4MvMvPQsmN86t7XY8qPPpX";
  const categoryRadiology = 3; // Radiology
  const oneDay = 86400; // 24 hours

  beforeEach(async function () {
    [owner, patient, doctor, unauthorizedDoctor, emergencyDoctor] = await ethers.getSigners();
    const PatientConsentFactory = await ethers.getContractFactory("PatientConsent");
    patientConsent = await PatientConsentFactory.deploy();
    await patientConsent.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully and have a valid address", async function () {
      const addr = await patientConsent.getAddress();
      expect(ethers.isAddress(addr)).to.be.true;
      expect(addr).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Grant Categorized Consent", function () {
    it("Should allow a patient to grant categorized consent and emit ConsentGranted event", async function () {
      await expect(patientConsent.connect(patient).grantConsent(doctor.address, testCID, categoryRadiology, oneDay))
        .to.emit(patientConsent, "ConsentGranted")
        .withArgs(patient.address, doctor.address, testCID, categoryRadiology, matcher => matcher > 0);

      const consent = await patientConsent.consentRegistry(patient.address, doctor.address);
      expect(consent.isGranted).to.equal(true);
      expect(consent.category).to.equal(categoryRadiology);
      expect(consent.ipfsCID).to.equal(testCID);
    });

    it("Should reject granting consent to address(0)", async function () {
      await expect(
        patientConsent.connect(patient).grantConsent(ethers.ZeroAddress, testCID, 0, oneDay)
      ).to.be.revertedWith("Invalid doctor address");
    });
  });

  describe("Verify Consent", function () {
    it("Should verify active consent and category for authorized doctor", async function () {
      await patientConsent.connect(patient).grantConsent(doctor.address, testCID, categoryRadiology, oneDay);
      const [ hasAccess, ipfsCID, category ] = await patientConsent.verifyConsent(patient.address, doctor.address);

      expect(hasAccess).to.equal(true);
      expect(ipfsCID).to.equal(testCID);
      expect(category).to.equal(categoryRadiology);
    });

    it("Should deny access to unauthorized doctor", async function () {
      const [ hasAccess ] = await patientConsent.verifyConsent(patient.address, unauthorizedDoctor.address);
      expect(hasAccess).to.equal(false);
    });

    it("Should deny access to self grant", async function () {
      await expect(
        patientConsent.connect(patient).grantConsent(patient.address, testCID, 0, oneDay)
      ).to.be.revertedWith("Cannot grant consent to self");
    });

    it("Should deny access when consent expires after duration", async function () {
      const shortDuration = 60; // 60 seconds
      await patientConsent.connect(patient).grantConsent(doctor.address, testCID, 0, shortDuration);

      // Advance time by 61 seconds
      await time.increase(61);

      const [ hasAccess ] = await patientConsent.verifyConsent(patient.address, doctor.address);
      expect(hasAccess).to.equal(false);
    });
  });

  describe("Revoke Consent", function () {
    it("Should allow patient to revoke consent and emit ConsentRevoked event", async function () {
      await patientConsent.connect(patient).grantConsent(doctor.address, testCID, 0, oneDay);
      await expect(patientConsent.connect(patient).revokeConsent(doctor.address))
        .to.emit(patientConsent, "ConsentRevoked")
        .withArgs(patient.address, doctor.address);

      const [ hasAccess ] = await patientConsent.verifyConsent(patient.address, doctor.address);
      expect(hasAccess).to.equal(false);
    });
  });

  describe("Emergency Break-Glass Protocol", function () {
    it("Should log emergency break-glass access and emit event", async function () {
      const reason = "Critical ER Trauma - Patient Unconscious";
      await expect(patientConsent.connect(emergencyDoctor).emergencyBreakGlass(patient.address, reason))
        .to.emit(patientConsent, "EmergencyAccessTriggered")
        .withArgs(patient.address, emergencyDoctor.address, reason, matcher => matcher > 0);

      const logs = await patientConsent.getEmergencyAccessLogs(patient.address);
      expect(logs.length).to.equal(1);
      expect(logs[0].doctor).to.equal(emergencyDoctor.address);
      expect(logs[0].reason).to.equal(reason);
    });
  });
});
