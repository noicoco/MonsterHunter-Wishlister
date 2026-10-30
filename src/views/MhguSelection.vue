<script setup>
import weapons from '../assets/armes_gu.json'
import armors from '../assets/armures_gu.json'
import {computed, ref} from 'vue'
import {invoke} from "@tauri-apps/api/core"

const headArmors = computed(() => armors.filter(a => a.slot_type === 'Head'))
const chestArmors = computed(() => armors.filter(a => a.slot_type === 'Chest'))
const armsArmors = computed(() => armors.filter(a => a.slot_type === 'Arms'))
const waistArmors = computed(() => armors.filter(a => a.slot_type === 'Waist'))
const legsArmors = computed(() => armors.filter(a => a.slot_type === 'Legs'))

const weaponSelect = ref(null)
const headSelect = ref(null)
const chestSelect = ref(null)
const armsSelect = ref(null)
const waistSelect = ref(null)
const legsSelect = ref(null)
const GAME = 'mhgu'

async function saveWishes() {
  try {
    const data = {
      weapon: parseInt(weaponSelect.value?.value),
      head: parseInt(headSelect.value?.value),
      chest: parseInt(chestSelect.value?.value),
      arms: parseInt(armsSelect.value?.value),
      waist: parseInt(waistSelect.value?.value),
      legs: parseInt(legsSelect.value?.value)
    }
    await invoke('add_to_wishlist', { game: GAME, selection: data })
  } catch (err) {
    console.error('Failed to save wish:', err)
  }
}

async function resetWishes() {
  try {
    await invoke('clear_wishlist', { game: GAME })
  } catch (err) {
    console.error('Failed to reset wishlist:', err)
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>MHGU</h1>
      <router-link to="/wishlist?game=mhgu">See the wishlist</router-link>
    </header>

    <form class="set-form" @submit.prevent="saveWishes">
      <div class="form-row">
        <label for="mhgu-weapon">Weapon</label>
        <select id="mhgu-weapon" ref="weaponSelect">
          <option v-for="weapon in weapons" :key="weapon.id" :value="weapon.id">
            {{ weapon.weapon_name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="mhgu-head">Head</label>
        <select id="mhgu-head" ref="headSelect">
          <option v-for="armor in headArmors" :key="armor.id" :value="armor.id">
            {{ armor.armor_name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="mhgu-chest">Chest</label>
        <select id="mhgu-chest" ref="chestSelect">
          <option v-for="armor in chestArmors" :key="armor.id" :value="armor.id">
            {{ armor.armor_name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="mhgu-arms">Arms</label>
        <select id="mhgu-arms" ref="armsSelect">
          <option v-for="armor in armsArmors" :key="armor.id" :value="armor.id">
            {{ armor.armor_name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="mhgu-waist">Waist</label>
        <select id="mhgu-waist" ref="waistSelect">
          <option v-for="armor in waistArmors" :key="armor.id" :value="armor.id">
            {{ armor.armor_name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="mhgu-legs">Legs</label>
        <select id="mhgu-legs" ref="legsSelect">
          <option v-for="armor in legsArmors" :key="armor.id" :value="armor.id">
            {{ armor.armor_name }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" class="primary">Add to your wishlist</button>
        <button type="button" class="secondary" @click="resetWishes">Clear the wishlist</button>
      </div>
    </form>
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

.set-form {
  max-width: 560px;
  margin-top: 1.5em;
}

.form-row {
  display: grid;
  grid-template-columns: 6em minmax(0, 1fr);
  align-items: center;
  gap: 1em;
  padding: 0.55em 0;
  border-bottom: 1px solid #ddd;
}

.form-row label {
  color: #666;
  font-size: 0.9em;
}

.form-row select {
  width: 100%;
  padding: 0.45em 0.6em;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #0f0f0f;
  font: inherit;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75em;
  margin-top: 1.5em;
}

.form-actions button {
  font-size: 0.9em;
  padding: 0.55em 1em;
}

.form-actions .primary {
  background: #333;
  color: #fff;
}

.form-actions .primary:hover {
  background: #555;
  border-color: #555;
}

.form-actions .secondary {
  background: transparent;
  border: 1px solid #ccc;
  box-shadow: none;
  color: #555;
}

.form-actions .secondary:hover {
  border-color: #999;
  color: #333;
}

@media (max-width: 720px) {
  .page {
    padding: 4em 1em 2.5em;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0.25em;
  }
}

@media (prefers-color-scheme: dark) {
  .page-header a {
    color: #9db4ff;
  }

  .form-row {
    border-color: #555;
  }

  .form-row label {
    color: #aaa;
  }

  .form-row select {
    background: #2f2f2f;
    border-color: #555;
    color: #f6f6f6;
  }

  .form-actions .primary {
    background: #396cd8;
  }

  .form-actions .primary:hover {
    background: #4a7de8;
    border-color: #4a7de8;
  }

  .form-actions .secondary {
    border-color: #555;
    color: #ccc;
  }

  .form-actions .secondary:hover {
    border-color: #888;
    color: #fff;
  }
}
</style>
