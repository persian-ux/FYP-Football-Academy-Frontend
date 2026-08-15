// Animation state names + playback speeds + limb behavior flags.

export const ANIMATION_STATES = [
  'idle',
  'warmup',
  'attack',
  'defend',
  'shooting',
  'blocking',
  'celebrate',
  'dejected',
  'walkIn',
  'walkOut',
]

export const ANIMATION_SPEEDS = {
  idle: 0.5,
  warmup: 1.5,
  attack: 3.0,
  defend: 2.5,
  shooting: 4.0,
  blocking: 3.5,
  celebrate: 5.0,
  dejected: 0.3,
  walkIn: 1.0,
  walkOut: 0.8,
}

export const MOVING_STATES = ['warmup', 'attack', 'defend', 'shooting', 'walkIn', 'walkOut']

export const SPRINTING_STATES = ['attack', 'shooting']

export const RUNNING_STATES = ['attack', 'warmup', 'shooting', 'defend', 'walkIn', 'walkOut']