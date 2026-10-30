<script setup>
import {computed, onMounted, reactive, ref} from 'vue'
import {invoke} from '@tauri-apps/api/core'
import {games} from '../utils/games'
import {buildFarmOverview} from '../utils/gameData'

const loading = ref(true)
const setsByGame = reactive({})
const ownedByGame = reactive({})

const overview = computed(() => buildFarmOverview(games, setsByGame, ownedByGame))
const summaries = computed(() => overview.value.summaries)
const topMaterials = computed(() => overview.value.topMaterials)
const totalSets = computed(() =>
  games.reduce((sum, game) => sum + (setsByGame[game.id]?.length ?? 0), 0)
)

function plural(count, one, many) {
  return count > 1 ? many : one
}

async function load() {
  loading.value = true
  try {
    const results = await Promise.all(
      games.flatMap(game => [
        invoke('load_wishlist', {game: game.id}),
        invoke('load_owned_materials', {game: game.id}),
      ])
    )
    games.forEach((game, index) => {
      setsByGame[game.id] = results[index * 2] ?? []
      ownedByGame[game.id] = results[index * 2 + 1] ?? {}
    })
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="home">
    <header class="page-header">
      <h1>MhWishlister</h1>
      <router-link to="/wishlist">Open the wishlist</router-link>
    </header>

    <section class="games">
      <div v-for="game in games" :key="game.id" class="game-row">
        <div class="game-info">
          <strong>{{ game.label }}</strong>
          <span>
            {{ summaries[game.id]?.setCount ?? 0 }}
            {{ plural(summaries[game.id]?.setCount ?? 0, 'set', 'sets') }}
          </span>
          <span>
            {{ summaries[game.id]?.remainingMaterials ?? 0 }}
            {{ plural(summaries[game.id]?.remainingMaterials ?? 0, 'material', 'materials') }} to farm
          </span>
          <span>{{ summaries[game.id]?.progress ?? 0 }} % collected</span>
        </div>
        <div class="game-links">
          <router-link :to="{ path: '/wishlist', query: { game: game.id } }">See the sets</router-link>
          <router-link :to="`/${game.id}`">Create a set</router-link>
        </div>
      </div>
    </section>

    <section class="farm">
      <h2>Materials to farm</h2>

      <table v-if="topMaterials.length">
        <thead>
          <tr>
            <th>Materials</th>
            <th>Game</th>
            <th class="num">Required</th>
            <th class="num">Possessed</th>
            <th class="num">Remain</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="material in topMaterials" :key="`${material.gameId}-${material.id}`">
            <td>{{ material.name }}</td>
            <td>{{ material.gameLabel }}</td>
            <td class="num">{{ material.required }}</td>
            <td class="num">{{ material.owned }}</td>
            <td class="num">{{ material.remaining }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else-if="!loading && totalSets === 0" class="empty">
        No sets saved. Create your first set:
        <router-link to="/mh4u">MH4U</router-link> or
        <router-link to="/mhgu">MHGU</router-link>.
      </p>
      <p v-else-if="!loading" class="empty">All materials collected.</p>
      <p v-else class="empty">Loading…</p>
    </section>
  </div>
</template>

<style scoped>
.home {
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

.page-header a,
.game-links a,
.empty a {
  color: #396cd8;
  text-decoration: none;
}

.page-header a:hover,
.game-links a:hover,
.empty a:hover {
  text-decoration: underline;
}

.game-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
  padding: 0.7em 0;
  border-bottom: 1px solid #ddd;
}

.game-info {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35em 1.2em;
}

.game-info strong {
  min-width: 3.5em;
}

.game-info span {
  color: #666;
  font-size: 0.92em;
}

.game-links {
  display: flex;
  flex-shrink: 0;
  gap: 1em;
  font-size: 0.9em;
}

.farm {
  margin-top: 2.5em;
}

.farm h2 {
  font-size: 1.25em;
  margin-bottom: 0.6em;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

th,
td {
  padding: 0.55em 0.5em;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

th {
  font-size: 0.8em;
  font-weight: 600;
  color: #777;
  text-transform: uppercase;
}

th.num,
td.num {
  text-align: right;
}

tbody tr:hover {
  background: #f0f0f0;
}

.empty {
  padding: 1em 0;
  color: #666;
}

@media (max-width: 720px) {
  .home {
    padding: 4em 1em 2.5em;
  }

  .game-row {
    flex-direction: column;
    gap: 0.4em;
  }
}

@media (prefers-color-scheme: dark) {
  .game-row,
  th,
  td {
    border-color: #555;
  }

  .game-info span,
  th,
  .empty {
    color: #aaa;
  }

  .page-header a,
  .game-links a,
  .empty a {
    color: #9db4ff;
  }

  tbody tr:hover {
    background: #3a3a3a;
  }
}
</style>
