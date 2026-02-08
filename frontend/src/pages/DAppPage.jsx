import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import './DAppPage.css'

// Contract addresses (deployed to localhost:8545)
const CONFIG = {
  // For localhost Hardhat network
  requiredNetworkName: 'localhost',
  requiredChainId: '0x7a69', // 31337 in hex
  charityCrowdfundingAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  charityTokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
}

// CharityToken ABI (only needed functions)
const charityTokenAbi = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
]

// CharityCrowdfunding ABI
const charityCrowdfundingAbi = [
  "function campaignCount() view returns (uint256)",
  "function campaigns(uint256) view returns (uint256 id, string title, address creator, uint256 goal, uint256 deadline, uint256 totalRaised, bool finalized, bool exists)",
  "function createCampaign(string memory _title, uint256 _goal, uint256 _deadline) returns (uint256)",
  "function donateToCampaign(uint256 _campaignId) payable",
  "function getCampaign(uint256 _campaignId) view returns (uint256 id, string title, address creator, uint256 goal, uint256 deadline, uint256 totalRaised, bool finalized, bool exists)",
  "function getDonation(uint256 _campaignId, address _donor) view returns (uint256)",
  "function isCampaignActive(uint256 _campaignId) view returns (bool)",
  "event CampaignCreated(uint256 indexed id, string title, address indexed creator, uint256 goal, uint256 deadline)",
  "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, uint256 tokensRewarded)"
]

function DAppPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [network, setNetwork] = useState('')
  const [ethBalance, setEthBalance] = useState('0.0000')
  const [tokenBalance, setTokenBalance] = useState('0')
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [status, setStatus] = useState('Ready. Please connect your MetaMask wallet.')
  const [isLoading, setIsLoading] = useState(false)
  const [campaigns, setCampaigns] = useState([])

  // Contract instances
  const [crowdfundingContract, setCrowdfundingContract] = useState(null)
  const [tokenContract, setTokenContract] = useState(null)

  // Form states
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignGoal, setCampaignGoal] = useState('')
  const [campaignDeadline, setCampaignDeadline] = useState('')
  const [donateCampaignId, setDonateCampaignId] = useState('')
  const [donateAmount, setDonateAmount] = useState('')

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', () => window.location.reload())
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false)
      setAccount('')
      setStatus('Wallet disconnected.')
    } else {
      setAccount(accounts[0])
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask to use this DApp.')
      return
    }

    try {
      setIsLoading(true)
      setStatus('Requesting MetaMask access...')

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = accounts[0]

      setAccount(address)
      setIsConnected(true)

      // Get network info
      const networkInfo = await provider.getNetwork()
      const chainIdHex = '0x' + networkInfo.chainId.toString(16)
      setNetwork(`${networkInfo.name} (${chainIdHex})`)

      // Check if correct network (localhost or sepolia)
      const isLocalhost = chainIdHex.toLowerCase() === '0x7a69'
      const isSepolia = chainIdHex.toLowerCase() === '0xaa36a7'
      setIsWrongNetwork(!isLocalhost && !isSepolia)

      // Get ETH balance
      const balance = await provider.getBalance(address)
      setEthBalance(parseFloat(ethers.formatEther(balance)).toFixed(4))

      // Initialize contracts
      const crowdfunding = new ethers.Contract(
        CONFIG.charityCrowdfundingAddress,
        charityCrowdfundingAbi,
        signer
      )
      setCrowdfundingContract(crowdfunding)

      const token = new ethers.Contract(
        CONFIG.charityTokenAddress,
        charityTokenAbi,
        signer
      )
      setTokenContract(token)

      // Get token balance
      try {
        const tokenBal = await token.balanceOf(address)
        setTokenBalance(ethers.formatEther(tokenBal))
      } catch (e) {
        console.log('Could not get token balance:', e)
      }

      // Load campaigns
      await loadCampaigns(crowdfunding)

      setStatus('Connected! You can now create and fund campaigns.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to connect. See console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCampaigns = async (contract) => {
    try {
      const count = await contract.campaignCount()
      const campaignList = []
      
      for (let i = 0; i < count; i++) {
        const campaign = await contract.getCampaign(i)
        if (campaign.exists) {
          campaignList.push({
            id: Number(campaign.id),
            title: campaign.title,
            creator: campaign.creator,
            goal: ethers.formatEther(campaign.goal),
            deadline: new Date(Number(campaign.deadline) * 1000).toLocaleString(),
            totalRaised: ethers.formatEther(campaign.totalRaised),
            finalized: campaign.finalized,
            isActive: !campaign.finalized && Date.now() < Number(campaign.deadline) * 1000
          })
        }
      }
      
      setCampaigns(campaignList)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    
    if (!crowdfundingContract) {
      alert('Please connect your wallet first.')
      return
    }

    try {
      setIsLoading(true)
      setStatus('Creating campaign...')

      const goalWei = ethers.parseEther(campaignGoal)
      const deadlineTimestamp = Math.floor(new Date(campaignDeadline).getTime() / 1000)

      const tx = await crowdfundingContract.createCampaign(
        campaignTitle,
        goalWei,
        deadlineTimestamp
      )
      
      setStatus(`Transaction sent: ${tx.hash}`)
      await tx.wait()
      
      setStatus('Campaign created successfully!')
      setCampaignTitle('')
      setCampaignGoal('')
      setCampaignDeadline('')
      
      // Reload campaigns
      await loadCampaigns(crowdfundingContract)
    } catch (error) {
      console.error(error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDonate = async (e) => {
    e.preventDefault()
    
    if (!crowdfundingContract) {
      alert('Please connect your wallet first.')
      return
    }

    try {
      setIsLoading(true)
      setStatus('Processing donation...')

      const valueWei = ethers.parseEther(donateAmount)
      
      const tx = await crowdfundingContract.donateToCampaign(donateCampaignId, {
        value: valueWei
      })
      
      setStatus(`Transaction sent: ${tx.hash}`)
      await tx.wait()
      
      setStatus('Donation successful! CTK tokens minted to your wallet.')
      setDonateCampaignId('')
      setDonateAmount('')
      
      // Refresh balances and campaigns
      if (tokenContract && account) {
        const tokenBal = await tokenContract.balanceOf(account)
        setTokenBalance(ethers.formatEther(tokenBal))
        
        const provider = new ethers.BrowserProvider(window.ethereum)
        const ethBal = await provider.getBalance(account)
        setEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4))
      }
      
      await loadCampaigns(crowdfundingContract)
    } catch (error) {
      console.error(error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dapp">
      {/* Header */}
      <header className="dapp-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <div className="header-brand">
          <span className="brand-icon">CTK</span>
          <div>
            <h1>Blue Whale Rescue DApp</h1>
            <p>Transparent crowdfunding on Ethereum testnet</p>
          </div>
        </div>
      </header>

      <div className="dapp-layout">
        {/* Sidebar */}
        <aside className="dapp-sidebar">
          <div className="wallet-card">
            <h2>Wallet & Network</h2>
            <button 
              className={`connect-btn ${isConnected ? 'connected' : ''}`}
              onClick={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect MetaMask'}
            </button>

            <div className="wallet-info">
              <div className="info-row">
                <span className="label">Status</span>
                <span className={`value ${isConnected ? 'success' : ''}`}>
                  {isConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Address</span>
                <span className="value address">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '-'}</span>
              </div>
              <div className="info-row">
                <span className="label">Network</span>
                <span className="value">{network || '-'}</span>
              </div>
            </div>

            <div className="balances">
              <div className="balance-item">
                <span className="balance-label">ETH Balance</span>
                <span className="balance-value">{ethBalance}</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">CTK Balance</span>
                <span className="balance-value">{parseFloat(tokenBalance).toFixed(2)}</span>
              </div>
            </div>

            {isWrongNetwork && (
              <div className="warning-banner">
                Please switch MetaMask to Localhost:8545 or Sepolia network.
              </div>
            )}

            <p className="hint">
              This DApp is for education only. Use Hardhat local network (localhost:8545) or Sepolia testnet.
            </p>
          </div>

          <div className="sidebar-footer">
            <p>Course: Blockchain 1 • Final Examination Project</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dapp-main">
          <div className="status-bar">
            <span className="status-text">{status}</span>
          </div>

          <div className="forms-grid">
            {/* Create Campaign */}
            <div className="form-card">
              <h3>Create New Campaign</h3>
              <p>Define campaign details and deploy them to the blockchain.</p>
              <form onSubmit={handleCreateCampaign}>
                <div className="field">
                  <label>Campaign title</label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Protect blue whale migration routes"
                    required
                  />
                </div>
                <div className="field">
                  <label>Funding goal (ETH)</label>
                  <input
                    type="number"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    placeholder="1.5"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="field">
                  <label>Deadline</label>
                  <input
                    type="datetime-local"
                    value={campaignDeadline}
                    onChange={(e) => setCampaignDeadline(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="submit-btn primary" disabled={!isConnected || isLoading}>
                  {isLoading ? 'Processing...' : 'Create campaign on-chain'}
                </button>
                <p className="helper">
                  Campaign creation will be executed as a real blockchain transaction via MetaMask.
                </p>
              </form>
            </div>

            {/* Donate */}
            <div className="form-card">
              <h3>Donate to Campaign</h3>
              <p>Support an active campaign and receive CTK reward tokens.</p>
              <form onSubmit={handleDonate}>
                <div className="field">
                  <label>Campaign ID</label>
                  <input
                    type="number"
                    value={donateCampaignId}
                    onChange={(e) => setDonateCampaignId(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div className="field">
                  <label>Donation amount (ETH)</label>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    placeholder="0.1"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <button type="submit" className="submit-btn secondary" disabled={!isConnected || isLoading}>
                  {isLoading ? 'Processing...' : 'Donate via MetaMask'}
                </button>
                <p className="helper">
                  You will receive 100 CTK tokens for every 1 ETH donated.
                </p>
              </form>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="campaigns-card">
            <h3>Active Campaigns ({campaigns.length})</h3>
            <p>Real campaign data from the blockchain.</p>
            
            {campaigns.length === 0 ? (
              <div className="empty-state">
                <p>No campaigns yet. Create the first one!</p>
              </div>
            ) : (
              <div className="campaigns-list">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className={`campaign-item ${campaign.isActive ? 'active' : 'ended'}`}>
                    <div className="campaign-header">
                      <span className="campaign-id">#{campaign.id}</span>
                      <span className={`campaign-status ${campaign.isActive ? 'active' : 'ended'}`}>
                        {campaign.isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <h4>{campaign.title}</h4>
                    <div className="campaign-stats">
                      <div>
                        <span className="stat-label">Goal</span>
                        <span className="stat-value">{campaign.goal} ETH</span>
                      </div>
                      <div>
                        <span className="stat-label">Raised</span>
                        <span className="stat-value">{campaign.totalRaised} ETH</span>
                      </div>
                      <div>
                        <span className="stat-label">Deadline</span>
                        <span className="stat-value">{campaign.deadline}</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.min((parseFloat(campaign.totalRaised) / parseFloat(campaign.goal)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="tech-card">
            <h3>Technical Details</h3>
            <div className="tech-grid">
              <div>
                <h4>Contracts</h4>
                <p>CharityToken: {CONFIG.charityTokenAddress.slice(0, 10)}...</p>
                <p>Crowdfunding: {CONFIG.charityCrowdfundingAddress.slice(0, 10)}...</p>
              </div>
              <div>
                <h4>Network</h4>
                <p>Running on Hardhat local network (localhost:8545) or Sepolia testnet.</p>
              </div>
              <div>
                <h4>Reward Rate</h4>
                <p>100 CTK tokens are minted for every 1 ETH donated.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DAppPage
