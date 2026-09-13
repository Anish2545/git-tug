import React from 'react'
import { useBattleStore } from '../store/battleStore'

export default function TerminalTicker() {
  const text = useBattleStore((s) => s.commentaryText)

  return (
    <div className="arena-terminal-bar">
      <span className="terminal-prefix">
        <span style={{ color: '#39d353' }}>●</span> ANNOUNCER
      </span>
      <span key={text} className="terminal-ticker flash">
        {text}
      </span>
    </div>
  )
}
