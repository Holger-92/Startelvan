export const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    description: 'Balans mellan offensiv press och bred mittfältstriangel.',
    positions: [
      { role: 'Målvakt', x: 0, y: 410 },
      { role: 'Back', x: -220, y: 190 },
      { role: 'Back', x: -70, y: 280 },
      { role: 'Back', x: 70, y: 280 },
      { role: 'Back', x: 220, y: 190 },
      { role: 'Mittfält', x: -160, y: 70 },
      { role: 'Mittfält', x: 0, y: 120 },
      { role: 'Mittfält', x: 160, y: 70 },
      { role: 'Anfall', x: -150, y: -120 },
      { role: 'Anfall', x: 0, y: -180 },
      { role: 'Anfall', x: 150, y: -120 }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    description: 'Stabil defensiv bas och kreativ offensiv spets.',
    positions: [
      { role: 'Målvakt', x: 0, y: 410 },
      { role: 'Back', x: -220, y: 210 },
      { role: 'Back', x: -90, y: 290 },
      { role: 'Back', x: 90, y: 290 },
      { role: 'Back', x: 220, y: 210 },
      { role: 'Defensivt mittfält', x: -120, y: 150 },
      { role: 'Defensivt mittfält', x: 120, y: 150 },
      { role: 'Offensivt mittfält', x: -150, y: 20 },
      { role: 'Offensivt mittfält', x: 0, y: -40 },
      { role: 'Offensivt mittfält', x: 150, y: 20 },
      { role: 'Anfall', x: 0, y: -200 }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    description: 'Klassisk formation med tydliga linjer i varje lagdel.',
    positions: [
      { role: 'Målvakt', x: 0, y: 410 },
      { role: 'Back', x: -210, y: 200 },
      { role: 'Back', x: -100, y: 300 },
      { role: 'Back', x: 100, y: 300 },
      { role: 'Back', x: 210, y: 200 },
      { role: 'Mittfält', x: -210, y: 60 },
      { role: 'Mittfält', x: -70, y: 120 },
      { role: 'Mittfält', x: 70, y: 120 },
      { role: 'Mittfält', x: 210, y: 60 },
      { role: 'Anfall', x: -90, y: -160 },
      { role: 'Anfall', x: 90, y: -160 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    description: 'Wingbacks med möjlighet att överbelasta mittfältet.',
    positions: [
      { role: 'Målvakt', x: 0, y: 410 },
      { role: 'Back', x: -140, y: 260 },
      { role: 'Back', x: 0, y: 320 },
      { role: 'Back', x: 140, y: 260 },
      { role: 'Wingback', x: -240, y: 80 },
      { role: 'Mittfält', x: -120, y: 90 },
      { role: 'Mittfält', x: 0, y: 40 },
      { role: 'Mittfält', x: 120, y: 90 },
      { role: 'Wingback', x: 240, y: 80 },
      { role: 'Anfall', x: -70, y: -150 },
      { role: 'Anfall', x: 70, y: -150 }
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    description: 'Defensivt tryggt med snabba omställningar genom mitten.',
    positions: [
      { role: 'Målvakt', x: 0, y: 410 },
      { role: 'Back', x: -250, y: 220 },
      { role: 'Back', x: -140, y: 300 },
      { role: 'Back', x: 0, y: 340 },
      { role: 'Back', x: 140, y: 300 },
      { role: 'Back', x: 250, y: 220 },
      { role: 'Mittfält', x: -160, y: 100 },
      { role: 'Mittfält', x: 0, y: 150 },
      { role: 'Mittfält', x: 160, y: 100 },
      { role: 'Anfall', x: -80, y: -140 },
      { role: 'Anfall', x: 80, y: -140 }
    ]
  }
};

export function getFormation(key) {
  return FORMATIONS[key] || FORMATIONS['4-3-3'];
}

export function getFormationKeys() {
  return Object.keys(FORMATIONS);
}
