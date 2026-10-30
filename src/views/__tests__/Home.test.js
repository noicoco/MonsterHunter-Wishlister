import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import Home from '../Home.vue'

vi.mock('@tauri-apps/api/core', () => ({invoke: vi.fn()}))

import {invoke} from '@tauri-apps/api/core'
const invokeMock = vi.mocked(invoke)

const mh4uWishlist = [{weapon: 1, head: 1, chest: 1, arms: 1, waist: 1, legs: 1}]

function mockGames({mh4uSets = mh4uWishlist, mhguSets = [], owned = {203: 1}} = {}) {
  invokeMock.mockImplementation((cmd, args) => {
    if (cmd === 'load_wishlist') {
      return Promise.resolve(args.game === 'mh4u' ? mh4uSets : mhguSets)
    }
    if (cmd === 'load_owned_materials') {
      return Promise.resolve(args.game === 'mh4u' ? owned : {})
    }
    return Promise.resolve()
  })
}

async function mountPage() {
  const wrapper = mount(Home, {
    global: {
      stubs: {
        'router-link': {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  invokeMock.mockReset()
  mockGames()
})

describe('Home.vue', () => {
  it('charge la wishlist et les matériaux des deux jeux', async () => {
    await mountPage()
    expect(invokeMock).toHaveBeenCalledWith('load_wishlist', {game: 'mh4u'})
    expect(invokeMock).toHaveBeenCalledWith('load_wishlist', {game: 'mhgu'})
    expect(invokeMock).toHaveBeenCalledWith('load_owned_materials', {game: 'mh4u'})
    expect(invokeMock).toHaveBeenCalledWith('load_owned_materials', {game: 'mhgu'})
  })

  it('affiche le nombre de sets et les matériaux restants par jeu', async () => {
    const wrapper = await mountPage()
    const rows = wrapper.findAll('.game-row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('1 set')
    expect(rows[0].text()).toMatch(/2\s+(matériaux|materials)/)
    expect(rows[0].text()).toContain('8 %')
    expect(rows[1].text()).toContain('0 set')
  })

  it('affiche les matériaux à farmer avec leurs quantités', async () => {
    const wrapper = await mountPage()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].findAll('td').map(cell => cell.text())).toEqual(['Iron Ore', 'MH4U', '8', '1', '7'])
    expect(rows[1].findAll('td').map(cell => cell.text())).toEqual(['Warm Pelt', 'MH4U', '5', '0', '5'])
  })

  it('affiche un état vide quand aucun set n\'existe', async () => {
    mockGames({mh4uSets: [], mhguSets: [], owned: {}})
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('No sets saved')
    expect(wrapper.findAll('.empty a').map(link => link.text())).toEqual(['MH4U', 'MHGU'])
  })

  it('affiche un message quand tous les matériaux sont collectés', async () => {
    mockGames({owned: {203: 999, 356: 999}})
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('All materials collected')
  })
})
