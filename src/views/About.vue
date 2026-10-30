<script setup>
import {onMounted, ref} from 'vue'
import {getVersion} from '@tauri-apps/api/app'
import githubLogo from '../assets/github-logo.png'

const version = ref('')

onMounted(async () => {
  try {
    version.value = await getVersion()
  } catch (err) {
    console.error('Failed to read app version:', err)
  }
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>About</h1>
    </header>

    <p class="intro">
      MhWishlister helps you track your armor sets and the materials needed for
      Monster Hunter 4 Ultimate and Monster Hunter Generations Ultimate.
    </p>

    <p class="author">
      Made by Noicoco
      <a
          class="github-link"
          href="https://github.com/noicoco"
          target="_blank"
          rel="noopener noreferrer"
      >
        <img :src="githubLogo" alt="" class="github-icon">
        GitHub
      </a>
    </p>

    <div class="legal">
      <p>MhWishlister is not affiliated with or endorsed by Capcom.</p>
      <p>Monster Hunter is a trademark of its respective owners.</p>
    </div>

    <p v-if="version" class="version">Version {{ version }}</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 860px;
  padding: 4.5em 2.5em 3em;
}

.page-header h1 {
  font-size: 1.8em;
  text-align: left;
  margin-bottom: 1.5em;
}

.intro {
  max-width: 620px;
  margin-bottom: 2em;
  line-height: 1.6;
}

.author {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75em;
  margin-bottom: 2.5em;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  color: #396cd8;
  text-decoration: none;
}

.github-link:hover {
  text-decoration: underline;
}

.github-icon {
  width: 1.4em;
  height: 1.4em;
}

.legal {
  max-width: 620px;
  padding-top: 1.5em;
  border-top: 1px solid #ddd;
  color: #666;
  font-size: 0.9em;
  line-height: 1.6;
}

.legal p + p {
  margin-top: 0.35em;
}

.version {
  margin-top: 2em;
  color: #999;
  font-size: 0.85em;
}

@media (max-width: 720px) {
  .page {
    padding: 4em 1em 2.5em;
  }
}

@media (prefers-color-scheme: dark) {
  .legal {
    border-color: #555;
    color: #aaa;
  }

  .github-link {
    color: #9db4ff;
  }

  .version {
    color: #888;
  }
}
</style>
