import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import Wishes from '../Wishes.vue'

vi.mock('@tauri-apps/api/core', () => ({invoke: vi.fn()}))
const {route} = vi.hoisted(() => ({route: {query: {}}}))
vi.mock('vue-router', () => ({useRoute: () => route}))

import {invoke} from '@tauri-apps/api/core'
const invokeMock = vi.mocked(invoke)

const wishlist = [{weapon: 1, head: 1, chest: 1, arms: 1, waist: 1, legs: 1}]

beforeEach(() => {
  route.query = {}
  invokeMock.mockReset()
  invokeMock.mockImplementation((cmd) => {
    if (cmd === 'load_wishlist') return Promise.resolve(wishlist)
    if (cmd === 'load_owned_materials') return Promise.resolve({203: 1})
    return Promise.resolve()
  })
})

async function mountPage() {
  const wrapper = mount(Wishes, {
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

describe('Wishes.vue', () => {
  it('affiche les pièces du set sélectionné', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Weapon : Iron Sword')
    expect(wrapper.text()).toContain('Head : Leather Headgear')
  })

  it('affiche les matériaux requis avec leur quantité', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Materials required (2)')
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].findAll('td')[0].text()).toBe('Iron Ore')
    expect(rows[0].findAll('td')[1].text()).toBe('8')
    expect(rows[0].findAll('td')[3].text()).toBe('7')
    expect(rows[1].findAll('td')[0].text()).toBe('Warm Pelt')
    expect(rows[1].findAll('td')[1].text()).toBe('5')
    expect(rows[1].findAll('td')[3].text()).toBe('5')
  })

  it('préremplit les inputs avec les quantités possédées chargées', async () => {
    const wrapper = await mountPage()
    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs[0].element.value).toBe('1')
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[3].text()).toBe('7')
  })

  it('diminue le restant de 1 quand on ajoute 1 matériau', async () => {
    const wrapper = await mountPage()
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('2')
    await inputs[0].trigger('change')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[3].text()).toBe('6')
  })

  it('ne descend jamais le restant sous 0', async () => {
    const wrapper = await mountPage()
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('99')
    await inputs[0].trigger('change')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[3].text()).toBe('0')
  })

  it('ignore les valeurs négatives dans le nombre possédé', async () => {
    const wrapper = await mountPage()
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('-3')
    await inputs[0].trigger('change')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[3].text()).toBe('8')
  })

  it('sauvegarde la map des matériaux possédés via invoke', async () => {
    const wrapper = await mountPage()
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('6')
    await inputs[0].trigger('change')
    await flushPromises()
    expect(invokeMock).toHaveBeenCalledWith('save_owned_materials', {
      game: 'mh4u',
      owned: {203: 6},
    })
  })

  it('charge le wishlist et les matériaux au montage', async () => {
    await mountPage()
    expect(invokeMock).toHaveBeenCalledWith('load_wishlist', {game: 'mh4u'})
    expect(invokeMock).toHaveBeenCalledWith('load_owned_materials', {game: 'mh4u'})
  })

  it('supprime le set sélectionné via invoke', async () => {
    const wrapper = await mountPage()
    invokeMock.mockImplementation((cmd) => {
      if (cmd === 'load_wishlist') return Promise.resolve([])
      return Promise.resolve()
    })

    await wrapper.find('.delete-set').trigger('click')
    await flushPromises()

    expect(invokeMock).toHaveBeenCalledWith('remove_from_wishlist', {
      game: 'mh4u',
      index: 0,
    })
    expect(wrapper.text()).toContain('No saved sets.')
  })

  it('désactive le bouton de suppression quand aucun set n\'existe', async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === 'load_wishlist') return Promise.resolve([])
      if (cmd === 'load_owned_materials') return Promise.resolve({})
      return Promise.resolve()
    })
    const wrapper = await mountPage()
    expect(wrapper.find('.delete-set').attributes('disabled')).toBeDefined()
  })

  it('charge le jeu demandé via le paramètre de route', async () => {
    route.query = {game: 'mhgu'}
    await mountPage()
    expect(invokeMock).toHaveBeenCalledWith('load_wishlist', {game: 'mhgu'})
    expect(invokeMock).toHaveBeenCalledWith('load_owned_materials', {game: 'mhgu'})
  })
})