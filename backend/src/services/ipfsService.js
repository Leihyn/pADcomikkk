import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import sharp from 'sharp';
import archiver from 'archiver';
import { Web3Storage, File } from 'web3.storage';

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    this.web3Token = process.env.WEB3_STORAGE_TOKEN;
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    this.isInitialized = false;
    this.web3Client = null;
  }

  /** Initialize the service and test connections */
  async initialize() {
    try {
      if (this.web3Token && this.web3Token !== 'your_web3_storage_token') {
        this.web3Client = new Web3Storage({ token: this.web3Token });
        console.log('✅ Web3.Storage initialized');
      }

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

      if (!this.web3Client && !this.pinataApiKey) {
        console.log('⚠️  Running in local demo mode (no upload)');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize IPFS service:', error);
      this.isInitialized = true; // still let app run in demo mode
      return true;
    }
  }

  /** Verify Pinata API connection */
  async testPinataConnection() {
    try {
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
      });

      if (response.status !== 200) throw new Error('Pinata authentication failed');
    } catch (error) {
      throw new Error(`Pinata connection failed: ${error.message}`);
    }
  }

  /** Upload a file (Buffer or path) to Pinata */
  async uploadToPinata(fileData, fileName, metadata = {}) {
    try {
      const formData = new FormData();

      if (Buffer.isBuffer(fileData)) {
        formData.append('file', fileData, { filename: fileName });
      } else {
        formData.append('file', fs.createReadStream(fileData), fileName);
      }

      const pinataMetadata = { name: fileName, keyvalues: metadata };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        hash: response.data.IpfsHash,
        url: `${this.gatewayUrl}${response.data.IpfsHash}`,
        size: response.data.PinSize,
        timestamp: response.data.Timestamp,
      };
    } catch (error) {
      console.error('❌ Failed to upload to Pinata:', error.response?.data || error.message);
      throw error;
    }
  }

  /** Upload JSON metadata */
  async uploadMetadata(metadata, fileName = 'metadata.json') {
    const json = JSON.stringify(metadata, null, 2);
    const buffer = Buffer.from(json, 'utf8');
    return this.uploadToPinata(buffer, fileName, { type: 'metadata' });
  }

  /** Upload comic pages (with thumbnail/web/print + CBZ) */
  async uploadComicPages(pageFiles, comicMetadata) {
    try {
      const processedPages = [];

      for (let i = 0; i < pageFiles.length; i++) {
        const pageFile = pageFiles[i];
        const pageNumber = i + 1;

        console.log(`📄 Processing page ${pageNumber}/${pageFiles.length}`);

        const thumbBuffer = await this.resizeImage(pageFile, 'thumbnail');
        const webBuffer = await this.resizeImage(pageFile, 'web');
        const printBuffer = await this.resizeImage(pageFile, 'print');

        const [thumb, web, print] = await Promise.all([
          this.uploadToPinata(thumbBuffer, `page-${pageNumber}-thumb.jpg`, { type: 'thumbnail' }),
          this.uploadToPinata(webBuffer, `page-${pageNumber}-web.jpg`, { type: 'web' }),
          this.uploadToPinata(printBuffer, `page-${pageNumber}-print.jpg`, { type: 'print' }),
        ]);

        processedPages.push({
          pageNumber,
          thumbnail: thumb,
          web: web,
          print: print,
        });
      }

      const cbzBuffer = await this.createCBZArchive(processedPages, comicMetadata);
      const cbz = await this.uploadToPinata(
        cbzBuffer,
        `${comicMetadata.name.replace(/\s+/g, '-')}.cbz`,
        { type: 'cbz', pages: pageFiles.length }
      );

      return {
        pages: processedPages,
        cbz,
        totalPages: pageFiles.length,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ uploadComicPages failed:', error);
      throw error;
    }
  }

  /** Resize images for each display mode */
  async resizeImage(input, format) {
    const sizes = {
      thumbnail: { width: 400, height: 600, quality: 80 },
      web: { width: 1200, height: 1800, quality: 90 },
      print: { width: 2048, height: 3072, quality: 95 },
    };

    const config = sizes[format];
    if (!config) throw new Error(`Invalid resize format: ${format}`);

    try {
      const image = sharp(input);
      const meta = await image.metadata();

      const ratio = meta.width / meta.height;
      let width = config.width;
      let height = Math.round(width / ratio);
      if (height > config.height) {
        height = config.height;
        width = Math.round(height * ratio);
      }

      return await image
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: config.quality, progressive: true })
        .toBuffer();
    } catch (err) {
      console.error(`❌ resizeImage (${format}) failed:`, err);
      throw err;
    }
  }

  /** Create a .cbz (zip) archive for the comic */
  async createCBZArchive(pages, metadata) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Add metadata file
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

      // Add placeholder page entries
      pages.forEach((p) => {
        archive.append(`Page ${p.pageNumber}`, { name: `page-${p.pageNumber}.jpg` });
      });

      archive.finalize();
    });
  }

  /** Retrieve raw data from IPFS */
  async retrieveFromIPFS(hash) {
    const url = `${this.gatewayUrl}${hash}`;
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    } catch (err) {
      console.error(`❌ retrieveFromIPFS failed for ${hash}:`, err.message);
      throw err;
    }
  }

  /** Get file metadata */
  async getFileMetadata(hash) {
    try {
      const response = await axios.head(`${this.gatewayUrl}${hash}`);
      return {
        hash,
        contentType: response.headers['content-type'],
        size: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
        url: `${this.gatewayUrl}${hash}`,
      };
    } catch (error) {
      console.error('❌ getFileMetadata failed:', error.message);
      throw error;
    }
  }

  /** Pin an existing hash on Pinata */
  async pinHash(hash, name) {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinByHash',
        { hashToPin: hash, pinataMetadata: { name } },
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
          },
        }
      );
      return {
        hash,
        name,
        requestId: response.data.requestId,
        pinnedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('❌ pinHash failed:', err.message);
      throw err;
    }
  }

  /** Status report */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pinataConfigured: !!(this.pinataApiKey && this.pinataSecretKey),
      web3Configured: !!this.web3Token,
      gatewayUrl: this.gatewayUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new IPFSService();
