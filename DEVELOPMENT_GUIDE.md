# 🎨 Comic Pad - Development Guide

## 🚀 Quick Start

### Option 1: Automated Startup
```bash
./start-dev.sh
```

### Option 2: Manual Startup
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📡 Services

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## ✅ Current Status

### Backend (Port 3001) - ✅ WORKING
- All API endpoints functional
- Demo mode for Hedera/IPFS (no credentials needed)
- Fixed route ordering issue
- Health check: `GET /health`
- Search API: `GET /api/comics/search`
- Marketplace: `GET /api/marketplace/stats`

### Frontend (Port 3000) - ✅ WORKING
- React 18 + Vite build system
- Demo wallet integration
- All pages and components built
- Responsive design
- Comic reader with controls
- Marketplace interface

## 🏗️ Architecture

### Smart Contracts
- `ComicNFT.sol` - ERC721 NFT contract
- `ComicPadV1.sol` - Main platform contract (UUPS upgradeable)
- `ComicPadProxy.sol` - Proxy for upgrades
- `IComicPad.sol` - Interface definitions

### Backend Services
- **HederaService**: HTS integration with demo mode
- **IPFSService**: Decentralized storage (Pinata + Web3.Storage)
- **ComicService**: Business logic for comics
- **API Routes**: 20+ endpoints for all functionality

### Frontend Components
- **ComicReader**: Interactive comic viewing
- **Marketplace**: Search, filters, listings
- **CreatorStudio**: Publishing interface
- **Profile**: User management
- **Layout**: Header, footer, navigation

## 🔧 Development Features

### Demo Mode
- Backend runs without Hedera credentials
- Frontend has demo wallet integration
- All functionality works for development/testing

### Production Ready
- Docker containerization
- Environment configuration
- Security middleware (helmet, CORS, rate limiting)
- Input validation and error handling

## 📊 API Endpoints

### Comics
- `GET /api/comics/search` - Search comics
- `GET /api/comics/:id` - Get comic by ID
- `POST /api/comics` - Create comic
- `PUT /api/comics/:id` - Update comic

### Marketplace
- `GET /api/marketplace/stats` - Get marketplace statistics
- `GET /api/marketplace/listings` - Get active listings
- `POST /api/marketplace/list` - Create listing

### Reader
- `GET /api/reader/:comicId` - Get comic for reading
- `POST /api/reader/:comicId/read` - Track reading progress

## 🎯 Next Steps for Production

1. **Add Real Credentials**
   - Configure Hedera account ID and private key
   - Set up Pinata API keys
   - Add Web3.Storage token

2. **Deploy Smart Contracts**
   - Deploy to Hedera testnet/mainnet
   - Update contract addresses in backend

3. **Production Deployment**
   - Use Docker Compose for full stack
   - Configure production environment variables
   - Set up monitoring and logging

## 🐛 Troubleshooting

### Backend Issues
- Check if port 3001 is available
- Verify .env file exists in backend/
- Check console for service initialization errors

### Frontend Issues  
- Check if port 3000 is available
- Verify npm dependencies are installed
- Check browser console for errors

### API Issues
- Verify backend is running on port 3001
- Check CORS configuration
- Test with curl: `curl http://localhost:3001/health`

## 📝 Development Notes

- All services run in demo mode by default
- No blockchain transactions are made without real credentials
- Frontend uses demo wallet for development
- All API responses follow consistent format
- Error handling is comprehensive throughout

---

**Status**: ✅ FULLY FUNCTIONAL - Ready for development and testing!
