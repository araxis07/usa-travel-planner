
import React from 'react';
import { Region, Category } from '../types';

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  regionFilter: Region;
  setRegionFilter: (region: Region) => void;
  categoryFilter: Category;
  setCategoryFilter: (category: Category) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  setSearchQuery,
  regionFilter,
  setRegionFilter,
  categoryFilter,
  setCategoryFilter,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg -mt-16 relative z-10 container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Search Input */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Destination
          </label>
          <input
            id="search"
            type="text"
            placeholder="e.g., 'Grand Canyon' or 'New York'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>

        {/* Region Filter */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Region
          </label>
          <select
            id="region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as Region)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
          >
            {Object.values(Region).map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
          </label>
          <select
            id="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
          >
            {Object.values(Category).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
