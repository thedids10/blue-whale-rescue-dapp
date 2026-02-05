// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CharityToken (CTK)
 * @dev ERC-20 reward token for the Blue Whale Rescue Fund
 * Tokens are minted as rewards when users donate to campaigns
 * This token has no real monetary value - testnet only for educational purposes
 */
contract CharityToken is ERC20, Ownable {
    // Address of the crowdfunding contract that can mint tokens
    address public crowdfundingContract;

    event CrowdfundingContractSet(address indexed contractAddress);
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("CharityToken", "CTK") Ownable(msg.sender) {}

    /**
     * @dev Sets the crowdfunding contract address that is allowed to mint tokens
     * @param _crowdfundingContract Address of the CharityCrowdfunding contract
     */
    function setCrowdfundingContract(address _crowdfundingContract) external onlyOwner {
        require(_crowdfundingContract != address(0), "Invalid address");
        crowdfundingContract = _crowdfundingContract;
        emit CrowdfundingContractSet(_crowdfundingContract);
    }

    /**
     * @dev Mints tokens to a donor as a reward for their contribution
     * Can only be called by the crowdfunding contract
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (proportional to ETH donated)
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == crowdfundingContract, "Only crowdfunding contract can mint");
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Returns the number of decimals (18 by default for ERC-20)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
