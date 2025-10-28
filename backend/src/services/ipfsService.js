import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import sharp from 'sharp';
import archiver from 'archiver';

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (
        this.pinataApiKey &&
        this.pinataSecretKey &&
        this.pinataApiKey !== 'your_pinata_api_key'
      ) {
        await this.testPinataConnection();
        console.log('✅ Pinata IPFS service initialized');
      } else {
        console.log('⚠️  Pinata credentials not provided, using demo mode');
      }

      console.log('🌐 Using Pinata-only mode (Web3.Storage disabled)');
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
          'pinata_secret_api_key': this.pinataSecretKey,
        },
      });

      if (response.status !== 200) {
        throw new Error('Pinata authentication failed');
      }
    } catch (error) {
      throw new Error(`Pinata connection failed: ${error.message}`);
    }
  }

  async uploadToPinata(fileData, fileName, metadata = {}) {
    try {
      const formData = new FormData();

      if (Buffer.isBuffer(fileData)) {
        formData.append('file', fileData, fileName);
      } else {
        formData.append('file', fs.createReadStream(fileData), fileName);
      }

      const pinataMetadata = {
        name: fileName,
        keyvalues: metadata,
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      const pinataOptions = { cidVersion: 1 };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        hash: response.data.IpfsHash,
        size: response.data.PinSize,
        timestamp: response.data.Timestamp,
        url: `${this.gatewayUrl}${response.data.IpfsHash}`,
      };
    } catch (error) {
      console.error('❌ Failed to upload to Pinata:', error);
      throw error;
    }
  }

  async uploadMetadata(metadata, fileName = 'metadata.json') {
    try {
      const jsonString = JSON.stringify(metadata, null, 2);
      const buffer = Buffer.from(jsonString, 'utf8');

      return await this.uploadToPinata(buffer, fileName, {
        type: 'metadata',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to upload metadata:', error);
      throw error;
    }
  }

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

        const thumbnailBuffer = await this.resizeImage(pageFile, 'thumbnail');
        const webBuffer = await this.resizeImage(pageFile, 'web');
        const printBuffer = await this.resizeImage(pageFile, 'print');

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
          print: printResult,
        });

        thumbnailHashes.push(thumbnailResult.hash);
        webHashes.push(webResult.hash);
        printHashes.push(printResult.hash);
      }

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
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to upload comic pages:', error);
      throw error;
    }
  }

  async resizeImage(input, format) {
    try {
      const formats = {
        thumbnail: { width: 400, height: 600, quality: 80 },
        web: { width: 1200, height: 1800, quality: 90 },
        print: { width: 2048, height: 3072, quality: 95 },
      };

      const config = formats[format];
      if (!config) throw new Error(`Unknown format: ${format}`);

      const sharpInstance = sharp(input);
      const metadata = await sharpInstance.metadata();

      const { width, height } = this.calculateOptimalDimensions(
        metadata.width,
        metadata.height,
        config.width,
        config.height
      );

      const buffer = await sharpInstance
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: config.quality, progressive: true })
        .toBuffer();

      return buffer;
    } catch (error) {
      console.error(`❌ Failed to resize image for ${format}:`, error);
      throw error;
    }
  }

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
      height: Math.round(height),
    };
  }

  async createCBZArchive(pageHashes, metadata) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

      pageHashes.forEach((hash, index) => {
        const pageNumber = index + 1;
        archive.append(`Page ${pageNumber} placeholder`, {
          name: `page-${pageNumber.toString().padStart(2, '0')}.jpg`,
        });
      });

      archive.finalize();
    });
  }

  async retrieveFromIPFS(hash) {
    try {
      const response = await axios.get(`${this.gatewayUrl}${hash}`, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`❌ Failed to retrieve from IPFS: ${hash}`, error);
      throw error;
    }
  }

  async getFileMetadata(hash) {
    try {
      const response = await axios.head(`${this.gatewayUrl}${hash}`);
      return {
        hash,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
        url: `${this.gatewayUrl}${hash}`,
      };
    } catch (error) {
      console.error(`❌ Failed to get file metadata: ${hash}`, error);
      throw error;
    }
  }

  async pinHash(hash, name) {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinByHash',
        {
          hashToPin: hash,
          pinataMetadata: { name },
        },
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        hash,
        name,
        pinnedAt: new Date().toISOString(),
        requestId: response.data.requestId,
      };
    } catch (error) {
      console.error(`❌ Failed to pin hash: ${hash}`, error);
      throw error;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pinataConfigured: !!(this.pinataApiKey && this.pinataSecretKey),
      gatewayUrl: this.gatewayUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new IPFSService();
