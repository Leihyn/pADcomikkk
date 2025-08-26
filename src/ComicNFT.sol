// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ComicNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {

    // ====== CUSTOM ERRORS =======
    error OnlyComicPadAllowed(address caller, address expected);
    error MintToZeroAddress();
    error EpisodeNotLive(uint256 episodeId);
    error EpisodeSupplyExceeded(uint256 episodeId);
    error EpisodeBatchSupplyExceeded(
        uint256 episodeId,
        uint256 attempted,
        uint256 max
    );
    error InvalidEpisodeId();
    error InvalidMaxSupply();
    error InvalidCreatorAddress();
    error InvalidComicPadAddress();
    uint256 private _tokenIdCounter;

    mapping(uint256 => uint256) public tokenToEpisode;
    mapping(uint256 => uint256[]) public episodeToTokens;
    mapping(uint256 => uint256) public episodeSupply;
    mapping(uint256 => uint256) public episodeMaxSupply;
    mapping(uint256 => uint256) public episodeMintPrice;
    mapping(uint256 => address) public episodeCreators;
    mapping(uint256 => bool) public episodeIsLive;

    address public comicPadAddress;

    string private _baseTokenURI;

    // ===== EVENTS =====
    event TokenMinted(
        uint256 indexed tokenId,
        uint256 indexed episodeId,
        address indexed to,
        string tokenURI,
        uint256 timestamp
    );

    event EpisodeConfigured(
        uint256 indexed episodeId,
        uint256 maxSupply,
        uint256 mintPrice,
        address indexed creator,
        uint256 timestamp
    );

    event EpisodeLiveStatusChanged(
        uint256 indexed episodeId,
        bool isLive,
        uint256 timestamp
    );

    event ComicPadAddressUpdated(
        address indexed oldAddress,
        address indexed newAddress,
        uint256 timestamp
    );

    // ==== MODIFIERS ====
    modifier onlyComicPad() {
        if (msg.sender != comicPadAddress) {
            revert OnlyComicPadAllowed(msg.sender, comicPadAddress);
        }
        _;
    }

    // ====== CONSTRUCTOR =======
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _baseTokenURI = baseTokenURI;
        _tokenIdCounter = 1;
    }

    // ==== MINTING =====
    function mint(
        address to,
        uint256 episodeId,
        string memory uri
    ) external onlyComicPad nonReentrant returns (uint256 tokenId) {
        if (to == address(0)) revert MintToZeroAddress();
        if (!episodeIsLive[episodeId]) revert EpisodeNotLive(episodeId);
        if (episodeSupply[episodeId] >= episodeMaxSupply[episodeId])
            revert EpisodeSupplyExceeded(episodeId);

        tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        tokenToEpisode[tokenId] = episodeId;
        episodeToTokens[episodeId].push(tokenId);
        episodeSupply[episodeId]++;

        _setTokenURI(tokenId, uri);
        _safeMint(to, tokenId);

        emit TokenMinted(tokenId, episodeId, to, uri, block.timestamp);

        return tokenId;
    }

    function batchMint(
        address to,
        uint256 episodeId,
        string[] memory tokenURIs
    ) external onlyComicPad nonReentrant returns (uint256[] memory tokenIds) {
        uint256 attempted = episodeSupply[episodeId] + tokenURIs.length;
        uint256 max = episodeMaxSupply[episodeId];

        if (to == address(0)) revert MintToZeroAddress();
        if (!episodeIsLive[episodeId]) revert EpisodeNotLive(episodeId);

        if (attempted > max)
            revert EpisodeBatchSupplyExceeded(episodeId, attempted, max);

        tokenIds = new uint256[](tokenURIs.length);
        episodeSupply[episodeId] += tokenURIs.length;

        for (uint256 i = 0; i < tokenURIs.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;

            tokenToEpisode[tokenId] = episodeId;
            episodeToTokens[episodeId].push(tokenId);

            _setTokenURI(tokenId, tokenURIs[i]);
            _safeMint(to, tokenId);

            tokenIds[i] = tokenId;

            emit TokenMinted(
                tokenId,
                episodeId,
                to,
                tokenURIs[i],
                block.timestamp
            );
        }

        return tokenIds;
    }

    // ===== EPISODE CONFIG =====
    function configureEpisode(
        uint256 episodeId,
        uint256 maxSupply,
        uint256 mintPrice,
        address creator
    ) external onlyComicPad {
        if (episodeId == 0) revert InvalidEpisodeId();
        if (maxSupply == 0) revert InvalidMaxSupply();
        if (creator == address(0)) revert InvalidCreatorAddress();

        episodeMaxSupply[episodeId] = maxSupply;
        episodeMintPrice[episodeId] = mintPrice;
        episodeCreators[episodeId] = creator;

        emit EpisodeConfigured(episodeId, maxSupply, mintPrice, creator, block.timestamp);
    }

    function setEpisodeLiveStatus(uint256 episodeId, bool isLive) external onlyComicPad {
        if (episodeId == 0) revert InvalidEpisodeId();

        episodeIsLive[episodeId] = isLive;

        emit EpisodeLiveStatusChanged(episodeId, isLive, block.timestamp);
    }


    // === VIEW FUNCTIONS ===
    function getTokensByEpisode(uint256 episodeId) external view returns (uint256[] memory tokenIds) {
        return episodeToTokens[episodeId];
    }

    function getEpisodeByToken(uint256 tokenId) external view returns (uint256 episodeId) {
        return tokenToEpisode[tokenId];
    }

    function getEpisodeInfo(uint256 episodeId) external view returns (
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 mintPrice,
        address creator,
        bool isLive
    ) {
        return (
            episodeMaxSupply[episodeId],
            episodeSupply[episodeId],
            episodeMintPrice[episodeId],
            episodeCreators[episodeId],
            episodeIsLive[episodeId]
        );
    }

    function getTotalTokens() external view returns (uint256 totalTokens) {
        return _tokenIdCounter - 1;
    }

    function canMintEpisode(uint256 episodeId) external view returns (bool canMint) {
        if (!episodeIsLive[episodeId]) revert EpisodeNotLive(episodeId);
        if (episodeSupply[episodeId] >= episodeMaxSupply[episodeId]) revert EpisodeSupplyExceeded(episodeId);

        return true;
    }

    // ==== ADMIN FUNCTIONS ====
    function setComicPadAddress(address newComicPadAddress) external onlyOwner {
        if (newComicPadAddress == address(0)) revert InvalidComicPadAddress();

        address oldAddress = comicPadAddress;
        comicPadAddress = newComicPadAddress;

        emit ComicPadAddressUpdated(oldAddress, newComicPadAddress, block.timestamp);
    }

    function setBaseTokenURI(string memory newBaseTokenURI) external onlyOwner {
        _baseTokenURI = newBaseTokenURI;
    }

    // ===== OVERRIDE =====
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
