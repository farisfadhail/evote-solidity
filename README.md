# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

<!-- npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test -->

```shell
npx hardhat node
npx hardhat compile
npx hardhat ignition deploy ./ignition/modules/Evote.js --network localhost

# if you want to deploy to public node
npx hardhat ignition deploy ./ignition/modules/Evote.js --network sepolia
```
