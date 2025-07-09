
import React from 'react';
import { Destination } from '../types';
import DestinationCard from './DestinationCard';

interface DestinationGridProps {
  destinations: Destination[];
  onSelectDestination: (destination: Destination) => void;
}

const DestinationGrid: React.FC<DestinationGridProps> = ({ destinations, onSelectDestination }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {destinations.length > 0 ? (
        destinations.map((dest) => (
          <DestinationCard key={dest.id} destination={dest} onSelect={onSelectDestination} />
        ))
      ) : (
        <div className="col-span-full text-center py-12">
            <h3 className="text-2xl font-semibold text-gray-700">No Destinations Found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DestinationGrid;
