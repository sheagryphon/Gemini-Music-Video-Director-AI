
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center border-b-2 border-cyan-500/30 pb-4">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
        MV Director AI
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Crafting Your Visual Symphony, Shot by Shot
      </p>
    </header>
  );
};

export default Header;
