
import React from 'react';
import { Destination } from '../types';
import { XIcon, CalendarIcon, StarIcon, CheckCircleIcon, MapPinIcon, PlusCircleIcon } from './IconComponents';

interface DestinationDetailModalProps {
  destination: Destination | null;
  onClose: () => void;
  onAddToItinerary: (destination: Destination) => void;
}

const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({ destination, onClose, onAddToItinerary }) => {
  if (!destination) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 bg-white/50 rounded-full p-1">
          <XIcon className="w-8 h-8" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 flex-shrink-0">
            <img src={destination.imageUrl} alt={destination.name} className="w-full h-64 md:h-full object-cover md:rounded-l-2xl rounded-t-2xl md:rounded-tr-none" />
        </div>

        {/* Content Section */}
        <div className="p-8 flex-grow overflow-y-auto">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">{destination.name}</h2>
          <div className="flex items-center space-x-4 text-gray-600 mb-4">
            <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-1.5 text-blue-600"/>
                <span>{destination.state}</span>
            </div>
            <div className="flex items-center">
                <StarIcon className="w-5 h-5 mr-1.5 text-yellow-500"/>
                <span className="font-bold">{destination.rating}</span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{destination.longDescription}</p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start">
                <CalendarIcon className="w-6 h-6 mr-3 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-gray-800">Best Time to Visit</h4>
                    <p className="text-gray-600">{destination.bestTimeToVisit}</p>
                </div>
            </div>
            <div className="flex items-start">
                <CheckCircleIcon className="w-6 h-6 mr-3 text-green-600 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-gray-800">What to Do</h4>
                    <ul className="list-disc list-inside text-gray-600">
                        {destination.activities.map((activity, index) => (
                            <li key={index}>{activity}</li>
                        ))}
                    </ul>
                </div>
            </div>
          </div>

          <button 
            onClick={() => onAddToItinerary(destination)} 
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <PlusCircleIcon className="w-6 h-6" />
            <span>Add to Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetailModal;
