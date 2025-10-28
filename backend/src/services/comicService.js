const hederaService = require('./hederaService');
const ipfsService = require('./ipfsService');

class ComicService {
  constructor() {
    this.isInitialized = false;
    this.comics = new Map(); // In-memory storage (replace with database in production)
    this.collections = new Map();
  }

  async initialize() {
    try {
      console.log('Initializing Comic service...');
      this.isInitialized = true;
      console.log('✅ Comic service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Comic service:', error);
      throw error;
    }
  }

  /**
   * Create a new comic collection
   * @param {Object} collectionData - Collection information
   * @returns {Object} Created collection
   */
  async createCollection(collectionData) {
    try {
      const {
        name,
        symbol,
        description,
        creator,
        genres = [],
        royaltyPercentage = 10,
        maxSupply = 0
      } = collectionData;

      // Create collection metadata
      const metadata = {
        name,
        symbol,
        description,
        creator,
        genres,
        image: '', // Will be set when first comic is added
        external_url: '',
        attributes: [
          {
            trait_type: 'Collection',
            value: name
          },
          {
            trait_type: 'Creator',
            value: creator
          },
          {
            trait_type: 'Genres',
            value: genres.join(', ')
          }
        ]
      };

      // Upload metadata to IPFS
      const metadataResult = await ipfsService.uploadMetadata(metadata, `${symbol}-collection-metadata.json`);

      // Create NFT collection on Hedera
      const hederaCollection = await hederaService.createNFTCollection({
        name,
        symbol,
        metadata: metadataResult.url,
        royaltyPercentage,
        maxSupply
      });

      // Store collection locally
      const collection = {
        id: hederaCollection.tokenId,
        ...collectionData,
        metadataUri: metadataResult.url,
        metadataHash: metadataResult.hash,
        createdAt: new Date().toISOString(),
        totalComics: 0,
        totalMinted: 0
      };

      this.collections.set(collection.id, collection);

      return collection;
    } catch (error) {
      console.error('❌ Failed to create collection:', error);
      throw error;
    }
  }

