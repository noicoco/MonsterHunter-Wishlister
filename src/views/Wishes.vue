<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {invoke} from "@tauri-apps/api/core";
import {useRoute} from "vue-router";
import {buildDisplaySet, buildMaterials, clampCount, neededOf} from '../utils/gameData'
import {games} from '../utils/games'

const route = useRoute()

const gameId = ref(games.some(g => g.id === route.query.game) ? route.query.game : 'mh4u')
const sets = ref([])
const selectedSet = ref(0)
const owned = reactive({})

const currentGame = computed(() => games.find(g => g.id === gameId.value))

async function load() {
  try {
    sets.value = await invoke('load_wishlist', {game: gameId.value})
    selectedSet.value = 0
    const stored = await invoke('load_owned_materials', {game: gameId.value})
    Object.keys(owned).forEach(key => delete owned[key])
    Object.assign(owned, stored)
  } catch (err) {
    console.error('Failed to load wishlist:', err)
  }
}

const displaySet = computed(() => buildDisplaySet(currentGame.value, sets.value[selectedSet.value]))

const setMaterials = computed(() => buildMaterials(currentGame.value, sets.value[selectedSet.value]))

function ownedOf(m) {
  return owned[m.id] ?? 0
}

async function updateOwned(m, raw) {
  try {
    owned[m.id] = clampCount(raw)
    await invoke('save_owned_materials', {game: gameId.value, owned: {...owned}})
  } catch (err) {
    console.error('Failed to save owned materials:', err)
  }
}

async function deleteSelectedSet() {
  if (!sets.value.length) return
  const index = selectedSet.value
  try {
    await invoke('remove_from_wishlist', {game: gameId.value, index})
    sets.value = await invoke('load_wishlist', {game: gameId.value})
    selectedSet.value = Math.min(index, Math.max(0, sets.value.length - 1))
  } catch (err) {
    console.error('Failed to delete wishlist set:', err)
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>Wishlist</h1>
      <router-link :to="`/${gameId}`">Create a set</router-link>
    </header>

    <div class="game-tabs">
      <button
          v-for="g in games"
          :key="g.id"
          type="button"
          :class="{ active: g.id === gameId }"
          @click="gameId = g.id; load()"
      >
        {{ g.label }}
      </button>
    </div>

    <div class="set-toolbar">
      <label for="set-select">Set</label>
      <select id="set-select" v-model.number="selectedSet">
        <option v-for="(s, i) in sets" :key="i" :value="i">
          Set {{ i + 1 }}
        </option>
      </select>
      <button
          type="button"
          class="delete-set"
          :disabled="!sets.length"
          @click="deleteSelectedSet"
      >
        Delete
      </button>
    </div>

    <div v-if="displaySet">
      <div class="set-pieces">
        <div>Weapon : {{ displaySet.weapon }}</div>
        <div>Head : {{ displaySet.head }}</div>
        <div>Chest : {{ displaySet.chest }}</div>
        <div>Arms : {{ displaySet.arms }}</div>
        <div>Waist : {{ displaySet.waist }}</div>
        <div>Legs : {{ displaySet.legs }}</div>
      </div>

      <h2>Materials required ({{ setMaterials.length }})</h2>
      <table class="materials">
        <thead>
          <tr>
            <th>Materials</th>
            <th class="num">Required</th>
            <th class="num">Possessed</th>
            <th class="num">Remain</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in setMaterials" :key="m.id">
            <td>{{ m.name }}</td>
            <td class="num">{{ m.qty }}</td>
            <td class="num">
              <input
                  type="number"
                  min="0"
                  :value="ownedOf(m)"
                  @change="updateOwned(m, $event.target.value)"
              />
            </td>
            <td class="num">{{ neededOf(m.qty, ownedOf(m)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty">No saved sets.</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 860px;
  padding: 4.5em 2.5em 3em;
}

.page-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
  margin-bottom: 1.5em;
}

.page-header h1 {
  font-size: 1.8em;
  text-align: left;
}

.page-header a {
  color: #396cd8;
  text-decoration: none;
}

.page-header a:hover {
  text-decoration: underline;
}

.game-tabs {
  display: flex;
  gap: 0.5em;
  margin-bottom: 1.5em;
}

.game-tabs button {
  padding: 0.4em 0.9em;
  font-size: 0.9em;
  background: transparent;
  border: 1px solid #ccc;
  box-shadow: none;
  color: #666;
}

.game-tabs button:hover {
  border-color: #999;
  color: #333;
}

.game-tabs button.active,
.game-tabs button.active:hover {
  background: #333;
  border-color: #333;
  color: #fff;
}

.set-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75em;
  margin-bottom: 1.5em;
}

.set-toolbar label {
  color: #666;
  font-size: 0.9em;
}

.set-toolbar select {
  padding: 0.45em 0.6em;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #0f0f0f;
  font: inherit;
}

.delete-set {
  padding: 0.4em 0.8em;
  font-size: 0.85em;
  background: transparent;
  border: 1px solid #ccc;
  box-shadow: none;
  color: #a33;
}

.delete-set:hover:not(:disabled) {
  border-color: #a33;
}

.delete-set:disabled {
  opacity: 0.5;
  cursor: default;
}

.set-pieces {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4em 2em;
  padding: 0.75em 0;
  border-bottom: 1px solid #ddd;
  font-size: 0.95em;
}

h2 {
  margin: 1.75em 0 0.6em;
  font-size: 1.25em;
}

.materials {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.materials th,
.materials td {
  padding: 0.55em 0.5em;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.materials th {
  font-size: 0.8em;
  font-weight: 600;
  color: #777;
  text-transform: uppercase;
}

.materials .num {
  text-align: right;
}

.materials input {
  width: 5em;
  padding: 0.3em 0.4em;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #0f0f0f;
  font: inherit;
  text-align: right;
  box-shadow: none;
}

.materials tbody tr:hover {
  background: #f0f0f0;
}

.empty {
  padding: 1em 0;
  color: #666;
}

@media (max-width: 720px) {
  .page {
    padding: 4em 1em 2.5em;
  }

  .set-pieces {
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  .page-header a {
    color: #9db4ff;
  }

  .game-tabs button {
    border-color: #555;
    color: #aaa;
  }

  .game-tabs button:hover {
    border-color: #888;
    color: #fff;
  }

  .game-tabs button.active,
  .game-tabs button.active:hover {
    background: #396cd8;
    border-color: #396cd8;
    color: #fff;
  }

  .set-toolbar label {
    color: #aaa;
  }

  .set-toolbar select {
    background: #2f2f2f;
    border-color: #555;
    color: #f6f6f6;
  }

  .delete-set {
    border-color: #555;
    color: #ff9b9b;
  }

  .delete-set:hover:not(:disabled) {
    border-color: #ff9b9b;
  }

  .set-pieces {
    border-color: #555;
  }

  .materials th,
  .materials td {
    border-color: #555;
  }

  .materials th {
    color: #aaa;
  }

  .materials input {
    background: #2f2f2f;
    border-color: #555;
    color: #f6f6f6;
  }

  .materials tbody tr:hover {
    background: #3a3a3a;
  }

  .empty {
    color: #aaa;
  }
}
</style>