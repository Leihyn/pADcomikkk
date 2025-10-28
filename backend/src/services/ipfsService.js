const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Test Pinata connection
      if (this.pinataApiKey && this.pinataSecretKey && 
          this.pinataApiKey !== 'your_pinata_api_key') {
        await this.testPinataConnection();
        console.log('✅ Pinata IPFS service initialized');
      } else {
        console.log('⚠️  Pinata credentials not provided, using demo mode');
      }
      
      // Test Web3.Storage connection
      if (this.web3StorageToken && this.web3StorageToken !== 'your_web3_storage_token') {
        await this.testWeb3StorageConnection();
        console.log('✅ Web3.Storage service initialized');
      } else {
        console.log('⚠️  Web3.Storage credentials not provided, using demo mode');
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize IPFS service:', error);
      console.log('⚠️  Running in demo mode without IPFS connection');
      this.isInitialized = true;
      return true;
    }
  }

  async testPinataConnection() {
    try {
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      });
      
      if (response.status !== 200) {
        throw new Error('Pinata authentication failed');
      }
    } catch (error) {
      throw new Error(`Pinata connection failed: ${error.message}`);
    }
  }

  async testWeb3StorageConnection() {
    try {
      const response = await axios.get('https://api.web3.storage/user', {
        headers: {
          'Authorization': `Bearer ${this.web3StorageToken}`
        }
      });
      
      if (response.status !== 200) {
        throw new Error('Web3.Storage authentication failed');
      }
    } catch (error) {
      throw new Error(`Web3.Storage connection failed: ${error.message}`);
    }
  }

  /**
   * Upload a single file to IPFS via Pinata
   * @param {Buffer|string} fileData - File data or file path
   * @param {string} fileName - Name of the file
   * @param {Object} metadata - Optional metadata
   * @returns {Object} Upload result with IPFS hash
   */
  async uploadToPinata(fileData, fileName, metadata = {}) {
    try {
      const formData = new FormData();
      
      // Add file
      if (Buffer.isBuffer(fileData)) {
        formData.append('file', fileData, fileName);
      } else {
        formData.append('file', fs.createReadStream(fileData), fileName);
      }
      
      // Add metadata
      const pinataMetadata = {
        name: fileName,
        keyvalues: metadata
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      
      // Add options
      const pinataOptions = {
        cidVersion: 1
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));
      
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      return {
        hash: response.data.IpfsHash,
        size: response.data.PinSize,
        timestamp: response.data.Timestamp,
        url: `${this.gatewayUrl}${response.data.IpfsHash}`
      };
    } catch (error) {
      console.error('❌ Failed to upload to Pinata:', error);
      throw error;
    }
  }

  /**
   * Upload JSON metadata to IPFS
   * @param {Object} metadata - JSON metadata object
   * @param {string} fileName - Name for the metadata file
   * @returns {Object} Upload result
   */
  async uploadMetadata(metadata, fileName = 'metadata.json') {
    try {
      const jsonString = JSON.stringify(metadata, null, 2);
      const buffer = Buffer.from(jsonString, 'utf8');
      
      return await this.uploadToPinata(buffer, fileName, {
        type: 'metadata',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to upload metadata:', error);
      throw error;
    }
  }

  /**
   * Process and upload comic pages with multiple resolutions
   * @param {Array} pageFiles - Array of page file paths or buffers
   * @param {Object} comicMetadata - Comic metadata
   * @returns {Object} Upload result with all page URLs
   */
  async uploadComicPages(pageFiles, comicMetadata) {
    try {
      const processedPages = [];
      const thumbnailHashes = [];
      const webHashes = [];
      const printHashes = [];
      
      for (let i = 0; i < pageFiles.length; i++) {
        const pageFile = pageFiles[i];
        const pageNumber = i + 1;
        
        console.log(`Processing page ${pageNumber}/${pageFiles.length}...`);
        
        // Process different resolutions
        const thumbnailBuffer = await this.resizeImage(pageFile, 'thumbnail');
        const webBuffer = await this.resizeImage(pageFile, 'web');
        const printBuffer = await this.resizeImage(pageFile, 'print');
        
        // Upload each resolution
        const thumbnailResult = await this.uploadToPinata(
          thumbnailBuffer, 
          `page-${pageNumber.toString().padStart(2, '0')}-thumb.jpg`,
          { type: 'thumbnail', page: pageNumber }
        );
        
        const webResult = await this.uploadToPinata(
          webBuffer, 
          `page-${pageNumber.toString().padStart(2, '0')}-web.jpg`,
          { type: 'web', page: pageNumber }
        );
        
        const printResult = await this.uploadToPinata(
          printBuffer, 
          `page-${pageNumber.toString().padStart(2, '0')}-print.jpg`,
          { type: 'print', page: pageNumber }
        );
        
        processedPages.push({
          pageNumber,
          thumbnail: thumbnailResult,
          web: webResult,
          print: printResult
        });
        
        thumbnailHashes.push(thumbnailResult.hash);
        webHashes.push(webResult.hash);
        printHashes.push(printResult.hash);
      }
      
      // Create CBZ archive for download
      const cbzBuffer = await this.createCBZArchive(printHashes, comicMetadata);
      const cbzResult = await this.uploadToPinata(
        cbzBuffer,
        `${comicMetadata.name.replace(/\s+/g, '-')}.cbz`,
        { type: 'cbz', pages: pageFiles.length }
      );
      
      return {
        pages: processedPages,
        cbz: cbzResult,
        totalPages: pageFiles.length,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to upload comic pages:', error);
      throw error;
    }
  }

  /**
   * Resize image to specified format
   * @param {string|Buffer} input - Input file path or buffer
   * @param {string} format - Target format (thumbnail, web, print)
   * @returns {Buffer} Resized image buffer
   */
  async resizeImage(input, format) {
    try {
      const formats = {
        thumbnail: { width: 400, height: 600, quality: 80 },
        web: { width: 1200, height: 1800, quality: 90 },
        print: { width: 2048, height: 3072, quality: 95 }
      };
      
      const config = formats[format];
      if (!config) {
        throw new Error(`Unknown format: ${format}`);
      }
      
      let sharpInstance = sharp(input);
      
      // Get image metadata
      const metadata = await sharpInstance.metadata();
      
      // Calculate optimal dimensions maintaining aspect ratio
      const { width, height } = this.calculateOptimalDimensions(
        metadata.width, 
        metadata.height, 
        config.width, 
        config.height
      );
      
      const buffer = await sharpInstance
        .resize(width, height, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: config.quality,
          progressive: true 
        })
        .toBuffer();
      
      return buffer;
    } catch (error) {
      console.error(`❌ Failed to resize image for ${format}:`, error);
      throw error;
    }
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   * @param {number} originalWidth - Original image width
   * @param {number} originalHeight - Original image height
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Object} Optimal width and height
   */
  calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Create CBZ archive from page hashes
   * @param {Array} pageHashes - Array of IPFS hashes for pages
   * @param {Object} metadata - Comic metadata
   * @returns {Buffer} CBZ archive buffer
   */
  async createCBZArchive(pageHashes, metadata) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];
      
      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
      
      // Add metadata file
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
      
      // Add pages (in a real implementation, you would download from IPFS)
      pageHashes.forEach((hash, index) => {
        const pageNumber = index + 1;
        archive.append(`Page ${pageNumber} placeholder`, { 
          name: `page-${pageNumber.toString().padStart(2, '0')}.jpg` 
        });
      });
      
      archive.finalize();
    });
  }

  /**
   * Retrieve file from IPFS
   * @param {string} hash - IPFS hash
   * @returns {Buffer} File data
   */
  async retrieveFromIPFS(hash) {
    try {
      const response = await axios.get(`${this.gatewayUrl}${hash}`, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`❌ Failed to retrieve from IPFS: ${hash}`, error);
      throw error;
    }
  }

  /**
   * Get file metadata from IPFS
   * @param {string} hash - IPFS hash
   * @returns {Object} File metadata
   */
  async getFileMetadata(hash) {
    try {
      const response = await axios.head(`${this.gatewayUrl}${hash}`);
      
      return {
        hash,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
        url: `${this.gatewayUrl}${hash}`
      };
    } catch (error) {
      console.error(`❌ Failed to get file metadata: ${hash}`, error);
      throw error;
    }
  }

  /**
   * Pin a hash to Pinata (ensure persistence)
   * @param {string} hash - IPFS hash to pin
   * @param {string} name - Name for the pin
   * @returns {Object} Pin result
   */
  async pinHash(hash, name) {
    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinByHash', {
        hashToPin: hash,
        pinataMetadata: {
          name: name
        }
      }, {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        hash,
        name,
        pinnedAt: new Date().toISOString(),
        requestId: response.data.requestId
      };
    } catch (error) {
      console.error(`❌ Failed to pin hash: ${hash}`, error);
      throw error;
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pinataConfigured: !!(this.pinataApiKey && this.pinataSecretKey),
      web3StorageConfigured: !!this.web3StorageToken,
      gatewayUrl: this.gatewayUrl,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new IPFSService();
