export default {
  greeting: 'Hello {name}',
  score: [
    '{count:plural}',
    {
      plural: {
        count: {
          formatter: { style: 'unit' },
          one: '{?} point',
          other: '{?} points'
        }
      }
    }
  ],
  side: ['{side:enum}', { enum: { side: { left: 'Left', right: 'Right' } } }]
}
