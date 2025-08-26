// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ComicNFT.sol";
import "../src/ComicPadV1.sol";
import "@openzeppelin/contracts/mocks/ERC20Mock.sol";
import "../src/interfaces/IComicPad.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ComicPadTest is Test {

    address public deployer = address(0x1);
    address public creator = address(0x2);
    address public reader = address(0x3);
    address public treasury = address(0x4);

    MockUSDT public usdt;
    ComicNFT public comicNFT;
    ComicPadV1 public comicPadV1;
    ComicPadV2 public comicPadv2;
    ComicPadProxy public proxy;
    ComicPadUpgrader public upgrader;
    IComicPad public comicPad;

    string[] public testGenres;
    uint256 public constant MINT_PRICE = 100 * 10**6;
    uint256 public constant READ_PRICE = 10 * 10**6; 
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant PLATFORM_FEE = 500;

    function setUp() public {
       
        // test addresses
        vm.label(deployer, "Deployer");
        vm.label(creator, "Creator");
        vm.label(reader, "Reader");       
        vm.label(treasury, "Treasury");

        // mo ck Usdt
        usdt = new ERC20Mock("Mock USDT", "USDT", address(this), 1000000 * 10**6);
        vm.label(address(usdt), "MockUSDT");

        // TEST genres
        testGenres = new string[](2);
        testGenres[0] = "Action";
        testGenres[1] = "Adventure";

    }
}