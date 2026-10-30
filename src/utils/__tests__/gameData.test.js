import {describe, expect, it} from 'vitest'
import {buildDisplaySet, buildFarmOverview, buildFarmSummary, buildMaterials, clampCount, neededOf} from '../gameData'

function fakeGame() {
  return {
    weapons: [
      {id: 1, weapon_name: 'Iron Sword', materials: [{material_id: 203, material_name: 'Iron Ore', quantity: 3}]},
    ],
    armors: [
      {id: 1, armor_name: 'Leather Head', materials: [
        {material_id: 203, material_name: 'Iron Ore', forge_quantity: 1},
        {material_id: 356, material_name: 'Warm Pelt', forge_quantity: 2},
      ]},
      {id: 2, armor_name: 'Leather Chest', materials: []},
      {id: 3, armor_name: 'Bone Arms', materials: [{material_id: 203, material_name: 'Iron Ore', forge_quantity: 5}]},
      {id: 4, armor_name: 'Waist', materials: []},
      {id: 5, armor_name: 'Legs', materials: []},
      {id: 6, armor_name: 'Spare', materials: [{material_id: 999, material_name: 'Bone', forge_quantity: 7}]},
    ],
    minerals: [
      {id: 203, material_name: 'Iron Ore (magnifié)'},
    ],
  }
}

const fullSelection = {weapon: 1, head: 1, chest: 2, arms: 3, waist: 4, legs: 5}

describe('clampCount', () => {
  it('renvoie 0 pour null/undefined/chaîne vide', () => {
    expect(clampCount(null)).toBe(0)
    expect(clampCount(undefined)).toBe(0)
    expect(clampCount('')).toBe(0)
  })

  it('renvoie 0 pour les non-nombres', () => {
    expect(clampCount('abc')).toBe(0)
    expect(clampCount(NaN)).toBe(0)
  })

  it('n\'accepte pas les valeurs négatives', () => {
    expect(clampCount(-5)).toBe(0)
    expect(clampCount('-3')).toBe(0)
  })

  it('parse les chaînes numériques', () => {
    expect(clampCount('3')).toBe(3)
    expect(clampCount('3.7')).toBe(3)
  })

  it('arrondit vers le bas et garde les entiers', () => {
    expect(clampCount(3.9)).toBe(3)
    expect(clampCount(7)).toBe(7)
    expect(clampCount(0)).toBe(0)
  })
})

describe('neededOf', () => {
  it('soustrait le possédé du requis', () => {
    expect(neededOf(10, 3)).toBe(7)
  })

  it('ne descend jamais sous 0', () => {
    expect(neededOf(10, 12)).toBe(0)
    expect(neededOf(10, 99)).toBe(0)
  })

  it('renvoie le requis si rien de possédé', () => {
    expect(neededOf(3, 0)).toBe(3)
    expect(neededOf(3, null)).toBe(3)
    expect(neededOf(3, '')).toBe(3)
  })

  it('n\'accepte jamais un requis négatif', () => {
    expect(neededOf(-2, 1)).toBe(0)
    expect(neededOf(-5, -3)).toBe(0)
  })

  it('renvoie 0 si requis non fini', () => {
    expect(neededOf(NaN, 2)).toBe(0)
    expect(neededOf(undefined, 2)).toBe(0)
  })
})

describe('buildDisplaySet', () => {
  it('résout les noms des pièces à partir des ids', () => {
    const set = buildDisplaySet(fakeGame(), fullSelection)
    expect(set).toEqual({
      weapon: 'Iron Sword',
      head: 'Leather Head',
      chest: 'Leather Chest',
      arms: 'Bone Arms',
      waist: 'Waist',
      legs: 'Legs',
    })
  })

  it('renvoie null sans game ou sélection', () => {
    expect(buildDisplaySet(null, fullSelection)).toBeNull()
    expect(buildDisplaySet(fakeGame(), null)).toBeNull()
  })

  it('renvoie undefined pour un id hors liste', () => {
    const set = buildDisplaySet(fakeGame(), {weapon: 999, head: 999, chest: 999, arms: 999, waist: 999, legs: 999})
    expect(set.weapon).toBeUndefined()
    expect(set.head).toBeUndefined()
  })
})

