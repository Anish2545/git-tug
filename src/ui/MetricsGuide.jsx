import React from 'react'

const CARDS = [
  {
    title: 'Commit Volume',
    body: 'Lifetime commit graph drives 35% of cable force. Round 1 sets the baseline pull vector.',
  },
  {
    title: 'Repo Anchor',
    body: 'Public repository count adds structural weight. Deep portfolios resist sudden displacement.',
  },
  {
    title: 'Star Gravity',
    body: 'Stargazer totals create crowd gravity. Viral projects surge mid-match in Round 3.',
  },
  {
    title: 'Tug Power Index',
    body: 'Composite TPI blends commits, stars, velocity and followers into the overdrive finale.',
  },
]

export default function MetricsGuide() {
  return (
    <div className="metrics-architecture-grid">
      {CARDS.map((c) => (
        <div key={c.title} className="metric-arch-card">
          <div className="arch-header">
            <h4>{c.title}</h4>
          </div>
          <p>{c.body}</p>
        </div>
      ))}
    </div>
  )
}
