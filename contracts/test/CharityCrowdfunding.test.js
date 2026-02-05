const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Blue Whale Rescue Fund", function () {
  let charityToken;
  let crowdfunding;
  let owner;
  let donor1;
  let donor2;

  const ONE_ETH = ethers.parseEther("1");
  const HALF_ETH = ethers.parseEther("0.5");

  beforeEach(async function () {
    [owner, donor1, donor2] = await ethers.getSigners();

    // Deploy CharityToken
    const CharityToken = await ethers.getContractFactory("CharityToken");
    charityToken = await CharityToken.deploy();
    await charityToken.waitForDeployment();

    // Deploy CharityCrowdfunding
    const CharityCrowdfunding = await ethers.getContractFactory("CharityCrowdfunding");
    crowdfunding = await CharityCrowdfunding.deploy(await charityToken.getAddress());
    await crowdfunding.waitForDeployment();

    // Set crowdfunding contract in token
    await charityToken.setCrowdfundingContract(await crowdfunding.getAddress());
  });

  describe("CharityToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await charityToken.name()).to.equal("CharityToken");
      expect(await charityToken.symbol()).to.equal("CTK");
    });

    it("Should have 18 decimals", async function () {
      expect(await charityToken.decimals()).to.equal(18);
    });

    it("Should only allow crowdfunding contract to mint", async function () {
      await expect(
        charityToken.mint(donor1.address, ONE_ETH)
      ).to.be.revertedWith("Only crowdfunding contract can mint");
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign successfully", async function () {
      const deadline = (await time.latest()) + 86400; // 1 day from now
      
      await expect(
        crowdfunding.createCampaign("Save Blue Whales", ONE_ETH, deadline)
      ).to.emit(crowdfunding, "CampaignCreated");

      const campaign = await crowdfunding.getCampaign(0);
      expect(campaign.title).to.equal("Save Blue Whales");
      expect(campaign.goal).to.equal(ONE_ETH);
      expect(campaign.creator).to.equal(owner.address);
      expect(campaign.exists).to.be.true;
    });

    it("Should fail with empty title", async function () {
      const deadline = (await time.latest()) + 86400;
      
      await expect(
        crowdfunding.createCampaign("", ONE_ETH, deadline)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail with zero goal", async function () {
      const deadline = (await time.latest()) + 86400;
      
      await expect(
        crowdfunding.createCampaign("Test", 0, deadline)
      ).to.be.revertedWith("Goal must be greater than 0");
    });

    it("Should fail with past deadline", async function () {
      const deadline = (await time.latest()) - 1;
      
      await expect(
        crowdfunding.createCampaign("Test", ONE_ETH, deadline)
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should increment campaign count", async function () {
      const deadline = (await time.latest()) + 86400;
      
      expect(await crowdfunding.campaignCount()).to.equal(0);
      
      await crowdfunding.createCampaign("Campaign 1", ONE_ETH, deadline);
      expect(await crowdfunding.campaignCount()).to.equal(1);
      
      await crowdfunding.createCampaign("Campaign 2", ONE_ETH, deadline);
      expect(await crowdfunding.campaignCount()).to.equal(2);
    });
  });

  describe("Donations", function () {
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      await crowdfunding.createCampaign("Save Blue Whales", ONE_ETH, deadline);
    });

    it("Should accept donations and update total", async function () {
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: HALF_ETH });
      
      const campaign = await crowdfunding.getCampaign(0);
      expect(campaign.totalRaised).to.equal(HALF_ETH);
    });

    it("Should track individual donations", async function () {
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: HALF_ETH });
      
      const donation = await crowdfunding.getDonation(0, donor1.address);
      expect(donation).to.equal(HALF_ETH);
    });

    it("Should mint CTK tokens as reward (100 CTK per 1 ETH)", async function () {
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: ONE_ETH });
      
      // 100 CTK per 1 ETH = 100 * 10^18 tokens
      const expectedReward = ethers.parseEther("100");
      const balance = await charityToken.balanceOf(donor1.address);
      expect(balance).to.equal(expectedReward);
    });

    it("Should emit DonationReceived event", async function () {
      await expect(
        crowdfunding.connect(donor1).donateToCampaign(0, { value: ONE_ETH })
      ).to.emit(crowdfunding, "DonationReceived");
    });

    it("Should fail for non-existent campaign", async function () {
      await expect(
        crowdfunding.connect(donor1).donateToCampaign(99, { value: ONE_ETH })
      ).to.be.revertedWith("Campaign does not exist");
    });

    it("Should fail with zero donation", async function () {
      await expect(
        crowdfunding.connect(donor1).donateToCampaign(0, { value: 0 })
      ).to.be.revertedWith("Donation must be greater than 0");
    });

    it("Should fail after deadline", async function () {
      await time.increaseTo(deadline + 1);
      
      await expect(
        crowdfunding.connect(donor1).donateToCampaign(0, { value: ONE_ETH })
      ).to.be.revertedWith("Campaign deadline has passed");
    });

    it("Should handle multiple donations from same donor", async function () {
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: HALF_ETH });
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: HALF_ETH });
      
      const donation = await crowdfunding.getDonation(0, donor1.address);
      expect(donation).to.equal(ONE_ETH);
    });

    it("Should handle donations from multiple donors", async function () {
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: HALF_ETH });
      await crowdfunding.connect(donor2).donateToCampaign(0, { value: HALF_ETH });
      
      const campaign = await crowdfunding.getCampaign(0);
      expect(campaign.totalRaised).to.equal(ONE_ETH);
    });
  });

  describe("Campaign Finalization", function () {
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      await crowdfunding.createCampaign("Save Blue Whales", ONE_ETH, deadline);
    });

    it("Should finalize campaign after deadline", async function () {
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: ONE_ETH });
      await time.increaseTo(deadline + 1);
      
      await expect(crowdfunding.finalizeCampaign(0))
        .to.emit(crowdfunding, "CampaignFinalized");
      
      const campaign = await crowdfunding.getCampaign(0);
      expect(campaign.finalized).to.be.true;
    });

    it("Should fail before deadline", async function () {
      await expect(
        crowdfunding.finalizeCampaign(0)
      ).to.be.revertedWith("Campaign deadline has not passed");
    });

    it("Should fail for already finalized campaign", async function () {
      await time.increaseTo(deadline + 1);
      await crowdfunding.finalizeCampaign(0);
      
      await expect(
        crowdfunding.finalizeCampaign(0)
      ).to.be.revertedWith("Campaign already finalized");
    });

    it("Should not accept donations after finalization", async function () {
      await time.increaseTo(deadline + 1);
      await crowdfunding.finalizeCampaign(0);
      
      await expect(
        crowdfunding.connect(donor1).donateToCampaign(0, { value: ONE_ETH })
      ).to.be.revertedWith("Campaign has been finalized");
    });
  });

  describe("Fund Withdrawal", function () {
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      await crowdfunding.createCampaign("Save Blue Whales", ONE_ETH, deadline);
      await crowdfunding.connect(donor1).donateToCampaign(0, { value: ONE_ETH });
    });

    it("Should allow creator to withdraw after finalization", async function () {
      await time.increaseTo(deadline + 1);
      await crowdfunding.finalizeCampaign(0);
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await crowdfunding.withdrawFunds(0);
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Balance should increase (minus gas)
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should fail if not creator", async function () {
      await time.increaseTo(deadline + 1);
      await crowdfunding.finalizeCampaign(0);
      
      await expect(
        crowdfunding.connect(donor1).withdrawFunds(0)
      ).to.be.revertedWith("Only creator can withdraw");
    });

    it("Should fail if not finalized", async function () {
      await expect(
        crowdfunding.withdrawFunds(0)
      ).to.be.revertedWith("Campaign not finalized yet");
    });

    it("Should emit FundsWithdrawn event", async function () {
      await time.increaseTo(deadline + 1);
      await crowdfunding.finalizeCampaign(0);
      
      await expect(crowdfunding.withdrawFunds(0))
        .to.emit(crowdfunding, "FundsWithdrawn");
    });
  });

  describe("Campaign Status", function () {
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      await crowdfunding.createCampaign("Save Blue Whales", ONE_ETH, deadline);
    });

    it("Should return true for active campaign", async function () {
      expect(await crowdfunding.isCampaignActive(0)).to.be.true;
    });

    it("Should return false after deadline", async function () {
      await time.increaseTo(deadline + 1);
      expect(await crowdfunding.isCampaignActive(0)).to.be.false;
    });

    it("Should return false for finalized campaign", async function () {
      await time.increaseTo(deadline + 1);
      await crowdfunding.finalizeCampaign(0);
      expect(await crowdfunding.isCampaignActive(0)).to.be.false;
    });

    it("Should return false for non-existent campaign", async function () {
      expect(await crowdfunding.isCampaignActive(99)).to.be.false;
    });
  });
});
