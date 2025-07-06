import React, { useState, useMemo } from "react";
import { tips } from "./tips";
import "./HelpModal.css";

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const randomizedTips = useMemo(() => {
    return [...tips].sort(() => Math.random() - 0.5);
  }, []);

  const [tipIndex, setTipIndex] = useState(0);

  const handlePrev = () => {
    setTipIndex(
      (prev) => (prev - 1 + randomizedTips.length) % randomizedTips.length
    );
  };

  const handleNext = () => {
    setTipIndex((prev) => (prev + 1) % randomizedTips.length);
  };

  return (
    <div className="help-modal-overlay">
      <div className="help-modal">
        <div className="help-modal-header">
          <h3>Tip of the Day</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="help-modal-content">
          <p>{randomizedTips[tipIndex]}</p>
        </div>
        <div className="help-modal-footer">
          <div className="palette-navigation">
            <div className="scroll-button left" onClick={handlePrev}>
              ❮
            </div>
            <span>
              {tipIndex + 1} of {randomizedTips.length}
            </span>
            <div className="scroll-button right" onClick={handleNext}>
              ❯
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
