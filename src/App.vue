<script setup>
import {ref} from 'vue'

const menuOpen = ref(false)
</script>

<template>
  <button class="hamburger" @click="menuOpen = !menuOpen">&#9776;</button>

  <div class="overlay" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen"></div>

  <nav class="navbar" :class="{ open: menuOpen }">
    <ul>
      <li><router-link to="/" @click="menuOpen = !menuOpen">Home</router-link></li>
      <li><router-link to="/mh4u" @click="menuOpen = !menuOpen">Mh4u</router-link></li>
      <li><router-link to="/mhgu" @click="menuOpen = !menuOpen">Mhgu</router-link></li>
      <li><router-link to="/wishlist" @click="menuOpen = !menuOpen">Wishlist</router-link></li>
      <li><router-link to="/about" @click="menuOpen = !menuOpen">About</router-link></li>
    </ul>
  </nav>

  <router-view />
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.hamburger {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1001;
  font-size: 28px;
  background: #333;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 4px;
}

.hamburger:hover {
  background: #555;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 999;
  transition: height 0.5s;
  overflow: hidden;
}



.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  background-color: #333;
  z-index: 1000;
  overflow: hidden;
  transition: height 0.5s;
}

.navbar.open {
  height: auto;
}


.navbar ul {
  list-style-type: none;
  display: flex;
  justify-content: center;
  padding-top: 25px;
}

.navbar ul li a {
  display: block;
  color: #818181;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 25px;
  transition: 0.3s;
}

.navbar ul li a:hover {
  color: #f1f1f1;
}

@media screen and (max-height: 450px) {
  .navbar ul {
    padding-top: 15px;
  }
  .navbar ul li a {
    font-size: 18px;
  }
}

body{
  padding-top: 20px;
}
</style>
