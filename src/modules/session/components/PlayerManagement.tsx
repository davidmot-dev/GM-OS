import React from 'react';
import PlayerRoster from './PlayerRoster';
import CharacterGrid from './CharacterGrid';
import PlayerCharacterDetail from './PlayerCharacterDetail';
import { useSessionOSStore } from '../useSessionOSStore';

const PlayerManagement: React.FC = () => {
    const { selectedCharacterId } = useSessionOSStore();

    return (
        <div className="col-span-9 flex overflow-hidden h-full">
            {selectedCharacterId ? (
                <PlayerCharacterDetail />
            ) : (
                <>
                    <PlayerRoster />
                    <CharacterGrid />
                </>
            )}
        </div>
    );
};

export default PlayerManagement;
