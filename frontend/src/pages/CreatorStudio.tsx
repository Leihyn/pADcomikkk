/// <reference types="vite/client" />

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Collection {
  tokenId: string;
  name: string;
  symbol: string;
  coverUrl: string;
}

export default function CreatorStudio() {
  // State management
  const [step, setStep] = useState<'collection' | 'issue'>('collection');
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  // Collection form
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    symbol: '',
    description: '',
    genre: 'Superhero',
    creatorName: '',
    creatorWallet: '',
    maxSupply: 0,
    royaltyPercentage: 5,
    price: 10,
    tags: [] as string[]
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  // Issue form
  const [issueForm, setIssueForm] = useState({
    issueNumber: 1,
    issueTitle: '',
    issueDescription: '',
    writers: '',
    artists: '',
    mintQuantity: 1
  });
  const [issueCover, setIssueCover] = useState<File | null>(null);
  const [pages, setPages] = useState<File[]>([]);
  const [pagesPreviews, setPagesPreviews] = useState<string[]>([]);
  
  // Result state
  const [result, setResult] = useState<any>(null);

  // ============================================
  // COLLECTION FUNCTIONS
  // ============================================

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(collectionForm).forEach(([key, value]) => {
        if (key === 'tags') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      // Add cover image
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      // Submit to API
      const response = await axios.post(
        `${API_URL}/api/comics/collections`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      // ✅ FIXED: Handle response data safely
      setResult(response.data || {});
      
      // ✅ FIXED: Create collection object without nested .collection
      const newCollection: Collection = {
        tokenId: response.data.tokenId || "unknown",
        name: collectionForm.name,
        symbol: collectionForm.symbol,
        coverUrl: response.data.coverUrl || coverPreview
      };
      setCollections([...collections, newCollection]);

      alert(`✅ Collection created successfully!\nToken ID: ${newCollection.tokenId}`);

    } catch (error: any) {
      console.error('Collection creation failed:', error);
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ISSUE FUNCTIONS
  // ============================================

  const handleIssueCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIssueCover(file);
    }
  };

  const handlePagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPages(files);
    
    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setPagesPreviews(previews);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCollection) {
      alert('Please select a collection first');
      return;
    }

    if (!issueCover || pages.length === 0) {
      alert('Please upload issue cover and pages');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Collection info
      formData.append('collectionTokenId', selectedCollection.tokenId);
      formData.append('collectionName', selectedCollection.name);
      
      // Issue info
      Object.entries(issueForm).forEach(([key, value]) => {
        if (key === 'writers' || key === 'artists') {
          // Split comma-separated names into array
            const array = typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
          formData.append(key, JSON.stringify(array));
        } else {
          formData.append(key, value.toString());
        }
      });

      // Add release date
      formData.append('releaseDate', new Date().toISOString());
      
      // Add issue cover
      formData.append('issueCover', issueCover);
      
      // Add all pages
      pages.forEach(page => {
        formData.append('pages', page);
      });

      // Submit to API
      const response = await axios.post(
        `${API_URL}/api/comics/issues`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setResult(response.data || {});

      // ✅ FIXED: Safely access serial numbers
      const serialNumbers = response.data.issue?.serialNumbers || response.data.serialNumbers || [];
      alert(`✅ Issue created successfully!\nSerial Numbers: ${serialNumbers.join(', ')}`);

      // Reset form
      setIssueForm({
        issueNumber: issueForm.issueNumber + 1,
        issueTitle: '',
        issueDescription: '',
        writers: '',
        artists: '',
        mintQuantity: 1
      });
      setIssueCover(null);
      setPages([]);
      setPagesPreviews([]);

    } catch (error: any) {
      console.error('Issue creation failed:', error);
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Creator Studio
          </h1>
          <p className="text-lg text-gray-600">
            Create and publish your comic NFTs on Hedera
          </p>
        </div>

        {/* Step Selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setStep('collection')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              step === 'collection'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            📚 Create Collection
          </button>
          <button
            onClick={() => setStep('issue')}
            disabled={collections.length === 0}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              step === 'issue'
                ? 'bg-blue-600 text-white'
                : collections.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            📖 Create Issue
          </button>
        </div>

        {/* Collection Form */}
        {step === 'collection' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Create New Collection</h2>
            
            <form onSubmit={handleCollectionSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={collectionForm.name}
                    onChange={(e) => setCollectionForm({...collectionForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="My Amazing Comic"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    value={collectionForm.symbol}
                    onChange={(e) => setCollectionForm({...collectionForm, symbol: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="MYCOMIC"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your comic collection..."
                />
              </div>

              {/* Genre & Creator */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <select
                    value={collectionForm.genre}
                    onChange={(e) => setCollectionForm({...collectionForm, genre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Superhero</option>
                    <option>Sci-Fi</option>
                    <option>Fantasy</option>
                    <option>Horror</option>
                    <option>Action</option>
                    <option>Drama</option>
                    <option>Comedy</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Creator Name
                  </label>
                  <input
                    type="text"
                    value={collectionForm.creatorName}
                    onChange={(e) => setCollectionForm({...collectionForm, creatorName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
              </div>

              {/* Wallet & Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creator Wallet *
                </label>
                <input
                  type="text"
                  required
                  value={collectionForm.creatorWallet}
                  onChange={(e) => setCollectionForm({...collectionForm, creatorWallet: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0.123456"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Supply (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={collectionForm.maxSupply}
                    onChange={(e) => setCollectionForm({...collectionForm, maxSupply: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Royalty %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={collectionForm.royaltyPercentage}
                    onChange={(e) => setCollectionForm({...collectionForm, royaltyPercentage: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (HBAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={collectionForm.price}
                    onChange={(e) => setCollectionForm({...collectionForm, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleCoverChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {coverPreview && (
                  <img src={coverPreview} alt="Cover preview" className="mt-4 w-48 h-auto rounded-lg shadow" />
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Creating Collection...' : '🚀 Create Collection'}
              </button>
            </form>
          </div>
        )}

        {/* Issue Form */}
        {step === 'issue' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Create New Issue</h2>
            
            {/* Collection Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Collection *
              </label>
              <select
                value={selectedCollection?.tokenId || ''}
                onChange={(e) => {
                  const collection = collections.find(c => c.tokenId === e.target.value);
                  setSelectedCollection(collection || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a collection...</option>
                {collections.map(c => (
                  <option key={c.tokenId} value={c.tokenId}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {selectedCollection && (
              <form onSubmit={handleIssueSubmit} className="space-y-6">
                {/* Issue Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Number *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={issueForm.issueNumber}
                      onChange={(e) => setIssueForm({...issueForm, issueNumber: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mint Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={issueForm.mintQuantity}
                      onChange={(e) => setIssueForm({...issueForm, mintQuantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={issueForm.issueTitle}
                    onChange={(e) => setIssueForm({...issueForm, issueTitle: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="The Beginning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={issueForm.issueDescription}
                    onChange={(e) => setIssueForm({...issueForm, issueDescription: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe this issue..."
                  />
                </div>

                {/* Credits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Writers (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={issueForm.writers}
                      onChange={(e) => setIssueForm({...issueForm, writers: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe, Jane Smith"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Artists (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={issueForm.artists}
                      onChange={(e) => setIssueForm({...issueForm, artists: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="John Artist, Jane Illustrator"
                    />
                  </div>
                </div>

                {/* Issue Cover */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Cover *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleIssueCoverChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Pages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comic Pages * (Multiple files)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    required
                    onChange={handlePagesChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {pages.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {pages.length} page(s) selected
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Creating Issue...' : '🚀 Create & Mint Issue'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">
              ✅ Success!
            </h3>
            <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}