import React, {useEffect, useState} from 'react'
import { getLatestAlert } from "../services/api"
import '../styles/Statscards.css'
import { Warning } from '@mui/icons-material'
import { Devices } from '@mui/icons-material'
import { AddAlert } from '@mui/icons-material'
import { GraphicEq } from '@mui/icons-material'

function Statcards() {

    const stats = [
        {
            title: "Total Alerts",
            value: "8",
            desc: "All time detections",
            icon: <Warning />
        },
        {
          title: "Active Devices",
          value: "1",
          desc: "Sensor nodes online",
          icon: <Devices />,
        },
        {
          title: "Alerts Today",
          value: "1",
          desc: "Last 24 hours",
          icon: <AddAlert />,
        },
        {
          title: "Avg Confidence",
          value: "82.6%",
          desc: "Detection accuracy",
          icon: <GraphicEq />,
        },
    ]

  return (
    <div className='stats-grid'>
        {stats.map((item, index) => (
        <div className="stat-card" key={index}>
          <div className="stat-header">
            <span className="stat-icon">{item.icon}</span>
            <span className="stat-title">{item.title}</span>
          </div>

          <div className="stat-value">{item.value}</div>
          <div className="stat-desc">{item.desc}</div>
        </div>
      ))}
    </div>
  )
}

export default Statcards
