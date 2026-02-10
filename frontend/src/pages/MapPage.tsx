import { LiveMap } from '../components/LiveMap';

export const MapPage = () => {
    return (
        <div className="h-[calc(100vh-100px)] w-full rounded-[2rem] overflow-hidden border border-white/10">
            <LiveMap events={[]} />
        </div>
    );
};
