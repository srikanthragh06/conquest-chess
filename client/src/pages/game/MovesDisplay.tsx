import { movesType, moveType } from "../../types/game";

const MovesDisplay = ({ moves }: { moves: movesType }) => {
    const isPawnPromotion = (move: moveType) => {
        return (
            move.promotion &&
            ((move.to[1] === "8" && move.from[1] === "7") ||
                (move.to[1] === "1" && move.from[1] === "2"))
        );
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-white mb-2">
                Move History
            </h2>
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <table className="w-full text-sm text-white">
                    <thead>
                        <tr className="border-b border-gray-600">
                            <th className="py-1 px-2 text-left">#</th>
                            <th className="py-1 px-2 text-left">Move</th>
                            <th className="py-1 px-2 text-left">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {moves.map((move, index) => (
                            <tr
                                key={index}
                                className="border-b border-gray-700"
                            >
                                <td className="py-1 px-2">{index + 1}</td>
                                <td className="py-1 px-2">
                                    {move.from} → {move.to}{" "}
                                    {isPawnPromotion(move) && (
                                        <span className="text-yellow-400">
                                            ↑{move.promotion}
                                        </span>
                                    )}
                                </td>
                                <td className="py-1 px-2 text-gray-300">
                                    {new Date(move.time).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MovesDisplay;
