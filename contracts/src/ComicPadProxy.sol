// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ComicPadProxy is ERC1967Proxy {
    constructor(
        address _implementation,
        bytes memory _data
    ) ERC1967Proxy(_implementation, _data) {}

    function getImplementation() external view returns (address) {
        return _implementation();
    }

    receive() external payable  {
        // Forward the call to the implementation
        _fallback();
    }

    fallback() external payable override {
        _fallback();
    }
}