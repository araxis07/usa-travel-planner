
import React from 'react';
import { ItineraryItem } from '../types';
import { MapPinIcon, XIcon } from './IconComponents';

interface ItineraryPlannerProps {
  itinerary: ItineraryItem[];
  onRemoveFromItinerary: (id: number) => void;
}

const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({ itinerary, onRemoveFromItinerary }) => {
  const totalDestinations = itinerary.length;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg sticky top-24">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">My Itinerary ({totalDestinations})</h3>
      
      {totalDestinations === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Your itinerary is empty.</p>
          <p className="text-sm text-gray-400 mt-1">Add destinations to start planning your trip!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {itinerary.map((item) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-lg flex items-start space-x-4 relative group">
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
              <div className="flex-grow">
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="w-3 h-3 mr-1" />
                  <span>{item.state}</span>
                </div>
              </div>
              <button 
                onClick={() => onRemoveFromItinerary(item.id)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${item.name}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalDestinations > 0 && (
        <div className="mt-6">
          <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all">
            Save & Export Itinerary
          </button>
        </div>
      )}
    </div>
  );
};

export default ItineraryPlanner;
