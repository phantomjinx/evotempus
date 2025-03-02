import { expect, test } from '@jest/globals'
import { hints } from './support.test'
import { hintService, HintService } from './hint.service'
import { Hint } from '@evotempus/types'

beforeEach(() => {
  hintService.setHints(hints)
})

describe('hint.service.test', () => {
  test('should throw error if hints is null', () => {
    const noHints = null
    const emptyHS = new HintService()
    expect(() => {
      // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
      emptyHS.setHints(noHints!)
    }).toThrow(Error)
  })

  test('should set the hints of the hint service', () => {
    for (let i = 0; i < hints.length; ++i) {
      expect(hintService['hints']).toHaveProperty(hints[i]._id)
    }
  })

  test('should get kind ids', () => {
    expect(hintService.getKindIds()).toEqual([hints[0]._id, hints[1]._id, hints[2]._id])
  })

  test('should get category ids', () => {
    expect(hintService.getCategoryIds()).toEqual([hints[3]._id, hints[4]._id, hints[5]._id, hints[6]._id, hints[7]._id])
  })

  test('should get tag ids', () => {
    expect(hintService.getTagIds()).toEqual([hints[8]._id, hints[9]._id, hints[10]._id])
  })

  test('should get hints by name', () => {
    for (let i = 0; i < hints.length; ++i) {
      const hintPartial: Partial<Hint> = {
        colour: hints[i].colour,
        link: hints[i].link,
        order: hints[i].order,
        type: hints[i].type,
        parent: hints[i].parent,
      }
      expect(hintService.getHint(hints[i]._id)).toEqual(hintPartial)
    }
  })

  test('should throw error on invalid hint name', () => {
    expect(() => {
      hintService.getHint('ppppp')
    }).toThrow(Error)
  })

  function hintMatcher(hint: Hint): string | RegExp {
    return (hint.colour.length > 0) ? hint.colour : /#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]/
  }

  test('should calculate hint colour', () => {
    for (let i = 0; i < hints.length; ++i) {
      expect(hintService.calcColour(hints[i]._id)).toMatch(hintMatcher(hints[i]))
    }
  })

  test('should calculate hint colours', () => {
    const hintIds: string[] = hints.map((hint: Hint) => {
      return hint._id
    })

    const colours: string[] = hintService.calcColours(hintIds)
    expect(colours.length).toEqual(hints.length)
    for (let i = 0; i < hints.length; ++i) {
      expect(colours[i]).toMatch(hintMatcher(hints[i]))
    }
  })
})
