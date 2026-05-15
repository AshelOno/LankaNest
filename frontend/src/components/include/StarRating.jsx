import { Tooltip } from "antd";
import React from "react";
import { FaStar } from "react-icons/fa";

const StarRating = ({ rating }) => {
    return (
        <div className="flex gap-1">
            <Tooltip title='Average Rating'>
                {Array.from({ length: 5 }, (_, i) => {
                    const fillPercentage = Math.min(Math.max(rating - i, 0), 1) * 100;

                    return (
                        <div key={i} className="relative w-6 h-6 inline-block">

                            <FaStar className="absolute text-gray-400 w-full h-full" />

                            <FaStar
                                className="absolute text-yellow-400 w-full h-full"
                                style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                            />
                        </div>
                    );
                })}
            </Tooltip>
        </div>
    );
};

export default StarRating;
