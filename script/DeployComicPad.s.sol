// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ComicNFT.sol";
import "../src/ComicPadV1.sol";
import "../src/ComicPadProxy.sol";
import "../src/interfaces/IComicPad.sol";

contract DeployComicPad is Script {
    error USDTAddressMismatch(address expected, address actual);
    error ComicNFTAddressMismatch(address expected, address actual);
    error PlatformFeeMismatch(uint256 expected, uint256 actual);
    error InitialProjectCountNotZero(uint256 actual);
    error InitialEpisodeCountNotZero(uint256 actual);
    error ComicPadAddressMismatch(address expected, address actual);

    address public constant USDT_MAINNET = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant USDT_TESTNET = 0x110A13FC3eFE6a245B50102d2D529B427a3424E6;

    address public platformTreasury;

    uint256 public constant PLATFORM_FEE_PERCENTAGE = 500;

    // == deployed Contracts ===

    ComicNFT public comicNFT;
    ComicPadV1 public comicPadV1;
    ComicPadProxy public proxy;
    IComicPad public comicPad;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        platformTreasury = vm.envAddress("PLATFORM_TREASURY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Starting ComicPad deployment...
        // Platform Treasury: platformTreasury
            
        // Deploy contracts
        deployContracts();
        
        // Initialize contracts
        initializeContracts();
            
        // Set up permissions and configurations
        configureContracts();
        
        // Verify deployment
        verifyDeployment();
        
        vm.stopBroadcast();
        
        // ComicPad deployment completed successfully!
        logDeploymentInfo();
    }

    function deployContracts() internal {
        // Deploying contracts....

        // Deploy ComicNFT
        comicNFT = new ComicNFT(
            "ComicPad NFT",
            "CPNFT",
            "https://api.comicpad.com/metadata/",
            msg.sender
        );
        // ComicNFT deployed at: address(ComicNFT);

        comicPadV1 = new ComicPadV1();
        // ComicPadV1 deployed at: address(comicPadV1)

        // Prepare initialization data for V1
        bytes memory initData = abi.encodeWithSelector(
            ComicPadV1.initialize.selector,
            getUSDTAddress(),
            address(comicNFT),
            PLATFORM_FEE_PERCENTAGE,
            platformTreasury
        );

        // Deploy proxy with V1 implementation
        proxy = new ComicPadProxy(address(comicPadV1), initData);
        // ComicPadProxy deployed at: address(proxy)
        
        // Set up interface
        comicPad = IComicPad(address(proxy));
    }

    function initializeContracts() internal {
        // Initializing contracts...
        
        // Initialize V1 features
        //ComicPadV1(address(comicPadV1)).initializeV1();
        // ComicPadV1 initialized
        
        
        // Set ComicPad address in ComicNFT
        comicNFT.setComicPadAddress(address(proxy));
        // ComicNFT configured with ComicPad address
    }

    function configureContracts() internal {
        // Configuring contracts...
        
        // Transfer ownership of ComicNFT to proxy
        comicNFT.transferOwnership(address(proxy));
        // ComicNFT ownership transferred to proxy
        
    }

    function verifyDeployment() internal {
        // Vrrifying deplou=yment...

        // Verify ComicPad interface
        if (comicPad.getUSDTAddress() != getUSDTAddress()) {
            revert USDTAddressMismatch(getUSDTAddress(), comicPad.getUSDTAddress());
        }

        if (comicPad.getComicNFTAddress() != address(comicNFT)) {
            revert ComicNFTAddressMismatch(address(comicNFT), comicPad.getComicNFTAddress());
        }

        if (comicPad.getPlatformFeePercentage() != PLATFORM_FEE_PERCENTAGE) {
            revert PlatformFeeMismatch(PLATFORM_FEE_PERCENTAGE, comicPad.getPlatformFeePercentage());
        }

        if (comicPad.getTotalProjects() != 0) {
            revert InitialProjectCountNotZero(comicPad.getTotalProjects());
        }

        if (comicPad.getTotalEpisodes() != 0) {
            revert InitialEpisodeCountNotZero(comicPad.getTotalEpisodes());
        }

        if (comicNFT.comicPadAddress() != address(proxy)) {
            revert ComicPadAddressMismatch(address(proxy), comicNFT.comicPadAddress());
        }

        // Deployment verification passed

    }

    function logDeploymentInfo() internal view {
        // Deployment Summary:
        // ======================
        // ComicNFT: address(comicNFT)
        // ComicPadV1: address(comicPadV1)
        // ComicPadV2: address(comicPadV2)
        // ComicPadProxy: address(proxy)
        // ComicPadUpgrader: address(upgrader)
        // Platform Treasury: platformTreasury
        // USDT Address: getUSDTAddress()
        // Platform Fee: PLATFORM_FEE_PERCENTAGE basis points (PLATFORM_FEE_PERCENTAGE / 100 %)
        // Upgrade Cooldown: UPGRADE_COOLDOWN / 1 days days
        
        // Contract Interactions:
        // ========================
        // Users interact with: address(proxy)
        // Admin upgrades via: address(upgrader)
        // NFTs minted through: address(comicNFT)
        
        // Next Steps:
        // ==============
        // 1. Verify contracts on block explorer
        // 2. Set up frontend integration
        // 3. Configure USDT allowances
        // 4. Test upgrade functionality
        // 5. Deploy to mainnet
    }

    function getUSDTAddress() internal view returns (address) {
        uint256 chainId = block.chainid;
        
        if (chainId == 1) {
            // Ethereum mainnet
            return USDT_MAINNET;
        } else if (chainId == 5) {
            // Goerli testnet
            return USDT_TESTNET;
        } else if (chainId == 11155111) {
            // Sepolia testnet
            return USDT_TESTNET;
        } else {
            // For local testing, return a mock address
            return address(0x1234567890123456789012345678901234567890);
        }
    }

}