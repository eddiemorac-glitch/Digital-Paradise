import React from 'react';

interface EventClusterGroupProps {
    children: React.ReactNode;
}

/**
 * EventClusterGroup is a transparent wrapper.
 * The actual clustering logic is handled in EventLayer via useMapClusters.
 */
export const EventClusterGroup: React.FC<EventClusterGroupProps> = ({ children }) => {
    return <>{children}</>;
};
