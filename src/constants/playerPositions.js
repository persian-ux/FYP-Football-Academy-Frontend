// ---------------------------------------------------------
// Team colors, formations, and scroll-driven positions.
// Field: 20 units wide (x: -10..10), 12 tall (z: -6..6), ground y=0.
// ---------------------------------------------------------

export const TEAM_A_COLOR = '#00d4ff'
export const TEAM_B_COLOR = '#ff6b35'
export const GOALKEEPER_COLOR = '#ffd700'

export const TEAM_A_POSITIONS = {
  goalkeeper: [-9, 0, 0],
  defender1: [-6, 0, -3],
  defender2: [-6, 0, -1],
  defender3: [-6, 0, 1],
  defender4: [-6, 0, 3],
  midfielder1: [-3, 0, -2],
  midfielder2: [-3, 0, 0],
  midfielder3: [-3, 0, 2],
  forward1: [0, 0, -3],
  forward2: [0, 0, 0],
  forward3: [0, 0, 3],
}

export const TEAM_B_POSITIONS = {
  goalkeeper: [9, 0, 0],
  defender1: [6, 0, -3],
  defender2: [6, 0, -1],
  defender3: [6, 0, 1],
  defender4: [6, 0, 3],
  midfielder1: [3, 0, -2],
  midfielder2: [3, 0, 0],
  midfielder3: [3, 0, 2],
  midfielder4: [3, 0, -3.5],
  forward1: [1, 0, -1.5],
  forward2: [1, 0, 1.5],
}

export const SCROLL_KEYFRAMES = {
  section0: {
    ball: { position: [0, 0.3, 0], rotation: 0 },
    cameraTarget: { position: [0, 18, 6], lookAt: [0, 0, 0] },
    teamA: 'walkIn',
    teamB: 'walkIn',
  },
  section1: {
    ball: { position: [0, 0.3, 0], rotation: 0 },
    cameraTarget: { position: [0, 10, 18], lookAt: [0, 0, 0] },
    teamA: 'warmup',
    teamB: 'warmup',
  },
  section2: {
    ball: { position: [3, 0.3, 0], rotation: 720 },
    cameraTarget: { position: [-2, 4, 16], lookAt: [0, 0, 0] },
    teamA: 'attack',
    teamB: 'defend',
  },
  section3: {
    ball: { position: [7, 1.5, 1], rotation: 1440 },
    cameraTarget: { position: [4, 3, 14], lookAt: [8, 0, 0] },
    teamA: 'shooting',
    teamB: 'blocking',
  },
  section4: {
    ball: { position: [9.5, 0.3, 0], rotation: 2000 },
    cameraTarget: { position: [7, 5, 12], lookAt: [9, 0, 0] },
    teamA: 'celebrate',
    teamB: 'dejected',
  },
  section5: {
    ball: { position: [0, 0.3, 0], rotation: 0 },
    cameraTarget: { position: [0, 26, 26], lookAt: [0, 0, 0] },
    teamA: 'walkOut',
    teamB: 'walkOut',
  },
}