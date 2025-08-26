// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IComicPad {
    // ======= STRUCTS =======
    struct ComicProject {
        uint256 projectId;
        address creator;
        string title;
        string description;
        string[] genres;
        bool isActive;
        uint256 totalEpisodes;
        uint256 totalEarnings;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct ComicEpisode {
        uint256 episodeId;
        uint256 projectId;
        address creator;
        string title;
        string description;
        string metadataUri;
        uint256 mintPrice;
        uint256 maxSupply;
        uint256 currentSupply;
        bool isLive;
        bool isPayPerRead;
        uint256 readPrice;
        uint256 totalReads;
        uint256 totalEarnings;
        uint256 createdAt;
    }

    struct MintingRules {
        uint256 episodeId;
        uint256 mintPrice;
        uint256 maxSupply;
        uint256 creatorRewardPercentage;
        uint256 platformFeePercentage;
        bool allowPublicMinting;
        uint256 readPrice;
        bool isPayPerRead;
    }

    struct EarningsData {
        uint256 totalEarnings;
        uint256 creatorEarnings;
        uint256 platformFees;
        uint256 lastWithdrawal;
    }

    // ======= EVENTS ========
    event ComicProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string title,
        uint256 timestamp
    );

    event ComicEpisodeCreated(
        uint256 indexed episodeId,
        uint256 indexed projectId,
        string title,
        uint256 mintPrice,
        uint256 maxSupply,
        uint256 timestamp
    );

    event EpisodeWentLive(
        uint256 indexed episodeId,
        uint256 indexed projectId,
        uint256 timestamp
    );

    event NFTMinted(
        uint256 indexed episodeId,
        uint256 indexed tokenId,
        address indexed minter,
        uint256 price,
        uint256 timestamp
    );

    event ComicRead(
        uint256 indexed episodeId,
        address indexed reader,
        uint256 price,
        uint256 timestamp
    );

    event EarningsWithdrawn(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event MintingRulesUpdated(
        uint256 indexed episodeId,
        uint256 mintPrice,
        uint256 maxSupply,
        uint256 readPrice,
        bool isPayPerRead,
        uint256 timestamp
    );

    // ===== PROJECT MANAGEMENT FUNCTIONS ======
    function createComicProject(
        string memory title,
        string memory description,
        string[] memory genres
    ) external returns (uint256 projectId);

    function updateComicProject(
        uint256 projectId,
        string memory title,
        string memory description,
        string[] memory genres
    ) external;

    function getComicProject(
        uint256 projectId
    ) external view returns (ComicProject memory project);

    function getProjectsByCreator(address creator) external view returns (uint256[] memory projectIds);

    // ======= EPISODE MANAGEMENT FUNCTIONS =======
    function createComicEpisode(
        uint256 projectId,
        string memory title,
        string memory description,
        string memory metadataUri,
        uint256 mintPrice,
        uint256 maxSupply
    ) external returns (uint256 episodeId);

    function getComicEpisode(uint256 episodeId) external view returns (ComicEpisode memory episode);

    function getEpisodesByProject(uint256 projectId) external view returns (uint256[] memory episodeIds);

    // ====== MINTING & REWARDS FUNCTIONS ======
    function setMintingRules(
        uint256 episodeId,
        uint256 mintPrice,
        uint256 maxSupply,
        uint256 creatorRewardPercentage,
        uint256 platformFeePercentage,
        bool allowPublicMinting,
        uint256 readPrice,
        bool isPayPerRead
    ) external;

    function mintComicNFT(uint256 episodeId) external returns (uint256 tokenId);

    // =====    PUBLISHING & READING FUNCTIONS ======
    function goLive(uint256 episodeId) external;

    function readComic(uint256 episodeId) external;

    function hasReadAccess(uint256 episodeId, address user) external view returns (bool hasAccess);

    // ===== EARNING & TRACKING FUNCTIONS ======
    function getCreatorEarnings(address creator) external view returns (EarningsData memory earnings);

    function getProjectEarnings(uint256 projectId) external view returns (EarningsData memory earnings);

    function getEpisodeEarnings(uint256 episodeId) external view returns (EarningsData memory earnings);

    function withdrawEarnings(uint256 amount) external;

    function getEpisodeReads(uint256 episodeId) external view returns (uint256 totalReads);

    // ===== ADMIN FUNCTIONS ========
    function setUSDTAddress(address usdtAddress) external;

    function setComicNFTAddress(address comicNFTAddress) external;

    function setPlatformFeePercentage(uint256 feePercentage) external;

    function withdrawPlatformFees(uint256 amount) external;

    // ==== VIEW FUNCTIONS ======

    function getTotalProjects() external view returns (uint256 totalProjects);

    function getTotalEpisodes() external view returns (uint256 totalEpisodes);

    function getUSDTAddress() external view returns (address usdtAddress);

    function getComicNFTAddress() external view returns (address comicNFTAddress);

    function getPlatformFeePercentage() external view returns (uint256 feePercentage);
}
