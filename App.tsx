
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchAndFilter from './components/SearchAndFilter';
import DestinationGrid from './components/DestinationGrid';
import DestinationDetailModal from './components/DestinationDetailModal';
import InteractiveMap from './components/InteractiveMap';
import ItineraryPlanner from './components/ItineraryPlanner';
import BlogSection from './components/BlogSection';
import Footer from './components/Footer';
import { useDebounce } from './hooks/useDebounce';
import { DESTINATIONS } from './constants';
import { Destination, Region, Category, ItineraryItem } from './types';

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<Region>(Region.ALL);
  const [categoryFilter, setCategoryFilter] = useState<Category>(Category.ALL);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  
  const [showAddedAlert, setShowAddedAlert] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleStateClick = (stateCode: string) => {
    setSelectedState(prevState => prevState === stateCode ? null : stateCode);
  };

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter(dest => {
      const matchesSearch = dest.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || dest.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesRegion = regionFilter === Region.ALL || dest.region === regionFilter;
      const matchesCategory = categoryFilter === Category.ALL || dest.category === categoryFilter;
      const matchesState = selectedState === null || dest.stateCode === selectedState;
      return matchesSearch && matchesRegion && matchesCategory && matchesState;
    });
  }, [debouncedSearchQuery, regionFilter, categoryFilter, selectedState]);

  const handleAddToItinerary = (destination: Destination) => {
    if (!itinerary.find(item => item.id === destination.id)) {
      setItinerary(prev => [...prev, destination]);
      setSelectedDestination(null); // Close modal on add
      setShowAddedAlert(true);
      setTimeout(() => setShowAddedAlert(false), 3000);
    } else {
      alert(`${destination.name} is already in your itinerary.`);
    }
  };

  const handleRemoveFromItinerary = (id: number) => {
    setItinerary(prev => prev.filter(item => item.id !== id));
  };
  
  useEffect(() => {
    if (selectedDestination) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedDestination]);


  return (
    <>
      <Header />
      <main>
        <Hero />
        <div id="destinations" className="container mx-auto px-6 py-12 md:py-20">
            <SearchAndFilter
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                <div className="lg:col-span-2">
                    <DestinationGrid 
                        destinations={filteredDestinations} 
                        onSelectDestination={setSelectedDestination} 
                    />
                </div>
                <div className="lg:col-span-1 space-y-8">
                  <div id="map">
                    <InteractiveMap 
                        destinations={DESTINATIONS}
                        activeState={selectedState}
                        onStateClick={handleStateClick}
                    />
                  </div>
                  <div id="planner">
                     <ItineraryPlanner 
                        itinerary={itinerary} 
                        onRemoveFromItinerary={handleRemoveFromItinerary} 
                    />
                  </div>
                </div>
            </div>
        </div>
        <BlogSection />
      </main>
      <Footer />
      <DestinationDetailModal 
        destination={selectedDestination} 
        onClose={() => setSelectedDestination(null)}
        onAddToItinerary={handleAddToItinerary}
      />
      {showAddedAlert && (
         <div className="fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            Added to itinerary!
        </div>
      )}
    </>
  );
};

export default App;
