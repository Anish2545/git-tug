import React from 'react'
import Backdrop, { FilmOverlay } from './Backdrop'

export default function Layout({ children }) {
  return (
    <>
      <Backdrop />
      <div className="app-container">
        {children}
        <footer className="arena-footer">
          <div className="footer-meta">
            <span>GITTUG 2.0 — REACT THREE FIBER ARENA</span>
            <span>COMMITS · STARS · VELOCITY → CABLE PHYSICS</span>
          </div>
        </footer>
      </div>
      <FilmOverlay />
    </>
  )
}
