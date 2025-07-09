
import React from 'react';
import { CompassIcon } from './IconComponents';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <CompassIcon className="w-8 h-8 text-blue-600" />
            <a href="#" className="text-2xl font-bold text-gray-800">USA Travel Planner</a>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#destinations" className="text-gray-600 hover:text-blue-600 transition-colors">Destinations</a>
          <a href="#map" className="text-gray-600 hover:text-blue-600 transition-colors">Map</a>
          <a href="#planner" className="text-gray-600 hover:text-blue-600 transition-colors">Itinerary</a>
          <a href="#guides" className="text-gray-600 hover:text-blue-600 transition-colors">Guides</a>
        </div>
        <div className="flex items-center">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-transform transform hover:scale-105">
                Sign In
            </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
