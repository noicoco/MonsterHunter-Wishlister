export function clampCount(value) {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : parseInt(value, 10)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.floor(n))
}

export function neededOf(required, owned) {
  const req = Number.isFinite(required) ? required : 0
  const have = clampCount(owned)
  return Math.max(0, req - have)
}

export function buildDisplaySet(game, selection) {
  if (!game || !selection) return null
  return {
    weapon: game.weapons[selection.weapon - 1]?.weapon_name,
    head: game.armors[selection.head - 1]?.armor_name,
    chest: game.armors[selection.chest - 1]?.armor_name,
    arms: game.armors[selection.arms - 1]?.armor_name,
    waist: game.armors[selection.waist - 1]?.armor_name,
    legs: game.armors[selection.legs - 1]?.armor_name,
  }
}

export function buildMaterials(game, selection) {
  if (!game || !selection) return []
  const byId = new Map()
  const add = (material, qty) => {
    if (!material || !qty) return
    const name =
      game.minerals.find(m => m.id === material.material_id)?.material_name ??
      material.material_name
    const entry = byId.get(material.material_id)
    if (entry) {
      entry.qty += qty
    } else {
      byId.set(material.material_id, {id: material.material_id, name, qty})
    }
  }
  game.weapons[selection.weapon - 1]?.materials?.forEach(m => add(m, m.quantity))
  ;[selection.head, selection.chest, selection.arms, selection.waist, selection.legs].forEach(id => {
    game.armors[id - 1]?.materials?.forEach(m => add(m, m.forge_quantity))
  })
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

export function buildFarmSummary(game, sets, owned = {}) {
  const required = new Map()

  for (const selection of sets ?? []) {
    for (const material of buildMaterials(game, selection)) {
      const entry = required.get(material.id)
      if (entry) {
        entry.qty += material.qty
      } else {
        required.set(material.id, {id: material.id, name: material.name, qty: material.qty})
      }
    }
  }

  const materials = [...required.values()]
    .map(({id, name, qty}) => {
      const have = clampCount(owned?.[id])
      return {
        id,
        name,
        required: qty,
        owned: Math.min(have, qty),
        remaining: neededOf(qty, have),
      }
    })
    .sort((a, b) => b.remaining - a.remaining || a.id - b.id)

  const totalRequired = materials.reduce((sum, m) => sum + m.required, 0)
  const totalOwned = materials.reduce((sum, m) => sum + m.owned, 0)

  return {
    setCount: (sets ?? []).length,
    materials,
    remainingMaterials: materials.filter(m => m.remaining > 0).length,
    totalRequired,
    totalOwned,
    progress: totalRequired === 0 ? 0 : Math.round((totalOwned / totalRequired) * 100),
  }
}

export function buildFarmOverview(games, setsByGame = {}, ownedByGame = {}, limit = 5) {
  const summaries = {}
  const topMaterials = []

  for (const game of games ?? []) {
    const summary = buildFarmSummary(
      game,
      setsByGame?.[game.id] ?? [],
      ownedByGame?.[game.id] ?? {},
    )
    summaries[game.id] = summary

    for (const material of summary.materials) {
      if (material.remaining > 0) {
        topMaterials.push({...material, gameId: game.id, gameLabel: game.label})
      }
    }
  }

  topMaterials.sort((a, b) =>
    b.remaining - a.remaining ||
    a.gameLabel.localeCompare(b.gameLabel) ||
    a.id - b.id
  )

  return {summaries, topMaterials: topMaterials.slice(0, limit)}
}