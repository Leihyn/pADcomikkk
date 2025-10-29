import fs from "fs";
import path from "path";
import hederaService from "./hederaService.js";
import ipfsService from "./ipfsService.js";

/* -----------------------------------------------------------
   🧠 Local Data Storage Helpers
----------------------------------------------------------- */
const dataFile = path.join(process.cwd(), "src/data/comicsData.json");

function ensureDataFile() {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify({ collections: [], comics: [] }, null, 2)
    );
  }
}

function loadData() {
  ensureDataFile();
  const data = fs.readFileSync(dataFile, "utf8");
  try {
    return JSON.parse(data || "{}");
  } catch {
    return { collections: [], comics: [] };
  }
}

function saveData(collections, comics) {
  ensureDataFile();
  const data = {
    collections: Array.from(collections.values()),
    comics: Array.from(comics.values())
  };
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

/* -----------------------------------------------------------
   🚀 Comic Service
----------------------------------------------------------- */
class ComicService {
  constructor() {
    this.isInitialized = false;
    this.comics = new Map();
    this.collections = new Map();

    // Load persisted data
    const { collections, comics } = loadData();
    collections.forEach(c => this.collections.set(c.id, c));
    comics.forEach(c => this.comics.set(c.id, c));
  }

  async initialize() {
    try {
      console.log("Initializing Comic service...");
      this.isInitialized = true;
      console.log("✅ Comic service initialized");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Comic service:", error);
      throw error;
    }
  }

  /* -----------------------------------------------------------
     🧱 Create Collection
  ----------------------------------------------------------- */
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

      // Metadata for IPFS
      const metadata = {
        name,
        symbol,
        description,
        creator,
        genres,
        image: "",
        external_url: "",
        attributes: [
          { trait_type: "Collection", value: name },
          { trait_type: "Creator", value: creator },
          { trait_type: "Genres", value: genres.join(", ") }
        ]
      };

      const metadataResult = await ipfsService.uploadMetadata(
        metadata,
        `${symbol}-collection-metadata.json`
      );

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
      saveData(this.collections, this.comics);

      return collection;
    } catch (error) {
      console.error("❌ Failed to create collection:", error);
      throw error;
    }
  }

  /* -----------------------------------------------------------
     📘 Create Comic
  ----------------------------------------------------------- */
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
        rarity = "Standard",
        edition = "First Print",
        artists = [],
        publicationDate,
        mintPrice,
        maxSupply,
        royaltyPercentage = 10
      } = comicData;

      // Validate collection
      const collection = this.collections.get(collectionId);
      if (!collection) throw new Error("Collection not found");

      // Upload comic pages to IPFS
      const pagesResult = await ipfsService.uploadComicPages(pages, {
        name: title,
        series,
        issueNumber,
        creator
      });

      // Create metadata
      const comicMetadata = {
        name: `${title} #${issueNumber}`,
        description,
        image: pagesResult.pages[0]?.web?.url || "",
        external_url: "",
        attributes: [
          { trait_type: "Series", value: series },
          { trait_type: "Issue Number", value: issueNumber },
          { trait_type: "Creator", value: creator },
          { trait_type: "Rarity", value: rarity },
          { trait_type: "Edition", value: edition },
          { trait_type: "Publication Date", value: publicationDate },
          { trait_type: "Pages", value: pages.length },
          { trait_type: "Artists", value: artists.join(", ") }
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
          variant: "Standard Cover"
        },
        content: {
          pages: pagesResult.pages.map(p => p.web.url),
          thumbnails: pagesResult.pages.map(p => p.thumbnail.url),
          print: pagesResult.pages.map(p => p.print.url),
          format: "CBZ",
          resolution: "2048x3072",
          download: pagesResult.cbz.url
        },
        royalty: {
          percentage: royaltyPercentage,
          recipient: creator
        }
      };

      const metadataResult = await ipfsService.uploadMetadata(
        comicMetadata,
        `${series}-${issueNumber}-metadata.json`
      );

      // Mint on Hedera
      const mintResult = await hederaService.mintNFT(
        collectionId,
        metadataResult.url
      );

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
        isLive: false,
        createdAt: new Date().toISOString()
      };

      this.comics.set(comic.id, comic);
      collection.totalComics++;
      collection.totalMinted++;

      saveData(this.collections, this.comics);
      return comic;
    } catch (error) {
      console.error("❌ Failed to create comic:", error);
      throw error;
    }
  }

  /* -----------------------------------------------------------
     🔁 Batch Mint
  ----------------------------------------------------------- */
  async batchMintComic(comicId, quantity) {
    try {
      const comic = this.comics.get(comicId);
      if (!comic) throw new Error("Comic not found");
      if (comic.currentSupply + quantity > comic.maxSupply)
        throw new Error("Exceeds maximum supply");

      const metadataUris = Array(quantity).fill(comic.metadataUri);
      const mintResult = await hederaService.batchMintNFTs(
        comic.tokenId,
        metadataUris
      );

      comic.currentSupply += quantity;
      saveData(this.collections, this.comics);

      return {
        comicId,
        quantity,
        serialNumbers: mintResult.serialNumbers,
        mintedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to batch mint comic:", error);
      throw error;
    }
  }

  /* -----------------------------------------------------------
     🔍 Getters
  ----------------------------------------------------------- */
  async getComic(comicId) {
    const comic = this.comics.get(comicId);
    if (!comic) throw new Error("Comic not found");

    const nftInfo = await hederaService.getNFTInfo(
      comic.tokenId,
      comic.serialNumber
    );

    return { ...comic, nftInfo, isOwned: true };
  }

  async getCollection(collectionId) {
    const collection = this.collections.get(collectionId);
    if (!collection) throw new Error("Collection not found");
    return collection;
  }

  async getComicsByCollection(collectionId) {
    return Array.from(this.comics.values())
      .filter(c => c.collectionId === collectionId)
      .sort((a, b) => a.issueNumber - b.issueNumber);
  }

  async getComicsByCreator(creator) {
    return Array.from(this.comics.values())
      .filter(c => c.creator === creator)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /* -----------------------------------------------------------
     🔎 Search
  ----------------------------------------------------------- */
  async searchComics(searchParams) {
    let comics = Array.from(this.comics.values());
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

    if (query)
      comics = comics.filter(
        c =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()) ||
          c.series?.toLowerCase().includes(query.toLowerCase())
      );

    if (genre)
      comics = comics.filter(c =>
        c.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
      );

    if (series)
      comics = comics.filter(c =>
        c.series?.toLowerCase().includes(series.toLowerCase())
      );

    if (creator)
      comics = comics.filter(
        c => c.creator.toLowerCase() === creator.toLowerCase()
      );

    if (rarity)
      comics = comics.filter(
        c => c.rarity.toLowerCase() === rarity.toLowerCase()
      );

    if (minPrice !== undefined)
      comics = comics.filter(c => c.mintPrice >= minPrice);

    if (maxPrice !== undefined)
      comics = comics.filter(c => c.mintPrice <= maxPrice);

    comics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginated = comics.slice(offset, offset + limit);

    return {
      comics: paginated,
      total: comics.length,
      limit,
      offset,
      hasMore: offset + limit < comics.length
    };
  }

  /* -----------------------------------------------------------
     ⚙️ Update Comic
  ----------------------------------------------------------- */
  async updateComic(comicId, updates) {
    const comic = this.comics.get(comicId);
    if (!comic) throw new Error("Comic not found");

    Object.assign(comic, updates, {
      updatedAt: new Date().toISOString()
    });

    this.comics.set(comicId, comic);
    saveData(this.collections, this.comics);
    return comic;
  }

  /* -----------------------------------------------------------
     📊 Stats
  ----------------------------------------------------------- */
  getStats() {
    const comics = Array.from(this.comics.values());
    const collections = Array.from(this.collections.values());
    return {
      totalComics: comics.length,
      totalCollections: collections.length,
      totalMinted: comics.reduce((s, c) => s + c.currentSupply, 0),
      totalSupply: comics.reduce((s, c) => s + (c.maxSupply || 0), 0),
      genres: [...new Set(comics.flatMap(c => c.genres || []))],
      creators: [...new Set(comics.map(c => c.creator))],
      timestamp: new Date().toISOString()
    };
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalComics: this.comics.size,
      totalCollections: this.collections.size,
      timestamp: new Date().toISOString()
    };
  }
}

/* -----------------------------------------------------------
   🧩 Export
----------------------------------------------------------- */
ComicService.prototype.createComicCollection = ComicService.prototype.createCollection;
ComicService.prototype.createComicIssue = ComicService.prototype.createComic;

export default new ComicService();
