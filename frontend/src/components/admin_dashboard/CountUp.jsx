import React, { useState, useEffect } from "react";

const CountUp = ({ end, duration = 1000, decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let requestId;
    let startValue = count;

    const easeOutQuad = (t) => t * (2 - t);

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const nextCount = Math.floor(
        startValue + (end - startValue) * easedProgress
      );

      setCount(nextCount);

      if (progress < 1) {
        requestId = requestAnimationFrame(animateCount);
      } else {
        setCount(end);
      }
    };

    requestId = requestAnimationFrame(animateCount);

    return () => cancelAnimationFrame(requestId);
  }, [end, duration]);

  return (
    <span>
      {decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}
    </span>
  );
};

export default CountUp;
