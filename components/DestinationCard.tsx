
import React from 'react';
import { Destination } from '../types';
import { MapPinIcon, StarIcon } from './IconComponents';

interface DestinationCardProps {
  destination: Destination;
  onSelect: (destination: Destination) => void;
}

const DestinationCard: React.FC<DestinationCardProps> = ({ destination, onSelect }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
      onClick={() => onSelect(destination)}
    >
      <div className="relative">
        <img src={destination.imageUrl} alt={destination.name} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {destination.category}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{destination.name}</h3>
        <div className="flex items-center text-gray-600 mb-2">
          <MapPinIcon className="w-4 h-4 mr-1 text-gray-500" />
          <span>{destination.state}</span>
        </div>
        <p className="text-gray-700 text-sm mb-4 h-10 overflow-hidden">{destination.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
             <StarIcon className="w-5 h-5 text-yellow-500" />
             <span className="text-gray-800 font-semibold ml-1">{destination.rating}</span>
          </div>
          <button className="text-blue-600 font-semibold text-sm hover:underline">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;