  /**
   * Create a new comic issue
   * @param {Object} comicData - Comic information
   * @returns {Object} Created comic
   */
  async createComic(comicData) {
    try {
      const {
        collectionId,
        title,
        description,
        creator,
        pages = [],
        issueNumber,
        series,
        genres = [],
        rarity = 'Standard',
        edition = 'First Print',
        artists = [],
        publicationDate,
        mintPrice,
        maxSupply,
        royaltyPercentage = 10
      } = comicData;

      // Validate collection exists
      const collection = this.collections.get(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Process and upload comic pages
      const pagesResult = await ipfsService.uploadComicPages(pages, {
        name: title,
        series,
        issueNumber,
        creator
      });

      // Create comic metadata
      const comicMetadata = {
        name: `${title} #${issueNumber}`,
        description,
        image: pagesResult.pages[0]?.web?.url || '', // First page as cover
        external_url: '',
        attributes: [
          {
            trait_type: 'Series',
            value: series
          },
          {
            trait_type: 'Issue Number',
            value: issueNumber
          },
          {
            trait_type: 'Creator',
            value: creator
          },
          {
            trait_type: 'Rarity',
            value: rarity
          },
          {
            trait_type: 'Edition',
            value: edition
          },
          {
            trait_type: 'Publication Date',
            value: publicationDate
          },
          {
            trait_type: 'Pages',
            value: pages.length
          },
          {
            trait_type: 'Artists',
            value: artists.join(', ')
          }
        ],
        properties: {
          series,
          issue_number: issueNumber,
          publication_date: publicationDate,
          edition,
          rarity,
          pages: pages.length,
          genre: genres,
          artists,
          variant: 'Standard Cover'
        },
        content: {
          pages: pagesResult.pages.map(p => p.web.url),
          thumbnails: pagesResult.pages.map(p => p.thumbnail.url),
          print: pagesResult.pages.map(p => p.print.url),
          format: 'CBZ',
          resolution: '2048x3072',
          download: pagesResult.cbz.url
        },
        royalty: {
          percentage: royaltyPercentage,
          recipient: creator
        }
      };

      // Upload comic metadata to IPFS
      const metadataResult = await ipfsService.uploadMetadata(
        comicMetadata, 
        `${series}-${issueNumber}-metadata.json`
      );

      // Mint NFT
      const mintResult = await hederaService.mintNFT(collectionId, metadataResult.url);

      // Store comic locally
      const comic = {
        id: `${collectionId}-${mintResult.serialNumber}`,
        collectionId,
        tokenId: collectionId,
        serialNumber: mintResult.serialNumber,
        ...comicData,
        metadataUri: metadataResult.url,
        metadataHash: metadataResult.hash,
        pagesResult,
        mintedAt: new Date().toISOString(),
        currentSupply: 1,
        maxSupply,
        mintPrice,
        isLive: false
      };

      this.comics.set(comic.id, comic);

      // Update collection stats
      collection.totalComics++;
      collection.totalMinted++;

      return comic;
    } catch (error) {
      console.error('❌ Failed to create comic:', error);
      throw error;
    }
  }

  /**
   * Batch mint multiple copies of a comic
   * @param {string} comicId - Comic ID
   * @param {number} quantity - Number of copies to mint
   * @returns {Object} Batch mint result
   */
  async batchMintComic(comicId, quantity) {
    try {
      const comic = this.comics.get(comicId);
      if (!comic) {
        throw new Error('Comic not found');
      }

      if (comic.currentSupply + quantity > comic.maxSupply) {
        throw new Error('Exceeds maximum supply');
      }

      // Create metadata URIs for each copy
      const metadataUris = Array(quantity).fill(comic.metadataUri);

      // Batch mint NFTs
      const mintResult = await hederaService.batchMintNFTs(comic.tokenId, metadataUris);

      // Update comic supply
      comic.currentSupply += quantity;

      return {
        comicId,
        quantity,
        serialNumbers: mintResult.serialNumbers,
        mintedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to batch mint comic:', error);
      throw error;
    }
  }

  /**
   * Get comic information
   * @param {string} comicId - Comic ID
   * @returns {Object} Comic information
   */
  async getComic(comicId) {
    try {
      const comic = this.comics.get(comicId);
      if (!comic) {
        throw new Error('Comic not found');
      }

      // Get NFT info from Hedera
      const nftInfo = await hederaService.getNFTInfo(comic.tokenId, comic.serialNumber);

      return {
        ...comic,
        nftInfo,
        isOwned: true // This would be determined by checking ownership
      };
    } catch (error) {
      console.error('❌ Failed to get comic:', error);
      throw error;
    }
  }

  /**
   * Get collection information
   * @param {string} collectionId - Collection ID
   * @returns {Object} Collection information
   */
  async getCollection(collectionId) {
    try {
      const collection = this.collections.get(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      return collection;
    } catch (error) {
      console.error('❌ Failed to get collection:', error);
      throw error;
    }
  }

  /**
   * Get all comics in a collection
   * @param {string} collectionId - Collection ID
   * @returns {Array} Array of comics
   */
  async getComicsByCollection(collectionId) {
    try {
      const comics = Array.from(this.comics.values())
        .filter(comic => comic.collectionId === collectionId)
        .sort((a, b) => a.issueNumber - b.issueNumber);

      return comics;
    } catch (error) {
      console.error('❌ Failed to get comics by collection:', error);
      throw error;
    }
  }

  /**
   * Get comics by creator
   * @param {string} creator - Creator address
   * @returns {Array} Array of comics
   */
  async getComicsByCreator(creator) {
    try {
      const comics = Array.from(this.comics.values())
        .filter(comic => comic.creator === creator)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return comics;
    } catch (error) {
      console.error('❌ Failed to get comics by creator:', error);
      throw error;
    }
  }

  /**
   * Search comics
   * @param {Object} searchParams - Search parameters
   * @returns {Array} Array of matching comics
   */
  async searchComics(searchParams) {
    try {
      const {
        query,
        genre,
        series,
        creator,
        rarity,
        minPrice,
        maxPrice,
        limit = 20,
        offset = 0
      } = searchParams;

      let comics = Array.from(this.comics.values());

      // Apply filters
      if (query) {
        comics = comics.filter(comic => 
          comic.title.toLowerCase().includes(query.toLowerCase()) ||
          comic.description.toLowerCase().includes(query.toLowerCase()) ||
          comic.series.toLowerCase().includes(query.toLowerCase())
        );
      }

      if (genre) {
        comics = comics.filter(comic => 
          comic.genres.some(g => g.toLowerCase() === genre.toLowerCase())
        );
      }

      if (series) {
        comics = comics.filter(comic => 
          comic.series.toLowerCase().includes(series.toLowerCase())
        );
      }

      if (creator) {
        comics = comics.filter(comic => 
          comic.creator.toLowerCase() === creator.toLowerCase()
        );
      }

      if (rarity) {
        comics = comics.filter(comic => 
          comic.rarity.toLowerCase() === rarity.toLowerCase()
        );
      }

      if (minPrice !== undefined) {
        comics = comics.filter(comic => comic.mintPrice >= minPrice);
      }

      if (maxPrice !== undefined) {
        comics = comics.filter(comic => comic.mintPrice <= maxPrice);
      }

      // Sort by creation date (newest first)
      comics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const paginatedComics = comics.slice(offset, offset + limit);

      return {
        comics: paginatedComics,
        total: comics.length,
        limit,
        offset,
        hasMore: offset + limit < comics.length
      };
    } catch (error) {
      console.error('❌ Failed to search comics:', error);
      throw error;
    }
  }

  /**
   * Update comic status (go live, pause, etc.)
   * @param {string} comicId - Comic ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated comic
   */
  async updateComic(comicId, updates) {
    try {
      const comic = this.comics.get(comicId);
      if (!comic) {
        throw new Error('Comic not found');
      }

      // Apply updates
      Object.assign(comic, updates, {
        updatedAt: new Date().toISOString()
      });

      this.comics.set(comicId, comic);

      return comic;
    } catch (error) {
      console.error('❌ Failed to update comic:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    const comics = Array.from(this.comics.values());
    const collections = Array.from(this.collections.values());

    return {
      totalComics: comics.length,
      totalCollections: collections.length,
      totalMinted: comics.reduce((sum, comic) => sum + comic.currentSupply, 0),
      totalSupply: comics.reduce((sum, comic) => sum + comic.maxSupply, 0),
      genres: [...new Set(comics.flatMap(comic => comic.genres))],
      creators: [...new Set(comics.map(comic => comic.creator))],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalComics: this.comics.size,
      totalCollections: this.collections.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ComicService();
