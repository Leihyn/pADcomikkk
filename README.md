# Comic Pad - Hedera NFT Comic Platform

A decentralized comic book publishing and NFT marketplace platform built on Hedera Hashgraph, featuring native HTS NFTs, IPFS storage, and an interactive comic reader.

## 🚀 Features

### Core Platform
- **Native HTS NFTs**: Leverage Hedera Token Service for efficient, low-cost NFT creation
- **IPFS Storage**: Decentralized storage for comic images and metadata
- **Interactive Comic Reader**: Full-featured reader with multiple view modes, zoom, bookmarks
- **Marketplace**: Buy, sell, and auction comic NFTs
- **Creator Studio**: Upload, configure, and publish comic collections
- **Wallet Integration**: HashPack wallet support for Hedera accounts

### Technical Highlights
- **Fast & Cheap**: Hedera's 3-5 second finality and ~$0.001 transaction costs
- **Carbon Negative**: Environmentally sustainable blockchain
- **Scalable**: Handle thousands of comics and transactions
- **User-Friendly**: Intuitive interface for creators and collectors

## 📁 Project Structure

```
comic-pad/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── services/       # Hedera, IPFS, Comic services
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── env.example
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── styles/       # Styled components
│   ├── package.json
│   └── vite.config.ts
├── src/                    # Solidity contracts (legacy)
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Hedera testnet account
- IPFS service (Pinata or Web3.Storage)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   # Hedera Configuration
   HEDERA_NETWORK=testnet
   HEDERA_ACCOUNT_ID=0.0.123456
   HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
   
   # IPFS Configuration
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_KEY=your_pinata_secret_key
   
   # Server Configuration
   PORT=3001
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Hedera Setup

1. **Create Hedera Account**
   - Visit [Hedera Portal](https://portal.hedera.com/)
   - Create a testnet account
   - Fund with test HBAR from faucet

2. **Get Account Credentials**
   - Account ID: `0.0.123456`
   - Private Key: Export from wallet
   - Public Key: Derived from private key

### IPFS Setup

**Option 1: Pinata**
1. Sign up at [Pinata](https://pinata.cloud/)
2. Get API key and secret
3. Configure in backend `.env`

**Option 2: Web3.Storage**
1. Sign up at [Web3.Storage](https://web3.storage/)
2. Get access token
3. Configure in backend `.env`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/connect-wallet` - Connect Hedera wallet
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Comic Endpoints

- `POST /api/comics/collections` - Create NFT collection
- `POST /api/comics` - Create comic issue
- `GET /api/comics/:id` - Get comic details
- `GET /api/comics/search` - Search comics
- `POST /api/comics/:id/mint` - Batch mint copies

### Marketplace Endpoints

- `POST /api/marketplace/list` - List comic for sale
- `POST /api/marketplace/buy` - Buy comic
- `POST /api/marketplace/bid` - Place auction bid
- `GET /api/marketplace/listings` - Get active listings

### Reader Endpoints

- `GET /api/reader/comic/:id` - Get comic content
- `GET /api/reader/page/:id/:page` - Get specific page
- `POST /api/reader/progress` - Save reading progress
- `POST /api/reader/bookmark` - Add bookmark

## 🎨 Usage Guide

### For Creators

1. **Connect Wallet**
   - Install HashPack wallet
   - Connect to Hedera testnet
   - Fund account with test HBAR

2. **Create Collection**
   - Go to Creator Studio
   - Upload collection artwork
   - Set collection metadata
   - Configure royalty percentage

3. **Publish Comic**
   - Upload comic pages (JPG/PNG)
   - Set pricing and supply
   - Configure minting rules
   - Go live!

### For Collectors

1. **Browse Marketplace**
   - Search by genre, creator, series
   - Filter by price, rarity, availability
   - View comic previews

2. **Purchase Comics**
   - Connect wallet
   - Buy with HBAR
   - Receive NFT instantly

3. **Read Comics**
   - Access via NFT ownership
   - Multiple view modes
   - Bookmark favorite pages
   - Download for offline reading

## 🔒 Security Features

- **Wallet Integration**: Secure transaction signing
- **Ownership Verification**: NFT ownership required for access
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Graceful error responses

## 🚀 Deployment

### Backend Deployment

**Using Docker:**
```bash
cd backend
docker build -t comic-pad-backend .
docker run -p 3001:3001 --env-file .env comic-pad-backend
```

**Using PM2:**
```bash
npm install -g pm2
pm2 start src/server.js --name comic-pad-api
pm2 save
pm2 startup
```

### Frontend Deployment

**Using Vercel:**
```bash
cd frontend
npm run build
vercel --prod
```

**Using Netlify:**
```bash
cd frontend
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables

**Production Backend:**
```env
NODE_ENV=production
HEDERA_NETWORK=mainnet
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=your_production_private_key
PINATA_API_KEY=your_production_pinata_key
PINATA_SECRET_KEY=your_production_pinata_secret
JWT_SECRET=your_production_jwt_secret
MONGODB_URI=your_production_mongodb_uri
```

**Production Frontend:**
```env
VITE_API_URL=https://api.comicpad.app
VITE_HEDERA_NETWORK=mainnet
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Test Hedera connection
npm run test:hedera

# Test IPFS upload
npm run test:ipfs

# Test full workflow
npm run test:integration
```

## 📊 Monitoring

### Health Checks
- `GET /health` - API health status
- `GET /api/comics/stats/overview` - Platform statistics
- `GET /api/marketplace/stats` - Marketplace metrics

### Logging
- Structured JSON logs
- Error tracking with stack traces
- Performance metrics
- User activity logs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow commit message conventions
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Comic Pad Docs](https://docs.comicpad.app)
- **Discord**: [Comic Pad Community](https://discord.gg/comicpad)
- **Email**: support@comicpad.app
- **Issues**: [GitHub Issues](https://github.com/comicpad/issues)

## 🙏 Acknowledgments

- **Hedera Hashgraph** - For the fast, sustainable blockchain infrastructure
- **IPFS** - For decentralized storage solutions
- **Pinata** - For reliable IPFS pinning services
- **HashPack** - For Hedera wallet integration
- **OpenZeppelin** - For secure smart contract libraries

---

**Built with ❤️ for the comic book community**