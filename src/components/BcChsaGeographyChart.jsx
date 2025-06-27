import React from "react";

const BcChsaGeographyChart = ({ isDashboard = false }) => {
  return (
    <div style={{ 
      height: isDashboard ? "300px" : "500px", 
      width: "100%",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#f8f9fa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* BC Map Container */}
      <div style={{
        width: "80%",
        height: "80%",
        position: "relative",
        backgroundColor: "#e6f3ff",
        border: "2px solid #333",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {/* BC Outline */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 200 150"
          style={{ position: "absolute" }}
        >
          {/* BC Main Land */}
          <path
            d="M 20 120 L 180 120 L 180 30 L 160 20 L 140 25 L 120 20 L 100 25 L 80 20 L 60 25 L 40 20 L 20 30 Z"
            fill="#90EE90"
            stroke="#333"
            strokeWidth="2"
          />
          
          {/* Vancouver Island */}
          <path
            d="M 30 110 L 70 110 L 70 130 L 30 130 Z"
            fill="#98FB98"
            stroke="#333"
            strokeWidth="1"
          />
          
          {/* Major Cities */}
          <circle cx="50" cy="35" r="3" fill="#ff0000" />
          <text x="55" y="40" fontSize="8" fill="#333">Victoria</text>
          
          <circle cx="120" cy="40" r="3" fill="#ff0000" />
          <text x="125" y="45" fontSize="8" fill="#333">Vancouver</text>
          
          <circle cx="140" cy="50" r="3" fill="#ff0000" />
          <text x="145" y="55" fontSize="8" fill="#333">Kelowna</text>
          
          <circle cx="80" cy="80" r="3" fill="#ff0000" />
          <text x="85" y="85" fontSize="8" fill="#333">Prince George</text>
          
          {/* Water Bodies */}
          <path
            d="M 10 60 L 30 60 L 30 80 L 10 80 Z"
            fill="#87CEEB"
            stroke="#333"
            strokeWidth="1"
          />
          <text x="15" y="75" fontSize="6" fill="#333">Pacific</text>
          
          {/* Mountains */}
          <path
            d="M 60 40 L 70 30 L 80 40 L 90 35 L 100 40 L 110 35 L 120 40 L 130 35 L 140 40"
            fill="none"
            stroke="#8B4513"
            strokeWidth="3"
          />
        </svg>
        
        {/* Title */}
        <div style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "5px 10px",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "bold",
          color: "#333",
          border: "1px solid #ccc"
        }}>
          British Columbia
        </div>
        
        {/* Legend */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "10px",
          border: "1px solid #ccc"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Legend:</div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
            <div style={{ width: "12px", height: "8px", backgroundColor: "#90EE90", marginRight: "4px" }}></div>
            <span>Mainland</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
            <div style={{ width: "12px", height: "8px", backgroundColor: "#98FB98", marginRight: "4px" }}></div>
            <span>Vancouver Island</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
            <div style={{ width: "12px", height: "8px", backgroundColor: "#87CEEB", marginRight: "4px" }}></div>
            <span>Ocean</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "12px", height: "8px", backgroundColor: "#ff0000", marginRight: "4px" }}></div>
            <span>Cities</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BcChsaGeographyChart; 