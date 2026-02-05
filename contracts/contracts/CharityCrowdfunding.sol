// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CharityToken.sol";

/**
 * @title CharityCrowdfunding
 * @dev Crowdfunding contract for the Blue Whale Rescue Fund
 * Allows creation of campaigns, accepting donations in test ETH,
 * and minting CTK reward tokens for donors
 * 
 * EDUCATIONAL USE ONLY - Ethereum testnet (Sepolia)
 */
contract CharityCrowdfunding {
    // Reference to the reward token contract
    CharityToken public charityToken;

    // Campaign structure
    struct Campaign {
        uint256 id;
        string title;
        address creator;
        uint256 goal;           // Goal in wei
        uint256 deadline;       // Unix timestamp
        uint256 totalRaised;    // Total ETH raised in wei
        bool finalized;         // Whether campaign has been finalized
        bool exists;            // Whether campaign exists
    }

    // Campaign ID counter
    uint256 public campaignCount;

    // Mapping from campaign ID to Campaign
    mapping(uint256 => Campaign) public campaigns;

    // Mapping from campaign ID => donor address => amount donated
    mapping(uint256 => mapping(address => uint256)) public donations;

    // Token reward rate: 100 CTK per 1 ETH donated
    uint256 public constant REWARD_RATE = 100;

    // Events
    event CampaignCreated(
        uint256 indexed id,
        string title,
        address indexed creator,
        uint256 goal,
        uint256 deadline
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 tokensRewarded
    );

    event CampaignFinalized(
        uint256 indexed id,
        uint256 totalRaised,
        bool goalReached
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    constructor(address _charityToken) {
        require(_charityToken != address(0), "Invalid token address");
        charityToken = CharityToken(_charityToken);
    }

    /**
     * @dev Creates a new crowdfunding campaign
     * @param _title Campaign title
     * @param _goal Funding goal in wei
     * @param _deadline Unix timestamp for campaign deadline
     */
    function createCampaign(
        string memory _title,
        uint256 _goal,
        uint256 _deadline
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_goal > 0, "Goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        uint256 campaignId = campaignCount;
        
        campaigns[campaignId] = Campaign({
            id: campaignId,
            title: _title,
            creator: msg.sender,
            goal: _goal,
            deadline: _deadline,
            totalRaised: 0,
            finalized: false,
            exists: true
        });

        campaignCount++;

        emit CampaignCreated(campaignId, _title, msg.sender, _goal, _deadline);
        
        return campaignId;
    }

    /**
     * @dev Donate ETH to a campaign and receive CTK tokens as reward
     * @param _campaignId ID of the campaign to donate to
     */
    function donateToCampaign(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.exists, "Campaign does not exist");
        require(!campaign.finalized, "Campaign has been finalized");
        require(block.timestamp < campaign.deadline, "Campaign deadline has passed");
        require(msg.value > 0, "Donation must be greater than 0");

        // Update campaign total
        campaign.totalRaised += msg.value;
        
        // Track individual donation
        donations[_campaignId][msg.sender] += msg.value;

        // Calculate and mint reward tokens (100 CTK per 1 ETH)
        uint256 tokenReward = (msg.value * REWARD_RATE);
        charityToken.mint(msg.sender, tokenReward);

        emit DonationReceived(_campaignId, msg.sender, msg.value, tokenReward);
    }

    /**
     * @dev Finalize a campaign after deadline has passed
     * @param _campaignId ID of the campaign to finalize
     */
    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.exists, "Campaign does not exist");
        require(!campaign.finalized, "Campaign already finalized");
        require(
            block.timestamp >= campaign.deadline,
            "Campaign deadline has not passed"
        );

        campaign.finalized = true;

        bool goalReached = campaign.totalRaised >= campaign.goal;

        emit CampaignFinalized(_campaignId, campaign.totalRaised, goalReached);
    }

    /**
     * @dev Withdraw funds from a finalized campaign (only creator)
     * @param _campaignId ID of the campaign
     */
    function withdrawFunds(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.exists, "Campaign does not exist");
        require(campaign.finalized, "Campaign not finalized yet");
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(campaign.totalRaised > 0, "No funds to withdraw");

        uint256 amount = campaign.totalRaised;
        campaign.totalRaised = 0; // Prevent reentrancy

        (bool success, ) = payable(campaign.creator).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_campaignId, campaign.creator, amount);
    }

    /**
     * @dev Get campaign details
     * @param _campaignId ID of the campaign
     */
    function getCampaign(uint256 _campaignId) external view returns (
        uint256 id,
        string memory title,
        address creator,
        uint256 goal,
        uint256 deadline,
        uint256 totalRaised,
        bool finalized,
        bool exists
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.id,
            campaign.title,
            campaign.creator,
            campaign.goal,
            campaign.deadline,
            campaign.totalRaised,
            campaign.finalized,
            campaign.exists
        );
    }

    /**
     * @dev Get donation amount for a specific donor in a campaign
     * @param _campaignId ID of the campaign
     * @param _donor Address of the donor
     */
    function getDonation(uint256 _campaignId, address _donor) external view returns (uint256) {
        return donations[_campaignId][_donor];
    }

    /**
     * @dev Check if a campaign is still active
     * @param _campaignId ID of the campaign
     */
    function isCampaignActive(uint256 _campaignId) external view returns (bool) {
        Campaign storage campaign = campaigns[_campaignId];
        return campaign.exists && 
               !campaign.finalized && 
               block.timestamp < campaign.deadline;
    }
}
