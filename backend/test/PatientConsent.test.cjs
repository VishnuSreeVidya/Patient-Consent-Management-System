const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PatientConsent Management System", function () {
  let PatientConsent;
  let patientConsent;
  let patient;
  let doctor1;
  let doctor2;
  let otherAccount;

  const testIpfsCID = "QmXoypiZjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const oneHourInSeconds = 3600;

  beforeEach(async function () {
    [patient, doctor1, doctor2, otherAccount] = await ethers.getSigners();

    PatientConsent = await ethers.getContractFactory("PatientConsent");
    patientConsent = await PatientConsent.deploy();
    await patientConsent.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully and have a valid address", async function () {
      const address = await patientConsent.getAddress();
      expect(address).to.be.properAddress;
    });
  });

  describe("Grant Consent", function () {
    it("Should allow a patient to grant consent and emit ConsentGranted event", async function () {
      const latestBlockTime = await time.latest();

      await expect(
        patientConsent
          .connect(patient)
          .grantConsent(doctor1.address, testIpfsCID, oneHourInSeconds)
      )
        .to.emit(patientConsent, "ConsentGranted");

      const consent = await patientConsent.consentRegistry(
        patient.address,
        doctor1.address
      );
      expect(consent.isGranted).to.be.true;
      expect(consent.ipfsCID).to.equal(testIpfsCID);
      expect(consent.validUntil).to.be.greaterThan(BigInt(latestBlockTime));
    });

    it("Should reject granting consent to address(0)", async function () {
      await expect(
        patientConsent
          .connect(patient)
          .grantConsent(ethers.ZeroAddress, testIpfsCID, oneHourInSeconds)
      ).to.be.revertedWith("Invalid doctor address");
    });
  });

  describe("Verify Consent", function () {
    beforeEach(async function () {
      await patientConsent
        .connect(patient)
        .grantConsent(doctor1.address, testIpfsCID, oneHourInSeconds);
    });

    it("Should verify active consent for authorized doctor", async function () {
      const [hasAccess, ipfsCID] = await patientConsent.verifyConsent(
        patient.address,
        doctor1.address
      );
      expect(hasAccess).to.be.true;
      expect(ipfsCID).to.equal(testIpfsCID);
    });

    it("Should deny access to unauthorized doctor", async function () {
      const [hasAccess, ipfsCID] = await patientConsent.verifyConsent(
        patient.address,
        doctor2.address
      );
      expect(hasAccess).to.false;
      expect(ipfsCID).to.equal("");
    });

    it("Should deny access when consent expires after duration", async function () {
      await time.increase(oneHourInSeconds + 10);

      const [hasAccess, ipfsCID] = await patientConsent.verifyConsent(
        patient.address,
        doctor1.address
      );
      expect(hasAccess).to.be.false;
      expect(ipfsCID).to.equal("");
    });
  });

  describe("Revoke Consent", function () {
    beforeEach(async function () {
      await patientConsent
        .connect(patient)
        .grantConsent(doctor1.address, testIpfsCID, oneHourInSeconds);
    });

    it("Should allow patient to revoke consent and emit ConsentRevoked event", async function () {
      await expect(
        patientConsent.connect(patient).revokeConsent(doctor1.address)
      )
        .to.emit(patientConsent, "ConsentRevoked")
        .withArgs(patient.address, doctor1.address);

      const [hasAccess, ipfsCID] = await patientConsent.verifyConsent(
        patient.address,
        doctor1.address
      );
      expect(hasAccess).to.be.false;
      expect(ipfsCID).to.equal("");
    });

    it("Should reject revoking consent for address(0)", async function () {
      await expect(
        patientConsent.connect(patient).revokeConsent(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid doctor address");
    });
  });
});
