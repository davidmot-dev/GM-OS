import React from 'react';
import AtlasLibrary from './AtlasLibrary';
import AtlasMapDetail from './AtlasMapDetail';
import AtlasLinkedEntities from './AtlasLinkedEntities';

const WorldAtlas: React.FC = () => {
    return (
        <div className="flex-1 flex overflow-hidden h-full">
            <AtlasLibrary />
            <AtlasMapDetail />
            <AtlasLinkedEntities />
        </div>
    );
};

export default WorldAtlas;
