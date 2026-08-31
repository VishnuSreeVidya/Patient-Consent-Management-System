const hre = require("hardhat");

async function main() {
  const PatientConsent = await hre.ethers.getContractFactory("PatientConsent");
  const patientConsent = await PatientConsent.deploy();

  await patientConsent.waitForDeployment();

  const contractAddress = await patientConsent.getAddress();
  console.log(`PatientConsent deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

