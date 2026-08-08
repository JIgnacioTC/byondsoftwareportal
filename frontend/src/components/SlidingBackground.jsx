import React from 'react';

export default function SlidingBackground() {
  return (
    <div className="bg-sliding-container" aria-hidden="true">
      <div className="bg" />
      <div className="bg bg2" />
      <div className="bg bg3" />
    </div>
  );
}
