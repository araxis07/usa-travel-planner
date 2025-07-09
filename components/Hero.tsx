
import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/seed/mainhero/1920/1080')" }}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight drop-shadow-lg">Discover Your Next Adventure</h1>
        <p className="text-xl md:text-2xl text-white mt-4 max-w-3xl drop-shadow-md">Explore the beauty of the United States. Find destinations, plan your trip, and create unforgettable memories.</p>
        <a href="#destinations" className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg">
          Start Exploring
        </a>
      </div>
    </div>
  );
};

export default Hero;
