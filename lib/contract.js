import { ethers } from "ethers";
import { abi } from "../artifacts/contracts/Evote.sol/Evote.json";
import dotenv from "dotenv";

dotenv.config();

const INFURA_SEPOLIA_URL = process.env.INFURA_SEPOLIA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(INFURA_SEPOLIA_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

export { contractInstance, provider, signer };
