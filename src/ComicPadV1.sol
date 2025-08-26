// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./interfaces/IComicPad.sol";
import "./ComicNFT.sol";

// ComidPadV1
// Initial Implementation
// Core functionality: comic project managemnet, NFT minting, earnings tracking

contract ComicPadV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IComicPad
{
    // Custom ERRORS
    error ProjectDoesNotExist(uint256 projectId);
    error EpisodeDoesNotExist(uint256 episodeId);
    error NotProjectCreator(uint256 projectId, address caller);
    error NotEpisodeCreator(uint256 episodeId, address caller);
    error InvalidUSDTAddress();
    error InvalidComicNFTAddress();
    error InvalidTreasuryAddress();
    error PlatformFeeTooHigh(uint256 attempted, uint256 max);
    error EmptyTitle();
    error EmptyDescription();
    error NoGenres();
    error EmptyMetadataUri();
    error InvalidMaxSupply(uint256 provided);
    error InvalidPercentages(uint256 creatorRewardPercentage, uint256 episodePlatformFeePercentage, uint256 maxBasisPoints);
    error EpisodeAlreadyLive(uint256 episodeId);
    error EpisodeNotLive(uint256 episodeId);
    error PublicMintingNotAllowed(uint256 episodeId);
    error EpisodeSupplyExceeded(uint256 episodeId, uint256 currentSupply, uint256 maxSupply);
    error MintPriceNotSet(uint256 episodeId);
    error USDTTransferFailed();
    error AlreadyPaidForAccess(uint256 episodeId, address user);
    error NoEarningsToWithdraw(address creator, uint256 amount);
    error InsufficientEarnings(uint256 requested, uint256 available);
    error InsufficientPlatformFees(uint256 requested, uint256 available);


    uint256 private _projectIdCounter;
    uint256 private _episodeIdCounter;

    IERC20 public usdtToken;

    ComicNFT public comicNFT;

    uint256 public platformFeePercentage; //in basis points; 100 = 1%

    address public platformTreasury;

    mapping(uint256 => ComicProject) public projects;
    mapping(uint256 => ComicEpisode) public episodes;
    mapping(uint256 => MintingRules) public mintingRules;
    mapping(address => uint256[]) public creatorProjects;
    mapping(uint256 => uint256[]) public projectEpisodes;
    mapping(address => EarningsData) public creatorEarnings;
    mapping(uint256 => EarningsData) public projectEarnings;
    mapping(uint256 => EarningsData) public episodeEarnings;
    mapping(uint256 => mapping(address => bool)) public readAccess;
    mapping(uint256 => uint256) public episodeReads;

    uint256 public platformTotalFees;

    uint256 internal constant BASIS_POINTS = 10000; //basic points denominator; 100%
    uint256 private constant MAX_PLATFORM_FEE = 2000;

    // ==== MODIFIERS ===
    modifier projectExists(uint256 projectId) {
        if (projects[projectId].creator == address(0)) {
            revert ProjectDoesNotExist(projectId);
        }
        _;
    }

    modifier episodeExists(uint256 episodeId) {
        if (episodes[episodeId].creator == address(0)) {
            revert EpisodeDoesNotExist(episodeId);
        }
        _;
    }

    modifier onlyProjectCreator(uint256 projectId) {
        if (projects[projectId].creator != msg.sender) {
            revert NotProjectCreator(projectId, msg.sender);
        }
        _;
    }

    modifier onlyEpisodeCreator(uint256 episodeId) {
        if (episodes[episodeId].creator != msg.sender) {
            revert NotEpisodeCreator(episodeId, msg.sender);
        }
        _;
    }

    // ==== INITIALIZER ====
    function initialize(
        address _usdtAddress,
        address _comicNFTAddress,
        uint256 _platformFeePercentage,
        address _platformTreasury
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        if (_usdtAddress == address(0)) revert InvalidUSDTAddress();
        if (_comicNFTAddress == address(0)) revert InvalidComicNFTAddress();
        if (_platformTreasury == address(0)) revert InvalidTreasuryAddress();
        if (_platformFeePercentage > MAX_PLATFORM_FEE) {
            revert PlatformFeeTooHigh(_platformFeePercentage, MAX_PLATFORM_FEE);
        }

        usdtToken = IERC20(_usdtAddress);
        comicNFT = ComicNFT(_comicNFTAddress);
        platformFeePercentage = _platformFeePercentage;
        platformTreasury = _platformTreasury;

        // Ccounters
        _projectIdCounter = 1;
        _episodeIdCounter = 1;
    }

    // ===== PROJECT MANAGEMENT ===
    function createComicProject(
        string memory title,
        string memory description,
        string[] memory genres
    ) external override whenNotPaused returns (uint256 projectId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(description).length == 0) revert EmptyDescription();
        if (genres.length == 0) revert NoGenres();

        projectId = _projectIdCounter;
        _projectIdCounter++;

        projects[projectId] = ComicProject({
            projectId: projectId,
            creator: msg.sender,
            title: title,
            description: description,
            genres: genres,
            isActive: true,
            totalEpisodes: 0,
            totalEarnings: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        creatorProjects[msg.sender].push(projectId);

        emit ComicProjectCreated(projectId, msg.sender, title, block.timestamp);

        return projectId;
    }

    function updateComicProject(
        uint256 projectId,
        string memory title,
        string memory description,
        string[] memory genres
    )
        external
        override
        whenNotPaused
        projectExists(projectId)
        onlyProjectCreator(projectId)
    {
        ComicProject storage project = projects[projectId];

        if (bytes(title).length > 0) {
            project.title = title;
        }

        if (bytes(description).length > 0) {
            project.description = description;
        }

        if (genres.length > 0) {
            project.genres = genres;
        }

        project.updatedAt = block.timestamp;
    }

    function getComicProject(
        uint256 projectId
    ) external view override returns (ComicProject memory project) {
        return projects[projectId];
    }

    function getProjectsByCreator(
        address creator
    ) external view override returns (uint256[] memory projectIds) {
        return creatorProjects[creator];
    }

    // ===== EPISODE MANAGEMNT ===
    function createComicEpisode(
        uint256 projectId,
        string memory title,
        string memory description,
        string memory metadataUri,
        uint256 mintPrice,
        uint256 maxSupply
    ) external whenNotPaused projectExists(projectId) onlyProjectCreator(projectId) returns (uint256 episodeId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(description).length == 0) revert EmptyDescription();
        if (bytes(metadataUri).length == 0) revert EmptyMetadataUri();
        if (maxSupply == 0) revert InvalidMaxSupply(maxSupply);

        episodeId = _episodeIdCounter;
        _episodeIdCounter++;

        episodes[episodeId] = ComicEpisode({
            episodeId: episodeId,
            projectId: projectId,
            creator: msg.sender,
            title: title,
            description: description,
            metadataUri: metadataUri,
            mintPrice: mintPrice,
            maxSupply: maxSupply,
            currentSupply: 0,
            isLive: false,
            isPayPerRead: false,
            readPrice: 0,
            totalReads: 0,
            totalEarnings: 0,
            createdAt: block.timestamp
        });

        projectEpisodes[projectId].push(episodeId);
        projects[projectId].totalEpisodes++;

        comicNFT.configureEpisode(episodeId, maxSupply, mintPrice, msg.sender);
        
        emit ComicEpisodeCreated(episodeId, projectId, title, mintPrice, maxSupply, block.timestamp);
        
        return episodeId;
    }

    function getComicEpisode(uint256 episodeId) external view override returns (ComicEpisode memory episode) {
        return episodes[episodeId];
    }
    
    function getEpisodesByProject(uint256 projectId) external view override returns (uint256[] memory episodeIds) {
        return projectEpisodes[projectId];
    }

    // ==== MINTING & REWARDS ====
    function setMintingRules(
        uint256 episodeId,
        uint256 mintPrice,
        uint256 maxSupply,
        uint256 creatorRewardPercentage,
        uint256 episodePlatformFeePercentage,
        bool allowPublicMinting,
        uint256 readPrice,
        bool isPayPerRead
    ) external override whenNotPaused episodeExists(episodeId) onlyEpisodeCreator(episodeId) {
        if ((creatorRewardPercentage + episodePlatformFeePercentage) > BASIS_POINTS) {
            revert InvalidPercentages(creatorRewardPercentage, episodePlatformFeePercentage, BASIS_POINTS);
        }
        if (episodes[episodeId].isLive) {
            revert EpisodeAlreadyLive(episodeId);
        }

        mintingRules[episodeId] = MintingRules({
            episodeId: episodeId,
            mintPrice: mintPrice,
            maxSupply: maxSupply,
            creatorRewardPercentage: creatorRewardPercentage,
            platformFeePercentage: episodePlatformFeePercentage,
            allowPublicMinting: allowPublicMinting,
            readPrice: readPrice,
            isPayPerRead: isPayPerRead
        });

        // update episode data
        episodes[episodeId].mintPrice = mintPrice;
        episodes[episodeId].maxSupply = maxSupply;
        episodes[episodeId].readPrice = readPrice;
        episodes[episodeId].isPayPerRead = isPayPerRead;

        // update ComicNFT configuration
        comicNFT.configureEpisode(episodeId, maxSupply, mintPrice, msg.sender);

        emit MintingRulesUpdated(episodeId, mintPrice, maxSupply, readPrice, isPayPerRead, block.timestamp);
    }

    function getMintingRules(uint256 episodeId) external view  returns (MintingRules memory rules) {
        return mintingRules[episodeId];
    }
 
    function mintComicNFT(uint256 episodeId) external virtual override whenNotPaused nonReentrant returns (uint256 tokenId) {
        ComicEpisode storage episode = episodes[episodeId];
        MintingRules storage rules = mintingRules[episodeId];

        if (!episode.isLive) {
            revert EpisodeNotLive(episodeId);
        }
        if (!rules.allowPublicMinting) {
            revert PublicMintingNotAllowed(episodeId);
        }
        if (episode.currentSupply >= episode.maxSupply) {
            revert EpisodeSupplyExceeded(episodeId, episode.currentSupply, episode.maxSupply);
        }
        if (episode.mintPrice == 0) {
            revert MintPriceNotSet(episodeId);
        }

        //update episode data
        episode.currentSupply++;
        episode.totalEarnings += episode.mintPrice;

        // fee Distribution
        uint256 creatorAmount = (episode.mintPrice * rules.creatorRewardPercentage) / BASIS_POINTS;
        uint256 platformAmount = (episode.mintPrice * rules.platformFeePercentage) / BASIS_POINTS;

        // UPDATE EARNINGS
        creatorEarnings[episode.creator].totalEarnings += episode.mintPrice;
        creatorEarnings[episode.creator].creatorEarnings += creatorAmount;
        projectEarnings[episode.projectId].totalEarnings += episode.mintPrice;
        projectEarnings[episode.projectId].creatorEarnings += creatorAmount;
        episodeEarnings[episodeId].totalEarnings += episode.mintPrice;
        episodeEarnings[episodeId].creatorEarnings += creatorAmount;

        platformTotalFees += platformAmount;

        // transfer USDT from minter to this contract
        if (!usdtToken.transferFrom(msg.sender, address(this), episode.mintPrice)) {
            revert USDTTransferFailed();
        }

        //mint the NFT
        tokenId = comicNFT.mint(msg.sender, episodeId, episode.metadataUri);

        emit NFTMinted(episodeId, tokenId, msg.sender, episode.mintPrice, block.timestamp);

        return tokenId;

    }

    // ===== PUBLISHING & READING FUNCTIONS ====
    function goLive(uint256 episodeId) external override whenNotPaused episodeExists(episodeId) onlyEpisodeCreator(episodeId) {
        ComicEpisode storage episode = episodes[episodeId];
        if (episode.isLive) {
            revert EpisodeAlreadyLive(episodeId);
        }

        if (episode.mintPrice == 0) {
            revert MintPriceNotSet(episodeId);
        }

        episode.isLive = true;
        comicNFT.setEpisodeLiveStatus(episodeId, true);

        emit EpisodeWentLive(episodeId, episode.projectId, block.timestamp);
    }

    function readComic(uint256 episodeId) external virtual override whenNotPaused nonReentrant {
        ComicEpisode storage episode = episodes[episodeId];
        if (!episode.isLive) {
            revert EpisodeNotLive(episodeId);
        }

        if (episode.isPayPerRead && episode.readPrice > 0) {
            if (readAccess[episodeId][msg.sender]) {
                revert AlreadyPaidForAccess(episodeId, msg.sender);
            }
            //transfer usdt from reader to this contract
            if (!usdtToken.transferFrom(msg.sender, address(this), episode.readPrice)) {
                revert USDTTransferFailed();
            }

            //calculate fee distribution
            uint256 creatorAmount = (episode.readPrice * (BASIS_POINTS - platformFeePercentage)) / BASIS_POINTS;
            uint256 platformAmount = (episode.readPrice * platformFeePercentage) / BASIS_POINTS;

            //update earnings
            creatorEarnings[episode.creator].totalEarnings += episode.readPrice;
            creatorEarnings[episode.creator].creatorEarnings += creatorAmount;
            projectEarnings[episode.projectId].totalEarnings += episode.readPrice;
            projectEarnings[episode.projectId].creatorEarnings += creatorAmount;
            episodeEarnings[episodeId].totalEarnings += episode.readPrice;
            episodeEarnings[episodeId].creatorEarnings += creatorAmount;

            platformTotalFees += platformAmount;

            //grant read access
            readAccess[episodeId][msg.sender] = true;

            emit ComicRead(episodeId, msg.sender, episode.readPrice, block.timestamp);
        }

        episodeReads[episodeId]++;
        episode.totalReads++;
    }

    function hasReadAccess(uint256 episodeId, address user) external view override returns (bool hasAccess) {
        ComicEpisode storage episode = episodes[episodeId];

        if (!episode.isPayPerRead) {
            return true;
        }

        return readAccess[episodeId][user];
    }

    // ==== EARNINGS & TRACKING FUNCTIONS ======
    function getCreatorEarnings(address creator) external view override returns (EarningsData memory earnings) {
        return creatorEarnings[creator];
    }

    function getProjectEarnings(uint256 projectId) external view override returns (EarningsData memory earnings) {
        return projectEarnings[projectId];
    }

    function getEpisodeEarnings(uint256 episodeId) external view override returns (EarningsData memory earnings) {
        return episodeEarnings[episodeId];
    }

    function withdrawEarnings(uint256 amount) external override whenNotPaused nonReentrant {
        EarningsData storage earnings = creatorEarnings[msg.sender];
        if (earnings.creatorEarnings == 0) {
            revert NoEarningsToWithdraw(msg.sender, earnings.creatorEarnings);
        }
        uint256 withdrawAmount;
        if (amount == 0) {
            withdrawAmount = earnings.creatorEarnings;
        } else {
            withdrawAmount = amount;
        }
        if (withdrawAmount > earnings.creatorEarnings) {
            revert InsufficientEarnings(withdrawAmount, earnings.creatorEarnings);
        }

        earnings.creatorEarnings -= withdrawAmount;
        earnings.lastWithdrawal = block.timestamp;
        
        if (!usdtToken.transfer(msg.sender, withdrawAmount)) {
            revert USDTTransferFailed();
        }

        emit EarningsWithdrawn(msg.sender, withdrawAmount, block.timestamp);

    }

    function getEpisodeReads(uint256 episodeId) external view override returns (uint256 totalReads) {
        return episodeReads[episodeId];
    }

    // ==== ADMIN FUNCTIONS =======
    function setUSDTAddress(address usdtAddress) external override onlyOwner {
        if (usdtAddress == address(0)) revert InvalidUSDTAddress();
        usdtToken = IERC20(usdtAddress);
    }

    function setComicNFTAddress(address comicNFTAddress) external  onlyOwner {
        if (comicNFTAddress == address(0)) revert InvalidComicNFTAddress();
        comicNFT = ComicNFT(comicNFTAddress);
    }

    function setPlatformFeePercentage(uint256 feePercentage) external override onlyOwner {
        if (feePercentage > MAX_PLATFORM_FEE) {
            revert PlatformFeeTooHigh(feePercentage, MAX_PLATFORM_FEE);
        }
        platformFeePercentage = feePercentage;
    }

    function withdrawPlatformFees(uint256 amount) external override onlyOwner nonReentrant {
        if (amount > platformTotalFees) {
            revert InsufficientPlatformFees(amount, platformTotalFees);
        }
        platformTotalFees -= amount;

        if (!usdtToken.transfer(platformTreasury, amount)) {
            revert USDTTransferFailed();
        }

    }

    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    function getTotalProjects() external view override returns (uint256 totalProjects) {
        return _projectIdCounter - 1;
    }
    
   
    function getTotalEpisodes() external view override returns (uint256 totalEpisodes) {
        return _episodeIdCounter - 1;
    }
    
    function getUSDTAddress() external view override returns (address usdtAddress) {
        return address(usdtToken);
    }
    
   
    function getComicNFTAddress() external view returns (address comicNFTAddress) {
        return address(comicNFT);
    }
    
    
    function getPlatformFeePercentage() external view override returns (uint256 feePercentage) {
        return platformFeePercentage;
    }

    // === UUPS UPGRADEABLE FUNCTIONS =====
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
