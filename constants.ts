import { CallScenario, EmergencyType } from './types';

export const SIMULATION_SCENARIOS: CallScenario[] = [
  {
    id: 'med-1',
    name: 'Cardiac Arrest (Medical)',
    expectedType: EmergencyType.Medical,
    audioScript: [
      "Hello? Can you hear me?",
      "Please help! My father... he just collapsed in the kitchen.",
      "He is not breathing! I checked and I can't feel a pulse.",
      "Please hurry, he's turning blue. I don't know CPR!",
      "We are at 42 Green Oak Drive, near the park.",
      "Please come fast!"
    ]
  },
  {
    id: 'fire-1',
    name: 'Structure Fire (High Noise)',
    expectedType: EmergencyType.Fire,
    audioScript: [
      "Fire! There's a fire in the building!",
      "It's the complex on 5th Avenue, number 302.",
      "Smoke is everywhere, I can't see the exit!",
      "There are people trapped on the third floor!",
      "The alarms are going off, please send the fire brigade.",
      "The fire is spreading to the roof now!"
    ]
  },
  {
    id: 'crime-1',
    name: 'Active Intruder (Crime)',
    expectedType: EmergencyType.Crime,
    audioScript: [
      "Shh, please be quiet.",
      "Someone is trying to break into my house.",
      "I saw a man with a knife in the backyard.",
      "I'm hiding in the closet with my daughter.",
      "I think he broke the glass... yes, he's inside.",
      "Please send police, I'm scared.",
      "Address is 15 Willow Lane."
    ]
  }
];

export const DANGER_KEYWORDS = [
  "not breathing",
  "unconscious",
  "collapsed",
  "bleeding",
  "gun",
  "knife",
  "fire",
  "trapped",
  "heart attack",
  "stroke"
];