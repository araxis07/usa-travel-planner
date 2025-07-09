
import React from 'react';
import { CompassIcon } from './IconComponents';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
                <CompassIcon className="w-8 h-8 text-blue-400" />
                <h3 className="text-xl font-bold">USA Travel Planner</h3>
            </div>
            <p className="text-gray-400 text-sm">Your ultimate guide to exploring the United States.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#destinations" className="text-gray-400 hover:text-white transition-colors">Destinations</a></li>
              <li><a href="#map" className="text-gray-400 hover:text-white transition-colors">Map</a></li>
              <li><a href="#planner" className="text-gray-400 hover:text-white transition-colors">Itinerary</a></li>
              <li><a href="#guides" className="text-gray-400 hover:text-white transition-colors">Guides</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 tracking-wider uppercase">Regions</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Northeast</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">West Coast</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Southwest</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Midwest</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 tracking-wider uppercase">Connect</h4>
            <p className="text-gray-400">Follow us on social media for travel inspiration.</p>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} USA Travel Planner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
