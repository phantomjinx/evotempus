import { Hint } from '@evotempus/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const hints: Hint[] = [
  { _id: 'Animal', colour: '#b36229', link: 'Animal', order: 5, parent: '', type: 'Kind' },
  { _id: 'Event', colour: '#ff8686', link: '', order: 1, parent: '', type: 'Kind' },
  { _id: 'Geology', colour: '#919191', link: 'Geology', order: 6, parent: '', type: 'Kind' },
  { _id: 'Agmata', colour: '', link: 'Agmata', order: 0, parent: 'Animal', type: 'Category' },
  { _id: 'Agnatha', colour: '', link: 'Agnatha', order: 0, parent: 'Animal', type: 'Category' },
  { _id: 'Algae', colour: '#901236', link: 'Algae', order: 0, parent: 'Plant', type: 'Category' },
  { _id: 'Vetulicolia', colour: '', link: 'Vetulicolia', order: 0, parent: 'Animal', type: 'Category' },
  { _id: 'Zosterophyllophyta', colour: '', link: 'Zosterophyllophyta', order: 0, parent: 'Plant', type: 'Category' },
  { _id: 'Walking-With-Beasts', colour: '', link: 'Walking_with_Beasts', order: 0, parent: '', type: 'Tag' },
  { _id: 'Walking-With-Dinosaurs', colour: '', link: 'Walking_with_Dinosaurs', order: 0, parent: '', type: 'Tag' },
  { _id: 'Walking-With-Monsters', colour: '', link: 'Walking_With_Monsters', order: 0, parent: '', type: 'Tag' },
]

export { hints }
