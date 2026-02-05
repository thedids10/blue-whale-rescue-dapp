import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import './DAppPage.css'

// Configuration - Update after deploying contracts
const CONFIG = {
  requiredNetworkName: 'sepolia',
  requiredChainId: '0xaa36a7',
  charityCrowdfundingAddress: '0xYourCrowdfundingContractAddress',
  charityTokenAddress: '0xYourCharityTokenAddress',
}

// Placeholder ABIs - Replace after compiling contracts
const charityCrowdfundingAbi = []
const charityTokenAbi = []

function DAppPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [network, setNetwork] = useState('')
  const [ethBalance, setEthBalance] = useState('0.0000')
  const [tokenBalance, setTokenBalance] = useState('0')
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [status, setStatus] = useState('Ready. Please connect your MetaMask wallet.')
  const [isLoading, setIsLoading] = useState(false)

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
      const network = await provider.getNetwork()
      const chainIdHex = '0x' + network.chainId.toString(16)
      setNetwork(`${network.name} (${chainIdHex})`)

      // Check if correct network
      const isCorrect = chainIdHex.toLowerCase() === CONFIG.requiredChainId.toLowerCase()
      setIsWrongNetwork(!isCorrect)

      // Get ETH balance
      const balance = await provider.getBalance(address)
      setEthBalance(parseFloat(ethers.formatEther(balance)).toFixed(4))

      setStatus(isCorrect ? 'Connected. You can now create and fund campaigns.' : 'Wrong network. Please switch to Sepolia.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to connect. See console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    if (!charityCrowdfundingAbi.length) {
      alert('Crowdfunding contract is not connected yet.\n\nAfter deploying your Solidity contracts and adding the ABI + address, this will create real campaigns on-chain.')
      return
    }
    // Contract interaction would go here
    setStatus('Creating campaign...')
  }

  const handleDonate = async (e) => {
    e.preventDefault()
    if (!charityCrowdfundingAbi.length) {
      alert('Crowdfunding contract is not connected yet.\n\nAfter integration, this will send a real donation transaction and mint CTK tokens.')
      return
    }
    // Contract interaction would go here
    setStatus('Processing donation...')
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
                <span className="balance-value">{tokenBalance}</span>
              </div>
            </div>

            {isWrongNetwork && (
              <div className="warning-banner">
                Please switch MetaMask to the Sepolia test network.
              </div>
            )}

            <p className="hint">
              This DApp is for education only and works only on Ethereum test networks. Use free test ETH from a faucet.
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
                <button type="submit" className="submit-btn primary" disabled={!isConnected}>
                  Create campaign on-chain
                </button>
                <p className="helper">
                  Campaign creation will be executed as a real blockchain transaction via MetaMask (on testnet).
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
                <button type="submit" className="submit-btn secondary" disabled={!isConnected}>
                  Donate via MetaMask
                </button>
                <p className="helper">
                  Donations will mint CTK tokens proportional to your contribution.
                </p>
              </form>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="campaigns-card">
            <h3>Active Campaigns</h3>
            <p>This section will show data read from the blockchain: campaign list, progress, deadlines, and your contributions.</p>
            <div className="empty-state">
              <p>No campaigns loaded yet. After connecting the Solidity contracts, this area will display real on-chain data.</p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="tech-card">
            <h3>Technical Details</h3>
            <div className="tech-grid">
              <div>
                <h4>Architecture</h4>
                <p>This frontend interacts with a Solidity-based CharityCrowdfunding smart contract and an ERC-20 CharityToken contract on Ethereum testnet.</p>
              </div>
              <div>
                <h4>MetaMask & Network</h4>
                <p>All blockchain interactions are executed through the user's MetaMask wallet, using only free test ETH.</p>
              </div>
              <div>
                <h4>Next Steps</h4>
                <p>Implement the Solidity contracts, deploy them via Hardhat, and add the contract addresses and ABI to complete the DApp.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DAppPage