describe('buildMaterials', () => {
  it('totalise les matériaux de l\'arme et des armures', () => {
    const mats = buildMaterials(fakeGame(), fullSelection)
    expect(mats).toEqual([
      {id: 203, name: 'Iron Ore (magnifié)', qty: 9},
      {id: 356, name: 'Warm Pelt', qty: 2},
    ])
  })

  it('utilise le nom du minerai s\'il est présent', () => {
    const mats = buildMaterials(fakeGame(), fullSelection)
    expect(mats[0].name).toBe('Iron Ore (magnifié)')
  })

  it('ignore les pièces avec un id invalide', () => {
    const mats = buildMaterials(fakeGame(), {weapon: 1, head: 1, chest: 2, arms: 3, waist: 4, legs: 999})
    expect(mats.every(m => m.id !== 999)).toBe(true)
  })

  it('dédoublonne les ids communs arme/armure', () => {
    const mats = buildMaterials(fakeGame(), fullSelection)
    const ironOre = mats.filter(m => m.id === 203)
    expect(ironOre).toHaveLength(1)
  })

  it('trie les résultats par id', () => {
    const mats = buildMaterials(fakeGame(), fullSelection)
    expect(mats[0].id).toBeLessThan(mats[1].id)
  })

  it('renvoie une liste vide sans game ou sélection', () => {
    expect(buildMaterials(null, fullSelection)).toEqual([])
    expect(buildMaterials(fakeGame(), null)).toEqual([])
  })

  it('gère des sélections sans aucun matériau', () => {
    const empty = {weapon: 2, head: 2, chest: 2, arms: 4, waist: 5, legs: 5}
    expect(buildMaterials(fakeGame(), empty)).toEqual([])
  })

  it('nombre la quantité d\'une pièce rejetée si forge_quantity est falsy', () => {
    const g = {
      weapons: [{id: 1, materials: []}],
      armors: [{id: 1, materials: [{material_id: 1, material_name: 'X', forge_quantity: 0}]}],
      minerals: [],
    }
    expect(buildMaterials(g, {weapon: 1, head: 1, chest: 1, arms: 1, waist: 1, legs: 1})).toEqual([])
  })
})

describe('buildFarmSummary', () => {
  const sets = [fullSelection, fullSelection]

  it('agrège les besoins de tous les sets', () => {
    const summary = buildFarmSummary(fakeGame(), sets)
    expect(summary.setCount).toBe(2)
    const iron = summary.materials.find(m => m.id === 203)
    expect(iron.required).toBe(18)
    expect(iron.remaining).toBe(18)
  })

  it('soustrait les matériaux possédés une seule fois', () => {
    const summary = buildFarmSummary(fakeGame(), sets, {203: 5})
    const iron = summary.materials.find(m => m.id === 203)
    expect(iron.owned).toBe(5)
    expect(iron.remaining).toBe(13)
  })

  it('calcule la progression globale', () => {
    const summary = buildFarmSummary(fakeGame(), sets, {203: 5, 356: 1})
    expect(summary.totalRequired).toBe(22)
    expect(summary.totalOwned).toBe(6)
    expect(summary.progress).toBe(27)
  })

  it('compte les matériaux encore manquants', () => {
    const summary = buildFarmSummary(fakeGame(), sets, {203: 99, 356: 4})
    expect(summary.remainingMaterials).toBe(0)
    expect(summary.materials.find(m => m.id === 203).owned).toBe(18)
  })

  it('ne compte pas le surplus possédé dans la progression', () => {
    const summary = buildFarmSummary(fakeGame(), [fullSelection], {203: 99})
    expect(summary.totalOwned).toBe(9)
    expect(summary.progress).toBe(82)
  })

  it('renvoie un résumé vide sans sets', () => {
    const summary = buildFarmSummary(fakeGame(), [])
    expect(summary.setCount).toBe(0)
    expect(summary.materials).toEqual([])
    expect(summary.remainingMaterials).toBe(0)
    expect(summary.progress).toBe(0)
  })
})

describe('buildFarmOverview', () => {
  function gameA() {
    return {...fakeGame(), id: 'a', label: 'Game A'}
  }

  function gameB() {
    return {
      id: 'b',
      label: 'Game B',
      weapons: [{id: 1, materials: [{material_id: 1, material_name: 'Bone', quantity: 10}]}],
      armors: [{id: 1, materials: []}],
      minerals: [],
    }
  }

  const selection = {weapon: 1, head: 1, chest: 1, arms: 1, waist: 1, legs: 1}

  it('construit un résumé par jeu et un top global', () => {
    const {summaries, topMaterials} = buildFarmOverview(
      [gameA(), gameB()],
      {a: [fullSelection], b: [selection]},
      {},
    )
    expect(summaries.a.setCount).toBe(1)
    expect(summaries.b.setCount).toBe(1)
    expect(topMaterials[0]).toMatchObject({id: 1, name: 'Bone', gameId: 'b', remaining: 10})
    expect(topMaterials[1]).toMatchObject({id: 203, gameId: 'a', remaining: 9})
  })

  it('exclut les matériaux entièrement collectés', () => {
    const {topMaterials} = buildFarmOverview(
      [gameA()],
      {a: [fullSelection]},
      {a: {203: 99, 356: 99}},
    )
    expect(topMaterials).toEqual([])
  })

  it('limite le top au nombre demandé', () => {
    const {topMaterials} = buildFarmOverview(
      [gameA(), gameB()],
      {a: [fullSelection], b: [selection]},
      {},
      1,
    )
    expect(topMaterials).toHaveLength(1)
  })

  it('tolère des données manquantes', () => {
    const {summaries, topMaterials} = buildFarmOverview([gameA()])
    expect(summaries.a.setCount).toBe(0)
    expect(topMaterials).toEqual([])
  })
})